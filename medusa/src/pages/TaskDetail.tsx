import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  ArrowLeft,
  Send,
  Play,
  Pause,
  FileCode,
  MessageSquare,
  GitBranch,
  GitMerge,
  GitCommit,
  FolderOpen,
  Bot,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  Wrench,
  SendHorizonal,
  X,
  Pencil,
  Check,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Task, TaskStatus, TaskCommit } from '../types';
import { MarkdownRenderer } from '../components/chat/MarkdownRenderer';

interface AgentOutputEvent {
  task_id: string;
  line: string;
  is_error: boolean;
}

interface ParsedMessage {
  type: 'system' | 'assistant' | 'tool' | 'result' | 'error' | 'raw' | 'user';
  content: string;
  timestamp: Date;
  toolName?: string;
  isSuccess?: boolean;
}

// Helper to extract text from various content formats
function extractTextContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text || '')
      .join('\n');
  }
  return '';
}

// Format tool usage in a friendly way
function formatToolUsage(toolName: string, input: any): string {
  switch (toolName) {
    case 'Read':
      return `Reading ${input?.file_path || 'file'}`;
    case 'Edit':
      return `Editing ${input?.file_path || 'file'}`;
    case 'Write':
      return `Writing ${input?.file_path || 'file'}`;
    case 'Bash':
      const cmd = input?.command || '';
      return `Running: ${cmd.length > 50 ? cmd.slice(0, 50) + '...' : cmd}`;
    case 'Glob':
      return `Searching for ${input?.pattern || 'files'}`;
    case 'Grep':
      return `Searching for "${input?.pattern || ''}"`;
    case 'Task':
      return `Starting subtask: ${input?.description || 'task'}`;
    case 'TodoWrite':
      return 'Updating task list';
    case 'WebSearch':
      return `Searching web: ${input?.query || ''}`;
    case 'WebFetch':
      return `Fetching ${input?.url || 'URL'}`;
    default:
      return `Using ${toolName}`;
  }
}

function parseClaudeLine(line: string): ParsedMessage | null {
  try {
    const data = JSON.parse(line);

    // Parse user messages (from saved session file)
    if (data.type === 'user' && data.message?.content) {
      const content = typeof data.message.content === 'string'
        ? data.message.content
        : extractTextContent(data.message.content);
      if (content && content.trim()) {
        return {
          type: 'user',
          content: content,
          timestamp: new Date(),
        };
      }
    }

    // Show assistant text messages
    if (data.type === 'assistant' && data.message?.content) {
      const content = data.message.content;

      // Check for text content first
      const textContent = extractTextContent(content);
      if (textContent && textContent.trim()) {
        return {
          type: 'assistant',
          content: textContent,
          timestamp: new Date(),
        };
      }

      // Show tool usage in a friendly way
      if (Array.isArray(content)) {
        const toolUse = content.find((c: any) => c.type === 'tool_use');
        if (toolUse) {
          return {
            type: 'tool',
            content: formatToolUsage(toolUse.name, toolUse.input),
            toolName: toolUse.name,
            timestamp: new Date(),
          };
        }
      }
    }

    // Skip result messages and other noise
    return null;
  } catch {
    return null;
  }
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'diff'>('chat');
  const [commits, setCommits] = useState<TaskCommit[]>([]);
  const [editingCommit, setEditingCommit] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [committing, setCommitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear selected file when it's no longer in the changed files list
  useEffect(() => {
    if (selectedFile && !changedFiles.includes(selectedFile)) {
      setSelectedFile(null);
      setFileDiff('');
    }
  }, [changedFiles, selectedFile]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const processedLinesRef = useRef<Set<string>>(new Set());

  const loadTask = useCallback(async () => {
    if (!id) return;
    try {
      const t = await invoke<Task | null>('get_task', { id });
      setTask(t);

      // Check if agent has active session
      const active = await invoke<boolean>('has_active_agent_session', { taskId: id });
      setHasActiveSession(active);

      // Load changed files if task has worktree
      if (t?.worktree_path) {
        try {
          const files = await invoke<string[]>('get_task_changed_files', { taskId: id });
          setChangedFiles(files);
        } catch (e) {
          console.error('Failed to load changed files:', e);
        }

        // Load commits if in Review status
        if (t?.status === TaskStatus.Review) {
          try {
            const taskCommits = await invoke<TaskCommit[]>('get_task_commits', { taskId: id });
            setCommits(taskCommits);
          } catch (e) {
            console.error('Failed to load commits:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load initial data
  useEffect(() => {
    // Reset tracking and states when task changes
    processedLinesRef.current.clear();
    setMessages([]);
    
    loadTask();

    // Load existing output
    const loadOutput = async () => {
      if (!id) return;
      try {
        const lines = await invoke<string[]>('get_task_agent_output', { taskId: id });

        // Mark all loaded lines as processed to avoid duplicates from events
        lines.forEach(line => processedLinesRef.current.add(line));

        const parsed = lines.map(parseClaudeLine).filter((m): m is ParsedMessage => m !== null);
        setMessages(parsed);

        // Ensure thinking is reset when loading existing conversation
        
        // Auto-scroll to bottom after loading
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 100);
      } catch (e) {
        console.error('Failed to load output:', e);
      }
    };
    loadOutput();
  }, [id, loadTask]);

  // Listen for agent output
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let unlistenFn: (() => void) | null = null;

    listen<AgentOutputEvent>('agent-output', (event) => {
      if (!isMounted) return;
      if (event.payload.task_id === id) {
        // Skip if we've already processed this line
        if (processedLinesRef.current.has(event.payload.line)) {
          return;
        }
        processedLinesRef.current.add(event.payload.line);

        const parsed = parseClaudeLine(event.payload.line);
        if (parsed) {
          setMessages((prev) => [...prev, parsed]);
        }
      }
    }).then((fn) => {
      unlistenFn = fn;
      // If component unmounted while we were setting up, cleanup immediately
      if (!isMounted) fn();
    });

    return () => {
      isMounted = false;
      if (unlistenFn) unlistenFn();
    };
  }, [id]);

  // Listen for agent status changes
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let unlistenFn: (() => void) | null = null;

    listen('agent-status', () => {
      if (!isMounted) return;
      loadTask();
    }).then((fn) => {
      unlistenFn = fn;
      if (!isMounted) fn();
    });

    return () => {
      isMounted = false;
      if (unlistenFn) unlistenFn();
    };
  }, [id, loadTask]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for task updates
  useEffect(() => {
    const interval = setInterval(loadTask, 3000); // Standardized polling interval
    return () => clearInterval(interval);
  }, [loadTask]);

  const handleStartAgent = async () => {
    if (!task) return;
    try {
      await invoke('start_task_agent', { taskId: task.id });
      loadTask();
    } catch (error) {
      console.error('Failed to start agent:', error);
      alert(`Failed to start agent: ${error}`);
    }
  };

  const handleStopAgent = async () => {
    if (!task) return;
    try {
      await invoke('stop_task_agent', { taskId: task.id });
      loadTask();
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  const handleSendToReview = async () => {
    if (!task) return;
    try {
      setCommitting(true);
      // This will auto-commit using Claude Code if there are uncommitted changes
      await invoke('send_task_to_review', { taskId: task.id });
      loadTask();
    } catch (error) {
      console.error('Failed to send to review:', error);
      alert(`Failed to send to review: ${error}`);
    } finally {
      setCommitting(false);
    }
  };

  const handleAmendCommit = async () => {
    if (!task || !editedMessage.trim()) return;
    try {
      await invoke('amend_task_commit', { taskId: task.id, newMessage: editedMessage.trim() });
      setEditingCommit(null);
      setEditedMessage('');
      loadTask(); // Reload to get updated commits
    } catch (error) {
      console.error('Failed to amend commit:', error);
      alert(`Failed to amend commit: ${error}`);
    }
  };

  const startEditingCommit = (commit: TaskCommit) => {
    setEditingCommit(commit.hash);
    setEditedMessage(commit.message);
  };

  const cancelEditingCommit = () => {
    setEditingCommit(null);
    setEditedMessage('');
  };

  const handleMerge = async () => {
    if (!task) return;
    if (!confirm(`Merge branch "${task.branch}" into main and mark task as done?`)) return;
    try {
      await invoke('merge_task', { taskId: task.id });
      navigate('/');
    } catch (error) {
      console.error('Failed to merge:', error);
      alert(`Failed to merge: ${error}`);
    }
  };

  const handleReject = async () => {
    if (!task) return;
    if (!confirm('Reject this task? All changes will be discarded and the worktree will be removed.')) return;
    try {
      await invoke('reject_task', { taskId: task.id });
      navigate('/');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert(`Failed to reject: ${error}`);
    }
  };

  const handleContinueWorking = async () => {
    if (!task) return;
    try {
      await invoke('update_task_status', { id: task.id, status: TaskStatus.InProgress });
      loadTask();
    } catch (error) {
      console.error('Failed to move back to in progress:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!task || !inputValue.trim() || sending) return;

    setSending(true);
    try {
      // Add user message to UI immediately
      setMessages((prev) => [
        ...prev,
        { type: 'user', content: inputValue.trim(), timestamp: new Date() },
      ]);

            await invoke('send_agent_message', { taskId: task.id, message: inputValue.trim() });
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error}`);
          } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectFile = async (file: string) => {
    if (!task) return;
    setSelectedFile(file);
    try {
      const diff = await invoke<string>('get_task_file_diff', { taskId: task.id, filePath: file });
      setFileDiff(diff);
    } catch (error) {
      console.error('Failed to load file diff:', error);
      setFileDiff('');
    }
  };

  const getMessageIcon = (msg: ParsedMessage) => {
    switch (msg.type) {
      case 'user':
        return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'assistant':
        return <Bot className="w-4 h-4 text-primary" />;
      case 'tool':
        return <Wrench className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Bot className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Task not found</p>
          <button onClick={() => navigate('/')} className="text-primary hover:underline">
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  // Agent is truly running only if we have an active session
  const isRunning = !!task.agent_pid && hasActiveSession;
  // Can resume if there's a session_id but no active session
  const canResume = !!task.session_id && !hasActiveSession;
  const canSendMessage = hasActiveSession && !sending;
  const projectName = task.project_path.split('/').pop() || 'Unknown';

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <header className="border-b border-border px-6 py-3 shrink-0 bg-background z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground">{task.title}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" />
                  {projectName}
                </span>
                {task.branch && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {task.branch}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {task.status === TaskStatus.Done ? (
              <span className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" />
                Completed
              </span>
            ) : task.status === TaskStatus.Review ? (
              <>
                {task.branch && (
                  <span className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded font-mono">
                    <GitBranch className="w-3 h-3" />
                    {task.branch}
                  </span>
                )}
                <button
                  onClick={handleContinueWorking}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Continue Working
                </button>
                <button
                  onClick={handleMerge}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <GitMerge className="w-4 h-4" />
                  Merge
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </>
            ) : isRunning ? (
              <>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                  Running
                </span>
                <button
                  onClick={handleStopAgent}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              </>
            ) : canResume ? (
              <>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Paused
                </span>
                <button
                  onClick={handleStartAgent}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
                {changedFiles.length > 0 && (
                  committing ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Committing changes...
                    </div>
                  ) : (
                    <button
                      onClick={handleSendToReview}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <SendHorizonal className="w-4 h-4" />
                      Send to Review
                    </button>
                  )
                )}
              </>
            ) : (
              <button
                onClick={handleStartAgent}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Play className="w-4 h-4" />
                Start Agent
              </button>
            )}
            <button
              onClick={loadTask}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar - Fixed (hidden in Review and Done mode) */}
      {task.status !== TaskStatus.Review && task.status !== TaskStatus.Done && (
        <div className="border-b border-border px-6 shrink-0 bg-background">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </div>
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'diff'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Changes
                {changedFiles.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {changedFiles.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {task.status === TaskStatus.Done ? (
          /* Done Summary View */
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Completion Summary */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Task Completed</h2>
                    {task.completed_at && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(task.completed_at * 1000).toLocaleDateString()} at {new Date(task.completed_at * 1000).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Commit Message */}
                {task.diff_summary && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Commit Message</h3>
                    <p className="text-foreground bg-muted/50 rounded-lg p-3 font-mono text-sm">
                      {task.diff_summary.split('|')[0]}
                    </p>
                  </div>
                )}

                {/* Duration */}
                {task.started_at && task.completed_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Duration: {(() => {
                        const seconds = task.completed_at - task.started_at;
                        if (seconds < 60) return `${seconds} seconds`;
                        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
                        const hours = Math.floor(seconds / 3600);
                        const mins = Math.floor((seconds % 3600) / 60);
                        return `${hours}h ${mins}m`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Files Changed */}
              {task.files_changed && task.files_changed.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Files Changed ({task.files_changed.length})
                  </h3>
                  <div className="space-y-1">
                    {task.files_changed.map((file, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground font-mono py-1 px-2 bg-muted/30 rounded"
                      >
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commits */}
              {task.diff_summary && task.diff_summary.includes('|') && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <GitCommit className="w-4 h-4" />
                    Commits
                  </h3>
                  <div className="space-y-2">
                    {task.diff_summary.split('|').slice(1).join('|').split('\n').filter(l => l.trim()).map((line, index) => {
                      const parts = line.split('|');
                      const hash = parts[0];
                      const message = parts[1] || line;
                      return (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-xs">
                            {hash}
                          </span>
                          <span className="text-foreground">{message}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'chat' && task.status !== TaskStatus.Review ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {isRunning ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span>Waiting for response...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Bot className="w-12 h-12 mx-auto text-muted-foreground/50" />
                      <p>Start the agent to begin chatting</p>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.type === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {msg.type !== 'user' && (
                      <div className="shrink-0 mt-1">{getMessageIcon(msg)}</div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      {msg.type === 'assistant' ? (
                        <MarkdownRenderer content={msg.content} className="text-sm" />
                      ) : (
                        <div
                          className={`text-sm whitespace-pre-wrap break-words ${
                            msg.type === 'tool' ? 'text-muted-foreground font-mono text-xs' : ''
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}
                    </div>
                    {msg.type === 'user' && (
                      <div className="shrink-0 mt-1">{getMessageIcon(msg)}</div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - Fixed at bottom */}
            <div className="border-t border-border p-4 shrink-0 bg-background">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    canSendMessage
                      ? 'Type a message...'
                      : canResume
                      ? 'Click Resume to continue the session...'
                      : isRunning
                      ? 'Connecting...'
                      : 'Start the agent first...'
                  }
                  disabled={!canSendMessage}
                  rows={1}
                  className="flex-1 px-4 py-2 text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!canSendMessage || !inputValue.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        ) : (
          /* Diff View */
          <div className="flex-1 flex">
            {/* Sidebar: Files and Commits */}
            <div className="w-72 border-r border-border overflow-y-auto flex flex-col">
              {/* Commits Section - shown in Review mode */}
              {task.status === TaskStatus.Review && (
                <div className="border-b border-border">
                  <div className="p-3 border-b border-border bg-muted/30">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <GitCommit className="w-4 h-4" />
                      Commits
                      {commits.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {commits.length}
                        </span>
                      )}
                    </h3>
                  </div>
                  {commits.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No commits yet
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {commits.map((commit, index) => (
                        <div
                          key={commit.hash}
                          className="p-2 rounded-lg bg-card border border-border"
                        >
                          {editingCommit === commit.hash ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editedMessage}
                                onChange={(e) => setEditedMessage(e.target.value)}
                                className="w-full px-2 py-1 text-sm bg-muted border border-border rounded focus:outline-none focus:border-primary"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAmendCommit();
                                  if (e.key === 'Escape') cancelEditingCommit();
                                }}
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={handleAmendCommit}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
                                >
                                  <Check className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingCommit}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-foreground font-medium break-words flex-1">
                                  {commit.message}
                                </p>
                                {index === 0 && (
                                  <button
                                    onClick={() => startEditingCommit(commit)}
                                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded shrink-0"
                                    title="Edit commit message"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-mono">{commit.short_hash}</span>
                                <span>·</span>
                                <span>{commit.date}</span>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* File List */}
              <div className="flex-1">
                <div className="p-3 border-b border-border">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Changed Files
                    {changedFiles.length > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {changedFiles.length}
                      </span>
                    )}
                  </h3>
                </div>
                {changedFiles.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No changes yet
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {changedFiles.map((file) => (
                      <button
                        key={file}
                        onClick={() => handleSelectFile(file)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedFile === file
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 shrink-0" />
                          <span className="truncate">{file}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Diff Content */}
            <div className="flex-1 overflow-auto bg-background">
              {selectedFile ? (
                fileDiff ? (
                  <pre className="p-4 text-sm font-mono">
                    {fileDiff.split('\n')
                      .filter((line) => {
                        // Filter out diff header lines
                        if (line.startsWith('diff --git')) return false;
                        if (line.startsWith('new file mode')) return false;
                        if (line.startsWith('index ')) return false;
                        if (line.startsWith('--- ')) return false;
                        if (line.startsWith('+++ ')) return false;
                        return true;
                      })
                      .map((line, i) => {
                      let className = 'text-muted-foreground';
                      let icon = null;

                      if (line.startsWith('+')) {
                        className = 'text-green-500 bg-green-500/10';
                        icon = <Plus className="w-3 h-3 inline mr-2" />;
                      } else if (line.startsWith('-')) {
                        className = 'text-red-500 bg-red-500/10';
                        icon = <Minus className="w-3 h-3 inline mr-2" />;
                      } else if (line.startsWith('@@')) {
                        className = 'text-primary';
                      }

                      return (
                        <div key={i} className={`${className} px-2 -mx-2`}>
                          {icon}
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No changes in this file
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a file to view changes
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

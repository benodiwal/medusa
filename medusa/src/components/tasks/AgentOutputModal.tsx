import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Terminal, Copy, Check, Bot, Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Task, TaskPlan, Block, Annotation } from '../../types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { PlanViewer, ViewerHandle, AnnotationSidebar } from '../plan';
import { parseMarkdownToBlocks, exportFeedback } from '../../utils/parser';
import { useAuthor, getRandomColor } from '../../contexts/AuthorContext';
import { AuthorNameDialog } from '../share';

interface AgentOutputModalProps {
  task: Task;
  onClose: () => void;
}

interface AgentOutputEvent {
  task_id: string;
  line: string;
  is_error: boolean;
}

interface ParsedMessage {
  type: 'system' | 'assistant' | 'tool' | 'result' | 'error' | 'raw';
  content: string;
  timestamp: Date;
  toolName?: string;
  isSuccess?: boolean;
}

function parseClaudeLine(line: string): ParsedMessage | null {
  try {
    const data = JSON.parse(line);

    // System init message
    if (data.type === 'system' && data.subtype === 'init') {
      return {
        type: 'system',
        content: `Session started in ${data.cwd}`,
        timestamp: new Date(),
      };
    }

    // Assistant message
    if (data.type === 'assistant' && data.message?.content) {
      const textContent = data.message.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');

      if (textContent) {
        return {
          type: 'assistant',
          content: textContent,
          timestamp: new Date(),
        };
      }

      // Tool use
      const toolUse = data.message.content.find((c: any) => c.type === 'tool_use');
      if (toolUse) {
        return {
          type: 'tool',
          content: `Using ${toolUse.name}`,
          toolName: toolUse.name,
          timestamp: new Date(),
        };
      }
    }

    // Tool result
    if (data.type === 'user' && data.message?.content) {
      const toolResult = data.message.content.find((c: any) => c.type === 'tool_result');
      if (toolResult) {
        const content = typeof toolResult.content === 'string'
          ? toolResult.content
          : JSON.stringify(toolResult.content);
        return {
          type: 'tool',
          content: content.slice(0, 500) + (content.length > 500 ? '...' : ''),
          timestamp: new Date(),
          isSuccess: !toolResult.is_error,
        };
      }
    }

    // Final result
    if (data.type === 'result') {
      return {
        type: 'result',
        content: data.result || (data.subtype === 'success' ? 'Completed successfully' : 'Failed'),
        timestamp: new Date(),
        isSuccess: data.subtype === 'success',
      };
    }

    return null;
  } catch {
    // Not JSON, return as raw
    if (line.trim()) {
      return {
        type: 'raw',
        content: line,
        timestamp: new Date(),
      };
    }
    return null;
  }
}

export function AgentOutputModal({ task, onClose }: AgentOutputModalProps) {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Plan review state
  const [pendingPlan, setPendingPlan] = useState<TaskPlan | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const viewerRef = useRef<ViewerHandle>(null);

  const { identity, setIdentity } = useAuthor();

  // Load initial output
  useEffect(() => {
    const loadOutput = async () => {
      try {
        const lines = await invoke<string[]>('get_task_agent_output', { taskId: task.id });
        const parsed = lines
          .map(parseClaudeLine)
          .filter((m): m is ParsedMessage => m !== null);
        setMessages(parsed);
      } catch (error) {
        console.error('Failed to load agent output:', error);
      }
    };
    loadOutput();
  }, [task.id]);

  // Poll for pending plan
  useEffect(() => {
    const checkForPlan = async () => {
      try {
        const plan = await invoke<TaskPlan | null>('get_task_plan', { taskId: task.id });
        if (plan && !pendingPlan) {
          setPendingPlan(plan);
          setBlocks(parseMarkdownToBlocks(plan.content));
          // Show name dialog if no identity
          if (!identity) {
            setShowNameDialog(true);
          }
        } else if (!plan && pendingPlan) {
          // Plan was responded to
          setPendingPlan(null);
          setBlocks([]);
          setAnnotations([]);
        }
      } catch {
        // No plan available
      }
    };

    checkForPlan();
    const interval = setInterval(checkForPlan, 2000);
    return () => clearInterval(interval);
  }, [task.id, pendingPlan, identity]);

  // Listen for new output
  useEffect(() => {
    const unlisten = listen<AgentOutputEvent>('agent-output', (event) => {
      if (event.payload.task_id === task.id) {
        const parsed = parseClaudeLine(event.payload.line);
        if (parsed) {
          setMessages((prev) => [...prev, parsed]);
        }
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [task.id]);

  // Auto-scroll to bottom when not reviewing plan
  useEffect(() => {
    if (outputRef.current && !pendingPlan) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages, pendingPlan]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      const text = messages.map(m => {
        const prefix = m.type === 'assistant' ? 'Claude: ' :
                       m.type === 'tool' ? 'Tool: ' :
                       m.type === 'result' ? 'Result: ' : '';
        return prefix + m.content;
      }).join('\n\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  // Plan annotation handlers
  const handleAddAnnotation = useCallback((ann: Annotation) => {
    setAnnotations(prev => [...prev, ann]);
  }, []);

  const handleSelectAnnotation = useCallback((id: string | null) => {
    setSelectedAnnotationId(id);
  }, []);

  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    viewerRef.current?.removeHighlight(id);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  }, [selectedAnnotationId]);

  // Plan decision handlers
  const handleApprove = async () => {
    if (!pendingPlan) return;
    setIsApproving(true);
    try {
      const feedbackText = annotations.length > 0 ? exportFeedback(blocks, annotations) : undefined;
      await invoke('respond_to_task_plan', {
        taskId: task.id,
        approved: true,
        feedback: feedbackText,
      });
      setPendingPlan(null);
      setAnnotations([]);
      setBlocks([]);
    } catch (error) {
      console.error('Failed to approve plan:', error);
      alert(`Failed to approve: ${error}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!pendingPlan) return;
    if (annotations.length === 0) {
      alert('Please add at least one annotation to explain what changes you want.');
      return;
    }
    setIsApproving(true);
    try {
      const feedback = exportFeedback(blocks, annotations);
      await invoke('respond_to_task_plan', {
        taskId: task.id,
        approved: false,
        feedback,
      });
      setPendingPlan(null);
      setAnnotations([]);
      setBlocks([]);
    } catch (error) {
      console.error('Failed to reject plan:', error);
      alert(`Failed to request changes: ${error}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSetAuthorName = (name: string) => {
    const newIdentity = { name, color: identity?.color || getRandomColor() };
    setIdentity(newIdentity);
    setShowNameDialog(false);
  };

  const getMessageIcon = (msg: ParsedMessage) => {
    switch (msg.type) {
      case 'assistant':
        return <Bot className="w-4 h-4 text-primary" />;
      case 'tool':
        return msg.isSuccess === false
          ? <XCircle className="w-4 h-4 text-destructive" />
          : <Wrench className="w-4 h-4 text-muted-foreground" />;
      case 'result':
        return msg.isSuccess
          ? <CheckCircle className="w-4 h-4 text-primary" />
          : <XCircle className="w-4 h-4 text-destructive" />;
      case 'system':
        return <Terminal className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Terminal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Render plan review mode
  if (pendingPlan) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background border-b border-border px-6 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Plan Review</h2>
                    <p className="text-xs text-muted-foreground">{task.title}</p>
                  </div>
                </div>

                {/* Waiting indicator */}
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600 rounded flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  Awaiting Approval
                </span>

                {/* Author identity badge */}
                {identity && (
                  <>
                    <div className="h-5 w-px bg-border" />
                    <button
                      onClick={() => setShowNameDialog(true)}
                      className="px-2 py-0.5 text-xs rounded flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer bg-muted text-muted-foreground hover:text-foreground"
                      title="Click to change your name"
                    >
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {identity.name}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Chat history (collapsed) */}
          {messages.length > 0 && (
            <div className="border-b border-border bg-muted/30">
              <details className="group">
                <summary className="px-6 py-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  {messages.length} previous messages
                </summary>
                <div className="max-h-48 overflow-auto px-6 py-2 space-y-2">
                  {messages.slice(-10).map((msg, index) => (
                    <div key={index} className="flex gap-2 text-xs">
                      <div className="shrink-0">{getMessageIcon(msg)}</div>
                      <div className="text-muted-foreground line-clamp-2">{msg.content}</div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Plan content */}
          <main className="flex-1 overflow-y-auto pb-32">
            <div className="flex justify-center py-8 px-4">
              <PlanViewer
                ref={viewerRef}
                blocks={blocks}
                markdown={pendingPlan.content}
                annotations={annotations}
                onAddAnnotation={handleAddAnnotation}
                onSelectAnnotation={handleSelectAnnotation}
                onRemoveAnnotation={handleDeleteAnnotation}
                selectedAnnotationId={selectedAnnotationId}
              />
            </div>
          </main>
        </div>

        {/* Annotation Sidebar */}
        <AnnotationSidebar
          annotations={annotations}
          blocks={blocks}
          onSelect={handleSelectAnnotation}
          onDelete={handleDeleteAnnotation}
          selectedId={selectedAnnotationId}
        />

        {/* Decision bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {annotations.length > 0 ? (
                <span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''} - will be sent as feedback</span>
              ) : (
                <span>Add annotations to request changes</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                disabled={isApproving || annotations.length === 0}
                className="px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title={annotations.length === 0 ? 'Add annotations to request changes' : undefined}
              >
                {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                Request Changes
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                Approve Plan
              </button>
            </div>
          </div>
        </div>

        {/* Author name dialog */}
        <AuthorNameDialog
          open={showNameDialog}
          onClose={() => setShowNameDialog(false)}
          onSubmit={handleSetAuthorName}
          currentName={identity?.name}
        />
      </div>
    );
  }

  // Render normal chat mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[80vh] bg-background rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Agent Output</h2>
              <p className="text-xs text-muted-foreground">{task.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title={copied ? 'Copied!' : 'Copy output'}
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Output area */}
        <div
          ref={outputRef}
          className="flex-1 overflow-auto p-4 bg-card"
        >
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              {task.agent_pid ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Waiting for output...</span>
                </div>
              ) : (
                'No output available'
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    msg.type === 'result'
                      ? msg.isSuccess
                        ? 'bg-primary/10 border border-primary/30 rounded-lg p-3'
                        : 'bg-destructive/10 border border-destructive/30 rounded-lg p-3'
                      : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getMessageIcon(msg)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.type === 'tool' && msg.toolName && (
                      <div className="text-xs text-muted-foreground font-medium mb-1">
                        {msg.toolName}
                      </div>
                    )}
                    <div className={`text-sm whitespace-pre-wrap break-words ${
                      msg.type === 'assistant' ? 'text-foreground' :
                      msg.type === 'tool' ? 'text-muted-foreground font-mono text-xs' :
                      msg.type === 'result' ? (msg.isSuccess ? 'text-primary' : 'text-destructive') :
                      msg.type === 'system' ? 'text-muted-foreground text-xs' :
                      'text-muted-foreground'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-t border-border bg-card shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{messages.length} messages</span>
            {task.agent_pid && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Agent running (PID: {task.agent_pid})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { X, Terminal, Copy, Check, Bot, Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Task } from '../../types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

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

  const getMessageIcon = (msg: ParsedMessage) => {
    switch (msg.type) {
      case 'assistant':
        return <Bot className="w-4 h-4 text-primary" />;
      case 'tool':
        return msg.isSuccess === false
          ? <XCircle className="w-4 h-4 text-red-500" />
          : <Wrench className="w-4 h-4 text-amber-500" />;
      case 'result':
        return msg.isSuccess
          ? <CheckCircle className="w-4 h-4 text-green-500" />
          : <XCircle className="w-4 h-4 text-red-500" />;
      case 'system':
        return <Terminal className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Terminal className="w-4 h-4 text-muted-foreground" />;
    }
  };

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
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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
          className="flex-1 overflow-auto p-4 bg-zinc-950"
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
                        ? 'bg-green-500/10 border border-green-500/30 rounded-lg p-3'
                        : 'bg-red-500/10 border border-red-500/30 rounded-lg p-3'
                      : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getMessageIcon(msg)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.type === 'tool' && msg.toolName && (
                      <div className="text-xs text-amber-500 font-medium mb-1">
                        {msg.toolName}
                      </div>
                    )}
                    <div className={`text-sm whitespace-pre-wrap break-words ${
                      msg.type === 'assistant' ? 'text-zinc-200' :
                      msg.type === 'tool' ? 'text-zinc-400 font-mono text-xs' :
                      msg.type === 'result' ? (msg.isSuccess ? 'text-green-400' : 'text-red-400') :
                      msg.type === 'system' ? 'text-zinc-500 text-xs' :
                      'text-zinc-400'
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
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Agent running (PID: {task.agent_pid})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import 'xterm/css/xterm.css';

interface TerminalProps {
  agentId: string;
  onClose?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ agentId, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const isConnectedRef = useRef(false);
  const [_isConnected, setIsConnected] = useState(false);
  const [canReconnect, setCanReconnect] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const unlistenOutputRef = useRef<(() => void) | null>(null);
  const unlistenClosedRef = useRef<(() => void) | null>(null);
  const isInitializingRef = useRef(false);

  const sendInput = useCallback(async (data: string) => {
    if (!isConnectedRef.current) {
      return;
    }

    try {
      const encoder = new TextEncoder();
      const bytes = Array.from(encoder.encode(data));
      
      await invoke('send_terminal_input', {
        agentId,
        data: bytes,
      });
    } catch (err) {
      console.error('Failed to send input:', err);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\n\x1b[1;31mError sending input: ${err}\x1b[0m`);
      }
    }
  }, [agentId]);

  const initializeTerminal = useCallback(async () => {
    if (isInitializingRef.current) {
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      await invoke('open_terminal', { agentId });
      await invoke('start_terminal_stream', { agentId });

      const unlistenOutput = await listen<number[]>(
        `terminal-output-${agentId}`,
        (event) => {
          if (xtermRef.current && event.payload) {
            const bytes = new Uint8Array(event.payload);
            const text = new TextDecoder().decode(bytes);
            xtermRef.current.write(text);
          }
        }
      );
      unlistenOutputRef.current = unlistenOutput;

      const unlistenClosed = await listen<string>(
        `terminal-closed-${agentId}`,
        (_event) => {
          isConnectedRef.current = false;
          setIsConnected(false);
          setCanReconnect(true);
          
          if (xtermRef.current) {
            xtermRef.current.writeln('\r\n\x1b[1;33m Shell session ended\x1b[0m');
            xtermRef.current.writeln('\x1b[33m Click "Reconnect" to start a new session.\x1b[0m\r\n');
          }
        }
      );
      unlistenClosedRef.current = unlistenClosed;

      isConnectedRef.current = true;
      setIsConnected(true);
      setCanReconnect(false);
      setError(null);

      if (xtermRef.current) {
        const { rows, cols } = xtermRef.current;
        await invoke('resize_terminal', {
          agentId,
          rows,
          cols,
        });
      }

      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[1;32m✓ Terminal connected successfully!\x1b[0m');
        xtermRef.current.writeln('\x1b[90m(Note: Type "exit" to close the session)\x1b[0m');
        xtermRef.current.writeln('');
        xtermRef.current.focus();
      }
    } catch (err: any) {
      console.error('Failed to initialize terminal:', err);
      setError(err.toString());
      isConnectedRef.current = false;
      setIsConnected(false);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\n\x1b[1;31mError: ${err}\x1b[0m`);
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [agentId]);

  const reconnectTerminal = useCallback(async () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln('\x1b[1;36m Reconnecting...\x1b[0m\r\n');
    }

    try {
      await invoke('close_terminal', { agentId }).catch(() => {});

      if (unlistenOutputRef.current) {
        unlistenOutputRef.current();
        unlistenOutputRef.current = null;
      }
      if (unlistenClosedRef.current) {
        unlistenClosedRef.current();
        unlistenClosedRef.current = null;
      }

      await initializeTerminal();
    } catch (err) {
      console.error('Failed to reconnect:', err);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\x1b[1;31m✗ Reconnect failed: ${err}\x1b[0m\r\n`);
      }
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [agentId, initializeTerminal]);

  const resizeTerminal = useCallback(async (rows: number, cols: number) => {
    if (!isConnectedRef.current) return;
    
    try {
      await invoke('resize_terminal', {
        agentId,
        rows,
        cols,
      });
    } catch (err) {
      console.error('Failed to resize terminal:', err);
    }
  }, [agentId]);

  useEffect(() => {
    if (!terminalRef.current) {
      return;
    }

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    term.open(terminalRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const disposable = term.onData((data) => {
      sendInput(data);
    });

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        const { rows, cols } = xtermRef.current;
        resizeTerminal(rows, cols);
      }
    };

    window.addEventListener('resize', handleResize);

    const initTimer = setTimeout(() => {
      fitAddon.fit();
      term.focus();
      initializeTerminal();
    }, 100);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('resize', handleResize);
      
      disposable.dispose();
      
      if (unlistenOutputRef.current) {
        unlistenOutputRef.current();
        unlistenOutputRef.current = null;
      }
      
      if (unlistenClosedRef.current) {
        unlistenClosedRef.current();
        unlistenClosedRef.current = null;
      }
      
      invoke('close_terminal', { agentId }).catch(err => 
        console.error('Failed to close terminal:', err)
      );
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      
      isConnectedRef.current = false;
      isInitializingRef.current = false;
    };
  }, [agentId, sendInput, initializeTerminal, resizeTerminal]);

  return (
    <div className="terminal-container">
      {canReconnect && (
        <div className="terminal-header">
          <div className="terminal-title">
            Agent Terminal: {agentId.slice(0, 8)}
          </div>
          <div className="terminal-actions">
            <button 
              onClick={reconnectTerminal} 
              className="reconnect-btn"
              title="Reconnect to terminal"
            >
              Reconnect
            </button>
            {onClose && (
              <button onClick={onClose} className="close-btn" title="Close terminal">
                ×
              </button>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="terminal-error">
          Error: {error}
        </div>
      )}

      <div
        ref={terminalRef}
        className="terminal-viewport"
        onClick={() => xtermRef.current?.focus()}
        style={{ cursor: 'text' }}
      />
    </div>
  );
};

export default Terminal;
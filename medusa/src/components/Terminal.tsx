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
  const [isConnected, setIsConnected] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const isInitializingRef = useRef(false);

  const sendInput = useCallback(async (data: string) => {
    console.log('sendInput called with data:', data, 'charCodes:', data.split('').map(c => c.charCodeAt(0)));
    
    if (!isConnectedRef.current) {
      console.warn('Not connected (ref), ignoring input. isConnectedRef.current:', isConnectedRef.current);
      return;
    }

    try {
      const encoder = new TextEncoder();
      const bytes = Array.from(encoder.encode(data));
      
      console.log('Sending bytes to backend:', bytes);
      
      await invoke('send_terminal_input', {
        agentId,
        data: bytes,
      });
      
      console.log('✓ Successfully sent input to backend');
    } catch (err) {
      console.error('✗ Failed to send input:', err);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\n\x1b[1;31mError sending input: ${err}\x1b[0m`);
      }
    }
  }, [agentId]); // Remove isConnected from dependencies

  const initializeTerminal = useCallback(async () => {
    // Prevent double initialization
    if (isInitializingRef.current) {
      console.log('Already initializing, skipping...');
      return;
    }
    
    isInitializingRef.current = true;
    console.log('initializeTerminal called for agent:', agentId);
    
    try {
      console.log('1. Opening terminal session...');
      await invoke('open_terminal', { agentId });
      console.log('✓ Terminal session opened');

      console.log('2. Starting terminal stream...');
      await invoke('start_terminal_stream', { agentId });
      console.log('✓ Terminal stream started');

      console.log('3. Setting up event listener...');
      const unlisten = await listen<number[]>(
        `terminal-output-${agentId}`,
        (event) => {
          if (xtermRef.current && event.payload) {
            const bytes = new Uint8Array(event.payload);
            const text = new TextDecoder().decode(bytes);
            console.log('Received output, length:', text.length);
            xtermRef.current.write(text);
          }
        }
      );
      console.log('✓ Event listener set up');

      unlistenRef.current = unlisten;
      
      // Set BOTH ref and state
      isConnectedRef.current = true;
      setIsConnected(true);
      setError(null);

      console.log('4. Sending initial resize...');
      if (xtermRef.current) {
        const { rows, cols } = xtermRef.current;
        console.log('Terminal size:', rows, 'x', cols);
        await invoke('resize_terminal', {
          agentId,
          rows,
          cols,
        });
        console.log('✓ Resize sent');
      }

      console.log('5. Displaying welcome message...');
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[1;32m✓ Terminal connected successfully!\x1b[0m');
        xtermRef.current.writeln('\x1b[33mYou can now type commands. Try: ls, pwd, echo "hello"\x1b[0m');
        xtermRef.current.writeln('');
        xtermRef.current.focus();
        console.log('✓ Terminal ready, isConnectedRef.current:', isConnectedRef.current);
      }

      console.log('=== Terminal initialization complete ===');
    } catch (err: any) {
      console.error('✗ Failed to initialize terminal:', err);
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

  const resizeTerminal = useCallback(async (rows: number, cols: number) => {
    if (!isConnectedRef.current) return;
    
    try {
      await invoke('resize_terminal', {
        agentId,
        rows,
        cols,
      });
      console.log('Terminal resized to:', rows, 'x', cols);
    } catch (err) {
      console.error('Failed to resize terminal:', err);
    }
  }, [agentId]);

  // Initialize xterm.js - only once per agentId
  useEffect(() => {
    if (!terminalRef.current) {
      console.log('Terminal ref not ready');
      return;
    }

    console.log('=== Initializing xterm.js for agent:', agentId, '===');

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
    console.log('✓ Terminal opened in DOM');

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Set up input handler immediately
    console.log('Setting up input handler...');
    const disposable = term.onData((data) => {
      console.log('>>> onData triggered! data:', data, 'charCodes:', data.split('').map(c => c.charCodeAt(0)));
      sendInput(data);
    });
    console.log('✓ Input handler set up');

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        const { rows, cols } = xtermRef.current;
        resizeTerminal(rows, cols);
      }
    };

    window.addEventListener('resize', handleResize);

    // Initialize after a short delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      console.log('Fitting terminal...');
      fitAddon.fit();
      console.log('✓ Terminal fitted, size:', term.cols, 'x', term.rows);
      
      console.log('Focusing terminal...');
      term.focus();
      console.log('✓ Terminal focused');
      
      console.log('Initializing backend connection...');
      initializeTerminal();
    }, 100);

    return () => {
      console.log('Cleaning up terminal for agent:', agentId);
      clearTimeout(initTimer);
      window.removeEventListener('resize', handleResize);
      
      disposable.dispose();
      
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      
      // Close backend session
      invoke('close_terminal', { agentId }).catch(err => 
        console.error('Failed to close terminal:', err)
      );
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      
      isConnectedRef.current = false;
      isInitializingRef.current = false;
      
      console.log('✓ Terminal cleanup complete');
    };
  }, [agentId, sendInput, initializeTerminal, resizeTerminal]); // Proper dependencies

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      console.log('Terminal cleared');
    }
  };

  const handleCopy = () => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        console.log('Copied to clipboard');
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        console.log('Pasting:', text.substring(0, 50));
        sendInput(text);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleFocus = () => {
    if (xtermRef.current) {
      console.log('Focus button clicked, focusing terminal. isConnected:', isConnectedRef.current);
      xtermRef.current.focus();
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">
          Agent Terminal: {agentId.slice(0, 8)}
          {isConnected && <span className="status-indicator connected">●</span>}
          {!isConnected && <span className="status-indicator disconnected">●</span>}
        </div>
        <div className="terminal-actions">
          <button onClick={handleFocus} title="Focus terminal">
            Focus
          </button>
          <button onClick={handleClear} title="Clear terminal">
            Clear
          </button>
          <button onClick={handleCopy} title="Copy selection">
            Copy
          </button>
          <button onClick={handlePaste} title="Paste">
            Paste
          </button>
          {onClose && (
            <button onClick={onClose} className="close-btn" title="Close terminal">
              ×
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="terminal-error">
          Error: {error}
        </div>
      )}

      <div
        ref={terminalRef}
        className="terminal-viewport"
        onClick={handleFocus}
        style={{ cursor: 'text' }}
      />
    </div>
  );
};

export default Terminal;
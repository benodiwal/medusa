import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UseTerminalOptions {
  agentId: string;
  autoConnect?: boolean;
}

interface TerminalState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useTerminal = ({ agentId, autoConnect = true }: UseTerminalOptions) => {
  const [state, setState] = useState<TerminalState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const hasConnectedRef = useRef(false);

  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      await invoke('open_terminal', { agentId });
      await invoke('start_terminal_stream', { agentId });
      
      setState({
        isConnected: true,
        isConnecting: false,
        error: null,
      });
      
      hasConnectedRef.current = true;
    } catch (err: any) {
      console.error('Failed to connect to terminal:', err);
      setState({
        isConnected: false,
        isConnecting: false,
        error: err.toString(),
      });
    }
  }, [agentId, state.isConnected, state.isConnecting]);

  const disconnect = useCallback(async () => {
    if (!state.isConnected) {
      return;
    }

    try {
      await invoke('close_terminal', { agentId });
      setState({
        isConnected: false,
        isConnecting: false,
        error: null,
      });
      hasConnectedRef.current = false;
    } catch (err: any) {
      console.error('Failed to disconnect from terminal:', err);
      setState((prev) => ({ ...prev, error: err.toString() }));
    }
  }, [agentId, state.isConnected]);

  const sendInput = useCallback(
    async (data: string) => {
      if (!state.isConnected) {
        throw new Error('Terminal not connected');
      }

      try {
        const encoder = new TextEncoder();
        const bytes = Array.from(encoder.encode(data));
        
        await invoke('send_terminal_input', {
          agentId,
          data: bytes,
        });
      } catch (err) {
        console.error('Failed to send terminal input:', err);
        throw err;
      }
    },
    [agentId, state.isConnected]
  );

  const resize = useCallback(
    async (rows: number, cols: number) => {
      if (!state.isConnected) {
        return;
      }

      try {
        await invoke('resize_terminal', {
          agentId,
          rows,
          cols,
        });
      } catch (err) {
        console.error('Failed to resize terminal:', err);
      }
    },
    [agentId, state.isConnected]
  );

  const executeCommand = useCallback(
    async (command: string) => {
      if (!state.isConnected) {
        throw new Error('Terminal not connected');
      }

      // Send command with newline
      await sendInput(command + '\n');
    },
    [sendInput, state.isConnected]
  );

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && !hasConnectedRef.current) {
      connect();
    }

    return () => {
      if (hasConnectedRef.current) {
        disconnect();
      }
    };
  }, [autoConnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendInput,
    resize,
    executeCommand,
  };
};
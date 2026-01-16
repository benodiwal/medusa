import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SetupStatus } from '@/types';

interface SetupContextType {
  isLoading: boolean;
  setupFailed: boolean;
  setupStatus: SetupStatus | null;
  error: string | null;
  retry: () => Promise<void>;
}

const SetupContext = createContext<SetupContextType | null>(null);

export function useSetup() {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within SetupProvider');
  }
  return context;
}

interface SetupProviderProps {
  children: ReactNode;
}

export function SetupProvider({ children }: SetupProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [setupFailed, setSetupFailed] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);
    setSetupFailed(false);

    try {
      // Check setup status (Rust already ran auto_setup on app start)
      const status = await invoke<SetupStatus>('get_setup_status');
      setSetupStatus(status);

      // Check if setup is complete
      if (status.needs_setup || !status.hook_script_installed || !status.hook_script_executable || !status.hook_config_installed) {
        setSetupFailed(true);
        setError('Setup incomplete. Plans workflow may not work correctly.');
      }
    } catch (err) {
      console.error('Failed to check setup status:', err);
      setSetupFailed(true);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const runSetup = async () => {
    setIsLoading(true);
    setError(null);
    setSetupFailed(false);

    try {
      // Force reinstall
      const status = await invoke<SetupStatus>('reinstall_setup');
      setSetupStatus(status);

      if (status.needs_setup || !status.hook_script_installed || !status.hook_script_executable || !status.hook_config_installed) {
        setSetupFailed(true);
        setError('Setup completed but some components are missing.');
      }
    } catch (err) {
      console.error('Setup failed:', err);
      setSetupFailed(true);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const retry = async () => {
    await runSetup();
  };

  return (
    <SetupContext.Provider value={{ isLoading, setupFailed, setupStatus, error, retry }}>
      {children}
    </SetupContext.Provider>
  );
}

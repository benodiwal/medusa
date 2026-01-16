import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useSetup } from '@/contexts/SetupContext';

export function SetupBanner() {
  const { setupFailed, setupStatus, retry } = useSetup();
  const [retrying, setRetrying] = useState(false);

  if (!setupFailed) {
    return null;
  }

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  // Build reason based on what's missing
  const getMissingItems = () => {
    if (!setupStatus) return 'Unable to verify setup';
    const missing: string[] = [];
    if (!setupStatus.hook_script_installed) missing.push('hook script');
    if (setupStatus.hook_script_installed && !setupStatus.hook_script_executable) missing.push('script permissions');
    if (!setupStatus.hook_config_installed) missing.push('Claude settings');
    if (!setupStatus.medusa_dir_exists) missing.push('data directory');
    if (missing.length === 0) return 'Unknown error';
    return `Missing: ${missing.join(', ')}`;
  };

  const docsUrl = 'https://github.com/benodiwal/medusa#setup-plans-workflow';

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-destructive">
              <span className="font-medium">Setup incomplete:</span>{' '}
              Plans workflow may not work.{' '}
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:no-underline"
              >
                Setup manually
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <p className="text-xs text-destructive/70 mt-0.5">
              {getMissingItems()}
            </p>
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
          Retry Setup
        </button>
      </div>
    </div>
  );
}

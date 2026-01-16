import { Loader2 } from 'lucide-react';

export function SetupScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <img
          src="/medusa-logo.png"
          alt="Medusa"
          className="w-16 h-16 mx-auto object-contain"
        />
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-foreground">Setting up Medusa...</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Configuring Claude Code integration
          </p>
        </div>
      </div>
    </div>
  );
}

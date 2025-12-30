import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, ArrowLeft, Moon, Sun, Monitor, Clock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { MedusaSettings } from "@/types";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<MedusaSettings>({ hook_timeout_minutes: 10 });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loaded = await invoke<MedusaSettings>('get_settings');
        setSettings(loaded);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleTimeoutChange = async (minutes: number) => {
    const newSettings = { ...settings, hook_timeout_minutes: minutes };
    setSettings(newSettings);
    try {
      await invoke('save_settings', { settings: newSettings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const themeOptions = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon }
  ] as const;

  const currentTheme = themeOptions.find(option => option.value === theme) || themeOptions[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Back to Board"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/medusa-logo.png"
              alt="Medusa"
              className="w-7 h-7 object-contain"
            />
            <h1 className="text-base font-semibold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-xl mx-auto p-6">
        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">Appearance</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Customize how Medusa looks
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">Theme</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select your preferred color scheme
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
                      <currentTheme.icon className="w-4 h-4" />
                      <span>{currentTheme.label}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                    {themeOptions.map((themeOption) => (
                      <DropdownMenuItem
                        key={themeOption.value}
                        onClick={() => setTheme(themeOption.value)}
                        className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                      >
                        <themeOption.icon className="w-4 h-4 mr-2" />
                        <span className="flex-1">{themeOption.label}</span>
                        {theme === themeOption.value && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">About</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Information about Medusa
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="/medusa-logo.png"
                  alt="Medusa"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h3 className="text-sm font-medium text-foreground">Medusa</h3>
                  <p className="text-xs text-muted-foreground">Version 0.1.0</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Plan review tool for Claude Code. Review, annotate, and approve or deny
                implementation plans from multiple Claude Code sessions.
              </p>
            </div>
          </div>

          {/* Hook Configuration */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">Hook Configuration</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Configure the Claude Code hook
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              {/* Timeout Setting */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Review Timeout
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    How long Claude waits for your review before timing out
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={settings.hook_timeout_minutes}
                    onChange={(e) => handleTimeoutChange(parseInt(e.target.value))}
                    className="w-24 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground w-16 text-right">
                    {settings.hook_timeout_minutes} min
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Hook Script Location</h3>
                  <code className="block text-xs bg-muted text-muted-foreground p-2 rounded overflow-x-auto">
                    ~/.claude/hooks/medusa-plan-review.sh
                  </code>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Queue File Location</h3>
                  <code className="block text-xs bg-muted text-muted-foreground p-2 rounded overflow-x-auto">
                    ~/.medusa/queue.json
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  The hook intercepts ExitPlanMode events from Claude Code and adds plans to
                  the queue for review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

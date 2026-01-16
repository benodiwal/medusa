import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, ArrowLeft, Moon, Sun, Monitor, Type, RotateCcw, CheckCircle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSettings } from "@/contexts/FontContext";
import { SetupStatus } from "@/types";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { settings, setFontSize, setFontFamily, setZoomLevel, resetToDefaults } = useFontSettings();
  const navigate = useNavigate();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [reinstalling, setReinstalling] = useState(false);

  useEffect(() => {
    loadSetupStatus();
  }, []);

  const loadSetupStatus = async () => {
    try {
      const status = await invoke<SetupStatus>('get_setup_status');
      setSetupStatus(status);
    } catch (error) {
      console.error('Failed to get setup status:', error);
    }
  };

  const handleReinstall = async () => {
    setReinstalling(true);
    try {
      const status = await invoke<SetupStatus>('reinstall_setup');
      setSetupStatus(status);
    } catch (error) {
      console.error('Failed to reinstall:', error);
      alert(`Reinstall failed: ${error}`);
    } finally {
      setReinstalling(false);
    }
  };

  const themeOptions = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon }
  ] as const;

  const fontFamilyOptions = [
    { value: "default", label: "Default (GT Sectra)" },
    { value: "system", label: "System" },
    { value: "sans-serif", label: "Sans-serif (Inter)" },
    { value: "monospace", label: "Monospace (JetBrains)" },
  ] as const;

  const currentTheme = themeOptions.find(option => option.value === theme) || themeOptions[0];
  const currentFontFamily = fontFamilyOptions.find(option => option.value === settings.fontFamily) || fontFamilyOptions[0];

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

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              {/* Theme */}
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

              {/* Font Size */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Font Size</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adjust the base text size
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {settings.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={24}
                  step={1}
                  value={settings.fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-primary
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>12px</span>
                  <span>24px</span>
                </div>
              </div>

              {/* Font Family */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Font Family</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose your preferred typeface
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
                        <Type className="w-4 h-4" />
                        <span>{currentFontFamily.label}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                      {fontFamilyOptions.map((fontOption) => (
                        <DropdownMenuItem
                          key={fontOption.value}
                          onClick={() => setFontFamily(fontOption.value)}
                          className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                        >
                          <span className="flex-1">{fontOption.label}</span>
                          {settings.fontFamily === fontOption.value && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Zoom Level */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Zoom Level</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scale the entire interface
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {Math.round(settings.zoomLevel * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={settings.zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-primary
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>80%</span>
                  <span>120%</span>
                </div>
              </div>

              {/* Reset to Defaults */}
              <div className="pt-3 border-t border-border">
                <button
                  onClick={resetToDefaults}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to defaults
                </button>
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
                  <p className="text-xs text-muted-foreground">Version 0.1.1</p>
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
                Claude Code hook status and locations
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              {/* Setup Status */}
              {setupStatus && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Hook Script</span>
                    <div className="flex items-center gap-1.5">
                      {setupStatus.hook_script_installed ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Installed</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-xs text-destructive">Not installed</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Script Permissions</span>
                    <div className="flex items-center gap-1.5">
                      {setupStatus.hook_script_executable ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Executable</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-xs text-destructive">Not executable</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Claude Settings</span>
                    <div className="flex items-center gap-1.5">
                      {setupStatus.hook_config_installed ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Configured</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-xs text-destructive">Not configured</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Data Directory</span>
                    <div className="flex items-center gap-1.5">
                      {setupStatus.medusa_dir_exists ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Created</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-xs text-destructive">Missing</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border space-y-2">
                <h3 className="text-sm font-medium text-foreground">Hook Script Location</h3>
                <code className="block text-xs bg-muted text-muted-foreground p-2 rounded overflow-x-auto">
                  {setupStatus?.hook_script_path || '~/.claude/hooks/medusa-plan-review.sh'}
                </code>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Claude Settings Location</h3>
                <code className="block text-xs bg-muted text-muted-foreground p-2 rounded overflow-x-auto">
                  {setupStatus?.settings_path || '~/.claude/settings.json'}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                The hook intercepts ExitPlanMode events from Claude Code and adds plans to
                the queue for review. Setup is automatic on app start.
              </p>

              {/* Reinstall Button */}
              <div className="pt-3 border-t border-border">
                <button
                  onClick={handleReinstall}
                  disabled={reinstalling}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {reinstalling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  {reinstalling ? 'Reinstalling...' : 'Reinstall hook configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

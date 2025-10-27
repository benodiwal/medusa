import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Bot } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type SettingsSection = "general" | "repositories" | "keybindings" | "account" | "experimental";

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [defaultModel, setDefaultModel] = useState("Claude 4.5 Sonnet");
  const { theme, setTheme } = useTheme();

  const sections = [
    { id: "general" as const, label: "General" },
    { id: "repositories" as const, label: "Repositories" },
    { id: "keybindings" as const, label: "Keybindings" },
    { id: "account" as const, label: "Account" },
    { id: "experimental" as const, label: "Experimental" },
  ];

  const modelOptions = [
    "Claude 4.5 Sonnet",
    "Claude 3.5 Sonnet",
    "Claude 3 Opus",
    "Claude 3 Haiku",
  ];

  const themeOptions = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" }
  ] as const;

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Default Model</label>
        <p className="text-sm text-muted-foreground">Select the default model for new Agents</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>{defaultModel}</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card border-border">
            {modelOptions.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => setDefaultModel(model)}
                className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
              >
                {defaultModel === model ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <span className="w-4 h-4 mr-2"></span>
                )}
                {model}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Theme</label>
        <p className="text-sm text-muted-foreground">Control the appearance of Sculptor</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-sm text-foreground bg-card border border-border rounded-md hover:opacity-90 transition-colors">
              <span>{themeOptions.find(option => option.value === theme)?.label || "System"}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card border-border">
            {themeOptions.map((themeOption) => (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className="cursor-pointer text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
              >
                {theme === themeOption.value ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <span className="w-4 h-4 mr-2"></span>
                )}
                {themeOption.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderRepositoriesSettings = () => (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground py-8">
        <p>Repository settings will be implemented here</p>
      </div>
    </div>
  );

  const renderKeybindingsSettings = () => (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground py-8">
        <p>Keybinding settings will be implemented here</p>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground py-8">
        <p>Account settings will be implemented here</p>
      </div>
    </div>
  );

  const renderExperimentalSettings = () => (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground py-8">
        <p>Experimental settings will be implemented here</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return renderGeneralSettings();
      case "repositories":
        return renderRepositoriesSettings();
      case "keybindings":
        return renderKeybindingsSettings();
      case "account":
        return renderAccountSettings();
      case "experimental":
        return renderExperimentalSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="flex h-screen bg-background w-full">
      {/* Settings Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
        <nav className="px-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${
                activeSection === section.id
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 bg-background">
        <div className="max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
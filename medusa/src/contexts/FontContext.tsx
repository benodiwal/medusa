import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type FontFamily = "default" | "system" | "sans-serif" | "monospace";

interface FontSettings {
  fontSize: number;
  fontFamily: FontFamily;
  zoomLevel: number;
}

interface FontContextType {
  settings: FontSettings;
  setFontSize: (size: number) => void;
  setFontFamily: (family: FontFamily) => void;
  setZoomLevel: (zoom: number) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: FontSettings = {
  fontSize: 16,
  fontFamily: "default",
  zoomLevel: 1.0,
};

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  default: "'GT Sectra', Georgia, 'Times New Roman', serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "sans-serif": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  monospace: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export const useFontSettings = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFontSettings must be used within a FontProvider");
  }
  return context;
};

interface FontProviderProps {
  children: ReactNode;
}

export const FontProvider = ({ children }: FontProviderProps) => {
  const [settings, setSettings] = useState<FontSettings>(() => {
    const stored = localStorage.getItem("medusa-font-settings");
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Apply CSS variables whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-size-base", `${settings.fontSize}px`);
    root.style.setProperty("--font-family-body", FONT_FAMILY_MAP[settings.fontFamily]);
    root.style.setProperty("--zoom-level", settings.zoomLevel.toString());
  }, [settings]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("medusa-font-settings", JSON.stringify(settings));
  }, [settings]);

  const setFontSize = (size: number) => {
    const clamped = Math.min(24, Math.max(12, size));
    setSettings((prev) => ({ ...prev, fontSize: clamped }));
  };

  const setFontFamily = (family: FontFamily) => {
    setSettings((prev) => ({ ...prev, fontFamily: family }));
  };

  const setZoomLevel = (zoom: number) => {
    const clamped = Math.min(1.2, Math.max(0.8, zoom));
    setSettings((prev) => ({ ...prev, zoomLevel: clamped }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const value = {
    settings,
    setFontSize,
    setFontFamily,
    setZoomLevel,
    resetToDefaults,
  };

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  );
};

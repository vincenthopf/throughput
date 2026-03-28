import React, { useState, useCallback } from "react";
import { useApp } from "ink";
import { BenchmarkScreen } from "./screens/benchmark.js";
import { SettingsScreen } from "./screens/settings.js";
import { loadConfig, saveConfig } from "./lib/config.js";
import type { AppConfig } from "./types.js";

type Screen = "benchmark" | "settings";

export function App() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>("benchmark");
  const [config, setConfig] = useState<AppConfig>(loadConfig);

  const handleSaveConfig = useCallback((newConfig: AppConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  if (screen === "settings") {
    return (
      <SettingsScreen
        config={config}
        onSave={handleSaveConfig}
        onBack={() => setScreen("benchmark")}
      />
    );
  }

  return (
    <BenchmarkScreen
      config={config}
      onSettings={() => setScreen("settings")}
      onQuit={() => exit()}
    />
  );
}

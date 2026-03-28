import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AppConfig } from "../types.js";

const CONFIG_DIR = join(homedir(), ".config", "throughput");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: AppConfig = {
  models: [],
  activeModelIndex: 0,
  prompt:
    "Explain quantum computing in detail, covering qubits, superposition, entanglement, and practical applications.",
  maxTokens: 0,
  runs: 3,
};

export function loadConfig(): AppConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: AppConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

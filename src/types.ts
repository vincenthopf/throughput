export interface ModelProfile {
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

export interface AppConfig {
  models: ModelProfile[];
  activeModelIndex: number;
  prompt: string;
  maxTokens: number;
  runs: number;
}

export interface ChunkUpdate {
  text: string;
  tokenCount: number;
  ttft: number;
  elapsed: number;
  currentTps: number;
}

export interface BenchmarkResult {
  tps: number;
  ttft: number;
  totalTime: number;
  completionTokens: number;
  text: string;
}

export interface BenchmarkState {
  status: "idle" | "running" | "done" | "error";
  currentRun: number;
  totalRuns: number;
  runs: BenchmarkResult[];
  liveMetrics: ChunkUpdate | null;
  streamedText: string;
  tpsSamples: number[];
  error: string | null;
}

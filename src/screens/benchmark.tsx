import React, { useState, useCallback, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { MetricsPanel } from "../components/metrics-panel.js";
import { StreamPanel } from "../components/stream-panel.js";
import { runBenchmark } from "../lib/benchmark.js";
import type { AppConfig, BenchmarkState, BenchmarkResult } from "../types.js";

interface BenchmarkScreenProps {
  config: AppConfig;
  onSettings: () => void;
  onQuit: () => void;
}

const INITIAL_STATE: BenchmarkState = {
  status: "idle",
  currentRun: 0,
  totalRuns: 0,
  runs: [],
  liveMetrics: null,
  streamedText: "",
  tpsSamples: [],
  error: null,
};

const LOGO = `  _   _                         _                _
 | |_| |__  _ __ ___  _   _  __ _| |__  _ __  _   _| |_
 | __| '_ \\| '__/ _ \\| | | |/ _\` | '_ \\| '_ \\| | | | __|
 | |_| | | | | | (_) | |_| | (_| | | | | |_) | |_| | |_
  \\__|_| |_|_|  \\___/ \\__,_|\\__, |_| |_| .__/ \\__,_|\\__|
                             |___/      |_|`;

export function BenchmarkScreen({ config, onSettings, onQuit }: BenchmarkScreenProps) {
  const [state, setState] = useState<BenchmarkState>(INITIAL_STATE);
  const runningRef = useRef(false);

  const activeModel = config.models[config.activeModelIndex];

  const startBenchmark = useCallback(async () => {
    if (runningRef.current || !activeModel) return;
    runningRef.current = true;

    setState({
      ...INITIAL_STATE,
      status: "running",
      totalRuns: config.runs,
      currentRun: 1,
    });

    const allRuns: BenchmarkResult[] = [];

    for (let i = 0; i < config.runs; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 500));

      setState((s) => ({
        ...s,
        currentRun: i + 1,
        liveMetrics: null,
        streamedText: "",
        tpsSamples: [],
      }));

      try {
        const result = await runBenchmark(activeModel, config.prompt, config.maxTokens, (update) => {
          setState((s) => ({
            ...s,
            liveMetrics: update,
            streamedText: update.text,
            tpsSamples: update.currentTps > 0 ? [...s.tpsSamples, update.currentTps] : s.tpsSamples,
          }));
        });

        allRuns.push(result);
        setState((s) => ({
          ...s,
          runs: [...allRuns],
          liveMetrics: {
            text: result.text,
            tokenCount: result.completionTokens,
            ttft: result.ttft,
            elapsed: result.totalTime,
            currentTps: result.tps,
          },
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        }));
        runningRef.current = false;
        return;
      }
    }

    setState((s) => ({ ...s, status: "done" }));
    runningRef.current = false;
  }, [activeModel, config.prompt, config.maxTokens, config.runs]);

  useInput((input, key) => {
    if (input === "q") onQuit();
    if (input === "s" && !runningRef.current) onSettings();
    if (key.return && !runningRef.current) startBenchmark();
  });

  const isStreaming = state.status === "running";

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box flexDirection="column" paddingX={1}>
        <Text>{LOGO}</Text>
        <Box marginTop={1}>
          {activeModel ? (
            <Text>
              <Text bold>{activeModel.name}</Text>
              <Text dimColor> :: {new URL(activeModel.baseUrl).hostname}</Text>
            </Text>
          ) : (
            <Text>No model configured. Press [s] for settings.</Text>
          )}
        </Box>
      </Box>

      {/* Divider */}
      <Box paddingX={1}>
        <Text dimColor>{"─".repeat(72)}</Text>
      </Box>

      {/* Main content */}
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <MetricsPanel
          liveMetrics={state.liveMetrics}
          tpsSamples={state.tpsSamples}
          runs={state.runs}
          isStreaming={isStreaming}
          currentRun={state.currentRun}
          totalRuns={state.totalRuns}
          maxTokens={config.maxTokens}
        />
        <StreamPanel text={state.streamedText} isStreaming={isStreaming} height={20} />
      </Box>

      {/* Error */}
      {state.error && (
        <Box paddingX={2}>
          <Text bold inverse> ERROR </Text>
          <Text> {state.error}</Text>
        </Box>
      )}

      {/* Footer */}
      <Box paddingX={1}>
        <Text dimColor>{"─".repeat(72)}</Text>
      </Box>
      <Box paddingX={2}>
        <Text dimColor>
          {isStreaming ? "streaming..." : "[enter] run"}  [s] settings  [q] quit
        </Text>
      </Box>
    </Box>
  );
}

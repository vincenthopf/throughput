import React from "react";
import { Box, Text } from "ink";
import { Sparkline } from "./sparkline.js";
import type { BenchmarkResult, ChunkUpdate } from "../types.js";

interface MetricsPanelProps {
  liveMetrics: ChunkUpdate | null;
  tpsSamples: number[];
  runs: BenchmarkResult[];
  isStreaming: boolean;
  currentRun: number;
  totalRuns: number;
  maxTokens: number;
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function MetricsPanel({
  liveMetrics,
  tpsSamples,
  runs,
  isStreaming,
  currentRun,
  totalRuns,
  maxTokens,
}: MetricsPanelProps) {
  const tps = liveMetrics?.currentTps ?? 0;
  const ttft = liveMetrics?.ttft ?? 0;
  const tokens = liveMetrics?.tokenCount ?? 0;
  const elapsed = liveMetrics?.elapsed ?? 0;

  const avgTps = runs.length > 0 ? runs.reduce((s, r) => s + r.tps, 0) / runs.length : 0;
  const minTps = runs.length > 0 ? Math.min(...runs.map((r) => r.tps)) : 0;
  const maxTps = runs.length > 0 ? Math.max(...runs.map((r) => r.tps)) : 0;

  return (
    <Box flexDirection="column" width={26} borderStyle="single" paddingX={1}>
      <Text bold> METRICS </Text>

      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text dimColor>TPS    </Text>
          <Text bold>
            {isStreaming || runs.length > 0 ? `${fmt(tps)}/s` : "--"}
          </Text>
        </Box>
        <Sparkline data={tpsSamples} width={22} />
      </Box>

      <Box marginTop={1}>
        <Text dimColor>TTFT   </Text>
        <Text>{ttft > 0 ? fmtMs(ttft) : "--"}</Text>
      </Box>

      <Box>
        <Text dimColor>Tokens </Text>
        <Text>
          {tokens > 0 ? (maxTokens > 0 ? `${tokens}/${maxTokens}` : `${tokens}`) : "--"}
        </Text>
      </Box>

      <Box>
        <Text dimColor>Time   </Text>
        <Text>{elapsed > 0 ? fmtMs(elapsed) : "--"}</Text>
      </Box>

      {isStreaming && (
        <Box marginTop={1}>
          <Text dimColor>
            Run {currentRun}/{totalRuns}
          </Text>
        </Box>
      )}

      {runs.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>{"─".repeat(22)}</Text>
          <Text bold> HISTORY</Text>
          {runs.map((r, i) => (
            <Box key={i}>
              <Text dimColor>#{i + 1} </Text>
              <Text>{fmt(r.tps)}/s</Text>
              <Text dimColor>  {fmtMs(r.totalTime)}</Text>
            </Box>
          ))}

          {runs.length > 1 && (
            <Box flexDirection="column" marginTop={1}>
              <Box>
                <Text dimColor>Avg </Text>
                <Text bold>{fmt(avgTps)}/s</Text>
              </Box>
              <Box>
                <Text dimColor>Min </Text>
                <Text>{fmt(minTps)}</Text>
              </Box>
              <Box>
                <Text dimColor>Max </Text>
                <Text>{fmt(maxTps)}</Text>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

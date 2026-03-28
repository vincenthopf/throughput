import React from "react";
import { Text } from "ink";

const BLOCKS = " .:oO@#";

interface SparklineProps {
  data: number[];
  width?: number;
}

export function Sparkline({ data, width = 20 }: SparklineProps) {
  if (data.length === 0) return <Text dimColor>{"·".repeat(width)}</Text>;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const visible = data.slice(-width);
  const chars = visible.map((v) => {
    const idx = Math.round(((v - min) / range) * (BLOCKS.length - 1));
    return BLOCKS[idx]!;
  });

  const pad = width - chars.length;
  const padStr = pad > 0 ? "·".repeat(pad) : "";

  return <Text>{padStr + chars.join("")}</Text>;
}

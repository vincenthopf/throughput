import React from "react";
import { Box, Text } from "ink";

interface StreamPanelProps {
  text: string;
  isStreaming: boolean;
  height: number;
}

export function StreamPanel({ text, isStreaming, height }: StreamPanelProps) {
  const lines = text.split("\n");
  const visibleLines = lines.slice(-(height - 2));
  const displayText = visibleLines.join("\n");

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      paddingX={1}
    >
      <Text bold> OUTPUT {isStreaming ? "(streaming)" : ""}</Text>
      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        {displayText ? (
          <Text wrap="wrap">
            {displayText}
            {isStreaming ? "_" : ""}
          </Text>
        ) : (
          <Text dimColor>Press enter to start benchmark...</Text>
        )}
      </Box>
    </Box>
  );
}

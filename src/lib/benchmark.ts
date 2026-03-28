import OpenAI from "openai";
import { countTokens } from "gpt-tokenizer";
import type { ModelProfile, ChunkUpdate, BenchmarkResult } from "../types.js";

export async function runBenchmark(
  model: ModelProfile,
  prompt: string,
  maxTokens: number,
  onChunk: (update: ChunkUpdate) => void,
): Promise<BenchmarkResult> {
  const client = new OpenAI({
    baseURL: model.baseUrl,
    apiKey: model.apiKey,
  });

  // Request usage stats from API when supported — gives exact token counts
  // from the provider's own tokenizer (critical for non-GPT models like dLLMs)
  const stream = await client.chat.completions.create({
    model: model.modelId,
    messages: [{ role: "user" as const, content: prompt }],
    max_tokens: maxTokens > 0 ? maxTokens : undefined,
    stream: true as const,
    stream_options: { include_usage: true },
  });

  let firstTokenTime: number | null = null;
  let lastTokenTime = 0;
  let text = "";
  let apiUsage: { completion_tokens?: number; prompt_tokens?: number } | null = null;
  const startTime = performance.now();

  for await (const chunk of stream) {
    const now = performance.now();

    // Capture API-reported usage from final chunk
    if (chunk.usage) {
      apiUsage = chunk.usage;
    }

    if (!chunk.choices || chunk.choices.length === 0) continue;

    const content = chunk.choices[0]?.delta?.content;
    if (!content) continue;

    if (firstTokenTime === null) firstTokenTime = now;
    lastTokenTime = now;
    text += content;

    // Use client-side tokenizer for live display (close enough for real-time UI)
    const tokenCount = countTokens(text);

    const ttft = firstTokenTime - startTime;
    const elapsed = now - startTime;
    const timeSinceFirst = (now - firstTokenTime) / 1000;
    const currentTps = timeSinceFirst > 0 ? tokenCount / timeSinceFirst : 0;

    onChunk({ text, tokenCount, ttft, elapsed, currentTps });
  }

  if (firstTokenTime === null) {
    throw new Error("No tokens received from API");
  }

  // For final results: prefer API-reported token count (exact for any tokenizer),
  // fall back to client-side count (approximate for non-GPT models)
  const completionTokens = apiUsage?.completion_tokens ?? countTokens(text);
  const totalTime = lastTokenTime - startTime;
  const generationTime = (lastTokenTime - firstTokenTime) / 1000;
  const tps = generationTime > 0 ? completionTokens / generationTime : 0;

  return { tps, ttft: firstTokenTime - startTime, totalTime, completionTokens, text };
}

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { AppConfig, ModelProfile } from "../types.js";

interface SettingsScreenProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onBack: () => void;
}

type SettingsView = "main" | "add-model" | "edit-prompt" | "edit-tokens" | "edit-runs";

interface ModelFormState {
  step: "name" | "baseUrl" | "apiKey" | "modelId";
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  editIndex: number | null;
}

const EMPTY_FORM: ModelFormState = {
  step: "name",
  name: "",
  baseUrl: "",
  apiKey: "",
  modelId: "",
  editIndex: null,
};

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

export function SettingsScreen({ config, onSave, onBack }: SettingsScreenProps) {
  const [view, setView] = useState<SettingsView>("main");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modelForm, setModelForm] = useState<ModelFormState>(EMPTY_FORM);

  const menuItems = [
    ...config.models.map((m, i) => ({ type: "model" as const, label: m.name, index: i })),
    { type: "action" as const, label: "[a] Add model", action: "add" },
    { type: "config" as const, label: `Prompt: "${config.prompt.slice(0, 40)}..."`, action: "prompt" },
    { type: "config" as const, label: `Max tokens: ${config.maxTokens || "unlimited"}`, action: "tokens" },
    { type: "config" as const, label: `Runs: ${config.runs}`, action: "runs" },
  ];

  useInput(
    (input, key) => {
      if (view !== "main") return;

      if (key.escape || input === "b") {
        onBack();
        return;
      }

      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
      }
      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(menuItems.length - 1, i + 1));
      }

      if (input === "a") {
        setModelForm(EMPTY_FORM);
        setView("add-model");
        return;
      }

      if (input === "d") {
        const item = menuItems[selectedIndex];
        if (item?.type === "model") {
          const newModels = config.models.filter((_, i) => i !== item.index);
          const newActive = Math.min(config.activeModelIndex, Math.max(0, newModels.length - 1));
          onSave({ ...config, models: newModels, activeModelIndex: newActive });
        }
        return;
      }

      if (input === "e") {
        const item = menuItems[selectedIndex];
        if (item?.type === "model") {
          const m = config.models[item.index]!;
          setModelForm({
            step: "name",
            name: m.name,
            baseUrl: m.baseUrl,
            apiKey: m.apiKey,
            modelId: m.modelId,
            editIndex: item.index,
          });
          setView("add-model");
        }
        return;
      }

      if (key.return) {
        const item = menuItems[selectedIndex];
        if (item?.type === "model") {
          onSave({ ...config, activeModelIndex: item.index });
          return;
        }
        if (item?.type === "config") {
          if (item.action === "prompt") setView("edit-prompt");
          if (item.action === "tokens") setView("edit-tokens");
          if (item.action === "runs") setView("edit-runs");
        }
      }
    },
    { isActive: view === "main" },
  );

  if (view === "add-model") {
    const stepLabel = { name: "Model name", baseUrl: "Base URL", apiKey: "API key", modelId: "Model ID" };
    const steps: ModelFormState["step"][] = ["name", "baseUrl", "apiKey", "modelId"];
    const currentStepIndex = steps.indexOf(modelForm.step);

    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>{modelForm.editIndex !== null ? "EDIT" : "ADD"} MODEL</Text>
        <Text dimColor>{"─".repeat(44)}</Text>

        {steps.map((step, i) => {
          if (i > currentStepIndex) return null;
          const value = modelForm[step];
          const isCurrent = step === modelForm.step;
          const displayValue = step === "apiKey" && !isCurrent ? maskKey(value) : value;

          return (
            <Box key={step}>
              <Text dimColor={!isCurrent}>{stepLabel[step]}: </Text>
              {isCurrent ? (
                <TextInput
                  defaultValue={value}
                  placeholder={`Enter ${stepLabel[step].toLowerCase()}...`}
                  onSubmit={(val) => {
                    const updated = { ...modelForm, [step]: val };
                    if (currentStepIndex < steps.length - 1) {
                      setModelForm({ ...updated, step: steps[currentStepIndex + 1]! });
                    } else {
                      const newModel: ModelProfile = {
                        name: updated.name,
                        baseUrl: updated.baseUrl,
                        apiKey: updated.apiKey,
                        modelId: updated.modelId,
                      };
                      const newModels = [...config.models];
                      if (updated.editIndex !== null) {
                        newModels[updated.editIndex] = newModel;
                      } else {
                        newModels.push(newModel);
                      }
                      onSave({ ...config, models: newModels });
                      setView("main");
                    }
                  }}
                />
              ) : (
                <Text>{displayValue}</Text>
              )}
            </Box>
          );
        })}

        <Box marginTop={1}>
          <Text dimColor>[enter] next step  [esc] cancel</Text>
        </Box>
      </Box>
    );
  }

  if (view === "edit-prompt") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>EDIT PROMPT</Text>
        <Text dimColor>{"─".repeat(44)}</Text>
        <Box marginTop={1}>
          <TextInput
            defaultValue={config.prompt}
            placeholder="Enter test prompt..."
            onSubmit={(val) => {
              onSave({ ...config, prompt: val });
              setView("main");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (view === "edit-tokens") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>MAX TOKENS</Text>
        <Text dimColor>{"─".repeat(44)}</Text>
        <Text dimColor>Enter 0 for unlimited</Text>
        <Box marginTop={1}>
          <TextInput
            defaultValue={String(config.maxTokens)}
            placeholder="0"
            onSubmit={(val) => {
              const n = parseInt(val, 10);
              if (!isNaN(n) && n >= 0) onSave({ ...config, maxTokens: n });
              setView("main");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (view === "edit-runs") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>NUMBER OF RUNS</Text>
        <Text dimColor>{"─".repeat(44)}</Text>
        <Box marginTop={1}>
          <TextInput
            defaultValue={String(config.runs)}
            placeholder="3"
            onSubmit={(val) => {
              const n = parseInt(val, 10);
              if (!isNaN(n) && n > 0) onSave({ ...config, runs: n });
              setView("main");
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>SETTINGS</Text>
      <Text dimColor>{"─".repeat(44)}</Text>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Models</Text>

        {config.models.length === 0 && (
          <Text dimColor>No models configured. Press [a] to add one.</Text>
        )}

        {menuItems.map((item, i) => {
          const isSelected = i === selectedIndex;
          const pointer = isSelected ? "> " : "  ";

          if (item.type === "model") {
            const m = config.models[item.index]!;
            const isActive = item.index === config.activeModelIndex;
            return (
              <Box key={`model-${item.index}`}>
                <Text bold={isSelected} inverse={isSelected}>
                  {pointer}
                  {m.name}
                </Text>
                <Text dimColor>
                  {"  "}
                  {new URL(m.baseUrl).hostname}
                </Text>
                {isActive && <Text bold> *</Text>}
              </Box>
            );
          }

          if (item.type === "action") return null;

          return (
            <Box key={`config-${item.action}`} marginTop={item.action === "prompt" ? 1 : 0}>
              <Text bold={isSelected} inverse={isSelected}>
                {pointer}
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{"─".repeat(44)}</Text>
      </Box>
      <Box>
        <Text dimColor>
          [a] add  [e] edit  [d] delete  [enter] select  [esc] back
        </Text>
      </Box>
    </Box>
  );
}

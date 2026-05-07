"use client";

import { useEffect, useMemo, useState } from "react";

type PromptPlaygroundProps = {
  promptContent: string;
  defaultModel?: string | null;
};

const API_KEY_STORAGE = "prompt-maker.playground.apiKey";
const MODEL_STORAGE = "prompt-maker.playground.model";

function extractTextFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as Record<string, unknown>;

  if (typeof data.delta === "string") return data.delta;

  const choices = data.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as Record<string, unknown>;
    const delta = first?.delta as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;

    if (typeof delta?.content === "string") return delta.content;
    if (Array.isArray(delta?.content)) {
      return delta.content
        .map((part) =>
          typeof part === "object" && part && "text" in part
            ? String((part as { text?: unknown }).text ?? "")
            : "",
        )
        .join("");
    }
    if (typeof message?.content === "string") return message.content;
  }

  if (typeof data.output_text === "string") return data.output_text;
  if (Array.isArray(data.output_text)) {
    return data.output_text.map((item) => String(item)).join("");
  }

  return "";
}

export function PromptPlayground({
  promptContent,
  defaultModel,
}: PromptPlaygroundProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(defaultModel?.trim() || "gpt-4o-mini");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const storedKey = window.localStorage.getItem(API_KEY_STORAGE);
    const storedModel = window.localStorage.getItem(MODEL_STORAGE);
    if (storedKey) setApiKey(storedKey);
    if (storedModel) setModel(storedModel);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(API_KEY_STORAGE, apiKey);
  }, [apiKey]);

  useEffect(() => {
    window.localStorage.setItem(MODEL_STORAGE, model);
  }, [model]);

  const requestPayload = useMemo(
    () => ({
      model: model.trim() || "gpt-4o-mini",
      input: [
        { role: "system", content: promptContent },
        { role: "user", content: input.trim() },
      ],
      stream: true,
    }),
    [input, model, promptContent],
  );

  async function runPrompt() {
    const key = apiKey.trim();
    if (!key) {
      setError("Introduce una API key para ejecutar el playground.");
      return;
    }

    if (!input.trim()) {
      setError("Introduce un mensaje de usuario para probar el prompt.");
      return;
    }

    setRunning(true);
    setOutput("");
    setError(null);

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text || "request failed"}`);
      }

      if (!response.body) {
        const json = await response.json();
        const text = extractTextFromPayload(json);
        setOutput(text || JSON.stringify(json, null, 2));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("data:"));

          for (const line of lines) {
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data) as Record<string, unknown>;
              const delta =
                extractTextFromPayload(parsed) ||
                extractTextFromPayload(parsed.delta) ||
                extractTextFromPayload(parsed.response);

              if (delta) {
                setOutput((prev) => prev + delta);
              }
            } catch {
              // Ignora eventos parciales no JSON.
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ejecutar el playground.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border bg-[--panel-soft] p-4">
      <div>
        <h2 className="text-sm font-semibold">Playground</h2>
        <p className="text-xs text-[--ink-soft]">
          Ejecuta este prompt con tu API key local. Se guarda en este navegador.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="playground-api-key" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
            API key
          </label>
          <input
            id="playground-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="playground-model" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
            Modelo
          </label>
          <input
            id="playground-model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="gpt-4o-mini"
            className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="playground-input" className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">
          Mensaje de usuario
        </label>
        <textarea
          id="playground-input"
          rows={5}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribe el input para probar el prompt..."
          className="w-full rounded-xl border bg-[--panel] px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            void runPrompt();
          }}
          disabled={running}
          className="rounded-xl bg-[--brand] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {running ? "Ejecutando..." : "Ejecutar"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[--ink-soft]">Salida</p>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border bg-[--panel] p-3 font-mono text-xs">
          {output || "Aún no hay salida"}
        </pre>
      </div>
    </section>
  );
}

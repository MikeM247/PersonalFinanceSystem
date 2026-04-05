import type { AuthTelemetry } from "./ports.js";

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN = /(password|secret|token|cookie)/i;

export const noopAuthTelemetry: AuthTelemetry = {
  incrementCounter() {},
  observeHistogram() {},
  setGauge() {},
  log() {},
};

export function sanitizeObservabilityMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObservabilityMetadata(item));
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitizeObservabilityMetadata(nestedValue);
    }

    return result;
  }

  return value;
}

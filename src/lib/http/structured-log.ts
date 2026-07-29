type LogLevel = "debug" | "info" | "warn" | "error";

export type StructuredLogFields = Record<string, unknown>;

function emit(level: LogLevel, event: string, fields: StructuredLogFields): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logInfo(event: string, fields: StructuredLogFields = {}): void {
  emit("info", event, fields);
}

export function logWarn(event: string, fields: StructuredLogFields = {}): void {
  emit("warn", event, fields);
}

export function logError(event: string, fields: StructuredLogFields = {}): void {
  emit("error", event, fields);
}

/** Server-side API failure — never include secrets or full request bodies. */
export function logApiFailure(scope: string, err: unknown, requestId?: string): void {
  const record = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : null;
  const message =
    err instanceof Error
      ? err.message
      : typeof record?.message === "string"
        ? record.message
        : typeof err === "string" || typeof err === "number" || typeof err === "boolean"
          ? String(err)
          : "non_error_object";
  const code = typeof record?.code === "string" ? record.code : undefined;
  logError("api.failure", { scope, requestId, message: message.slice(0, 500), code });
}

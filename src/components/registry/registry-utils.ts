export function verificationStatusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "verified") return "success";
  if (status === "pending") return "warning";
  if (status === "flagged") return "danger";
  return "neutral";
}

export function isRegistryUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

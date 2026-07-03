/**
 * Transfers feature repository boundary — delegates to logistics persistence.
 * Keeps feature imports stable while Supabase schema evolves.
 */
export { listTransferOrders, listTransferOrdersSourced } from "@/lib/logistics/transfer-repository";
export type { SourcedResult } from "@/lib/data/data-source";

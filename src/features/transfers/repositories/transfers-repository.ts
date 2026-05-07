/**
 * Transfers feature repository boundary — delegates to logistics persistence.
 * Keeps feature imports stable while Supabase schema evolves.
 */
export { listTransferOrders } from "@/lib/logistics/transfer-repository";

/**
 * Canonical `operational_submissions.submission_type` values for the ministry chain.
 *
 * Farmer registration → farm boundary → field inspection → DAO/CAC/Ministry review
 * → warehouse assignment → input distribution → harvest reporting → food security analytics.
 */
export const OPERATIONAL_SUBMISSION_TYPES = {
  farmerRegistration: "farmer_registration",
  farmBoundary: "farm_boundary",
  fieldInspection: "field_inspection",
  gpsVerification: "gps_verification",
  pestDiseaseAlert: "pest_disease_alert",
  warehouseAssignment: "warehouse_assignment",
  inputDistribution: "input_distribution",
  harvestReport: "harvest_report",
  warehouseTransfer: "warehouse_transfer_confirmation",
  donorShipment: "donor_shipment_verification",
  fieldReport: "field_report",
} as const;

export type OperationalSubmissionType =
  (typeof OPERATIONAL_SUBMISSION_TYPES)[keyof typeof OPERATIONAL_SUBMISSION_TYPES];

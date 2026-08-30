import type {
  DataIntakeFoundationOperation,
  DataIntakeOrganizationRole,
} from "@/features/data-intake/domain/authorization";
import type { DataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataSourceStructureDiscovery } from "@/features/data-intake/domain/discovery";
import type {
  DataIntakeMappingRow,
  DataMappingCompleteness,
  DataMappingSnapshot,
} from "@/features/data-intake/domain/mapping";
import type { DataMatchSummary } from "@/features/data-intake/domain/matching";
import type { DataIntakeStagingRow, DataStagingSummary } from "@/features/data-intake/domain/staging";

export type DataIntakeMembership = {
  organizationId: string;
  membershipId: string;
  userId: string;
  role: DataIntakeOrganizationRole;
};

export type DataIntakeSessionStatus =
  | "created"
  | "source_ready"
  | "parsed"
  | "mapping_required"
  | "mapped"
  | "validating"
  | "review_required"
  | "ready_for_approval"
  | "approved"
  | "importing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "cancelled";

export type CreateDataIntakeSessionInput = {
  organizationId: string;
  targetDomain: "customer";
  sourceKind: DataSourceKind;
  businessActivityId?: string | null;
};

export type RegisterDataIntakeSourceInput = {
  organizationId: string;
  sessionId: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  sourceKind?: DataSourceKind;
};

export type CancelDataIntakeSessionInput = {
  organizationId: string;
  sessionId: string;
};

export type UploadDataIntakeSourceInput = {
  organizationId: string;
  sessionId: string;
  sourceId?: string;
  originalFilename: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type CreateDataIntakeSourceReadUrlInput = {
  organizationId: string;
  sessionId: string;
  sourceId: string;
};

export type DiscoverDataIntakeSourceStructureInput = {
  organizationId: string;
  sessionId: string;
  sourceId?: string;
};

export type DataIntakeMappingCommandInput = {
  organizationId: string;
  sessionId: string;
  sourceId?: string;
  sourceFieldKey: string;
  targetField?: string;
};

export type ConfirmDataIntakeMappingInput = {
  organizationId: string;
  sessionId: string;
  sourceId?: string;
};

export type ValidateDataIntakeSourceInput = {
  organizationId: string;
  sessionId: string;
  sourceId?: string;
  mappingHash?: string;
};

export type MatchDataIntakeSourceInput = {
  organizationId: string;
  sessionId: string;
  sourceId?: string;
  mappingHash?: string;
};

export type DataIntakeFoundationSuccess = {
  sessionId: string;
  status: DataIntakeSessionStatus;
  targetDomain: string;
  sourceKind: DataSourceKind;
  sourceId: string | null;
  storagePath: string | null;
  storageBucket: string | null;
  eventId: string | null;
  eventType: string | null;
  objectVerifiedAt?: string | null;
  replayed?: boolean;
  discovery?: DataSourceStructureDiscovery;
};

export type DataIntakeSignedReadUrl = {
  bucket: string;
  path: string;
  expiresInSeconds: number;
  signedUrl: string;
};

export type DataIntakeMappingSuccess = DataIntakeFoundationSuccess & {
  decisions: DataIntakeMappingRow[];
  completeness: DataMappingCompleteness;
  snapshot?: DataMappingSnapshot;
  snapshotHash?: string;
};

export type DataIntakeStagingSuccess = DataIntakeFoundationSuccess & {
  mappingHash: string | null;
  sourceSha256: string;
  summary: DataStagingSummary;
  rows: DataIntakeStagingRow[];
};

export type DataIntakeMatchingSuccess = DataIntakeFoundationSuccess & {
  mappingHash: string | null;
  sourceSha256: string;
  matcherVersion: string;
  summary: DataMatchSummary;
  rows: DataIntakeStagingRow[];
};

export type DataIntakeFoundationCommand =
  | { operation: Extract<DataIntakeFoundationOperation, "create_session">; input: CreateDataIntakeSessionInput }
  | { operation: Extract<DataIntakeFoundationOperation, "register_source">; input: RegisterDataIntakeSourceInput }
  | { operation: Extract<DataIntakeFoundationOperation, "cancel_session">; input: CancelDataIntakeSessionInput };

/**
 * DATA-1F customer.v1 import target catalog.
 * Code-owned allowlist. Not schema introspection. Not a client-supplied column list.
 */

import { DATA_CUSTOMER_ADAPTER_VERSION, DATA_EXECUTABLE_TARGET_DOMAIN } from "@/features/data-intake/domain/constants";

export const DATA_MAPPING_TARGET_DOMAINS = [DATA_EXECUTABLE_TARGET_DOMAIN] as const;
export type DataMappingTargetDomain = (typeof DATA_MAPPING_TARGET_DOMAINS)[number];

export const DATA_CUSTOMER_IMPORT_FIELD_KEYS = [
  "display_name",
  "email",
  "phone",
  "first_name",
  "last_name",
] as const;

export type DataCustomerImportFieldKey = (typeof DATA_CUSTOMER_IMPORT_FIELD_KEYS)[number];

export type DataCustomerImportFieldType = "string";

export type DataCustomerImportField = {
  key: DataCustomerImportFieldKey;
  domain: typeof DATA_EXECUTABLE_TARGET_DOMAIN;
  adapterVersion: typeof DATA_CUSTOMER_ADAPTER_VERSION;
  label: string;
  type: DataCustomerImportFieldType;
  required: boolean;
  nullable: boolean;
  maxLength: number;
  importable: true;
};

export const DATA_CUSTOMER_EXCLUDED_IMPORT_FIELDS = [
  "id",
  "organization_id",
  "status",
  "owner_member_id",
  "created_by_member_id",
  "metadata",
  "started_at",
  "ended_at",
  "archived_at",
  "created_at",
  "updated_at",
] as const;

export const DATA_CUSTOMER_IMPORT_FIELDS = [
  {
    key: "display_name",
    domain: DATA_EXECUTABLE_TARGET_DOMAIN,
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    label: "Display name",
    type: "string",
    required: true,
    nullable: false,
    maxLength: 200,
    importable: true,
  },
  {
    key: "email",
    domain: DATA_EXECUTABLE_TARGET_DOMAIN,
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    label: "Email",
    type: "string",
    required: false,
    nullable: true,
    maxLength: 200,
    importable: true,
  },
  {
    key: "phone",
    domain: DATA_EXECUTABLE_TARGET_DOMAIN,
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    label: "Phone",
    type: "string",
    required: false,
    nullable: true,
    maxLength: 50,
    importable: true,
  },
  {
    key: "first_name",
    domain: DATA_EXECUTABLE_TARGET_DOMAIN,
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    label: "First name",
    type: "string",
    required: false,
    nullable: true,
    maxLength: 200,
    importable: true,
  },
  {
    key: "last_name",
    domain: DATA_EXECUTABLE_TARGET_DOMAIN,
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    label: "Last name",
    type: "string",
    required: false,
    nullable: true,
    maxLength: 200,
    importable: true,
  },
] as const satisfies readonly DataCustomerImportField[];

export function isDataMappingTargetDomain(value: string): value is DataMappingTargetDomain {
  return (DATA_MAPPING_TARGET_DOMAINS as readonly string[]).includes(value);
}

export function isDataCustomerImportFieldKey(
  value: string,
): value is DataCustomerImportFieldKey {
  return (DATA_CUSTOMER_IMPORT_FIELD_KEYS as readonly string[]).includes(value);
}

export function isExcludedCustomerImportField(value: string): boolean {
  return (DATA_CUSTOMER_EXCLUDED_IMPORT_FIELDS as readonly string[]).includes(value);
}

export function getCustomerImportTargetCatalog(): readonly DataCustomerImportField[] {
  return DATA_CUSTOMER_IMPORT_FIELDS;
}

export function requiredCustomerImportFieldKeys(): DataCustomerImportFieldKey[] {
  return DATA_CUSTOMER_IMPORT_FIELDS.filter((field) => field.required).map((field) => field.key);
}

export function resolveCustomerImportField(
  targetDomain: string,
  targetField: string,
): DataCustomerImportField | null {
  if (targetDomain !== DATA_EXECUTABLE_TARGET_DOMAIN) {
    return null;
  }
  return DATA_CUSTOMER_IMPORT_FIELDS.find((field) => field.key === targetField) ?? null;
}

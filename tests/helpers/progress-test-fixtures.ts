export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const PROGRESS_FACT_ID = "55555555-5555-4555-8555-555555555555";
export const ENROLLMENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const CUSTOMER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";
export const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
export const USER_ID = "44444444-4444-4444-8444-444444444444";
export const CORRECTED_FROM_ID = "66666666-6666-4666-8666-666666666666";

export const sampleProgressFactListRow = {
  id: PROGRESS_FACT_ID,
  organization_id: ORG_ID,
  enrollment_id: ENROLLMENT_ID,
  customer_id: CUSTOMER_ID,
  program_id: PROGRAM_ID,
  fact_type: "milestone_reached",
  source: "manual",
  title: "Module 1 complete",
  occurred_at: "2026-07-20T10:00:00.000Z",
  recorded_at: "2026-07-20T10:05:00.000Z",
  recorded_by_member_id: MEMBER_ID,
  voided_at: null,
  corrected_from_fact_id: null,
};

export const sampleProgressFactDetailRow = {
  ...sampleProgressFactListRow,
  description: "Completed first module",
  numeric_value: 1,
  numeric_unit: "module",
  is_complete: true,
  sequence_number: 1,
  idempotency_key: null,
  voided_by_member_id: null,
  void_reason: null,
};

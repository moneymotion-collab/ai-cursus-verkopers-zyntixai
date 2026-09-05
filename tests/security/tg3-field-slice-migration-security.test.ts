import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20260905172331_tg3_field_slice.sql"),
  "utf8",
).toLowerCase();

describe("TG3-FIELD-SLICE migration security", () => {
  it("creates only the authorized Site, Work Order, and status-history tables", () => {
    expect(sql).toContain("create table public.sites");
    expect(sql).toContain("create table public.work_orders");
    expect(sql).toContain("create table public.work_order_status_history");
    expect(sql).not.toMatch(/create table public\.(jobs|technicians|dispatch_routes|vehicles)/);
  });

  it("anchors Site Customer and Job references to the same organization", () => {
    expect(sql).toContain("sites_customer_fk foreign key (organization_id, customer_id)");
    expect(sql).toContain("sites_project_fk foreign key (organization_id, project_id)");
    expect(sql).toContain("p.customer_id = p_customer_id");
  });

  it("anchors Work Order Site, Job, technician, and creator references to one organization", () => {
    expect(sql).toContain("work_orders_project_fk foreign key (organization_id, project_id)");
    expect(sql).toContain("work_orders_site_fk foreign key (organization_id, site_id)");
    expect(sql).toMatch(/organization_id,\s+technician_member_id/);
    expect(sql).toContain("s.project_id = p_project_id");
  });

  it("requires the technician to be an active organization member", () => {
    expect(sql).toContain("technician must be an active organization member");
    expect(sql).toContain("om.status = 'active'");
    expect(sql).not.toContain("create table public.technicians");
  });

  it("uses a controlled explicit Work Order lifecycle", () => {
    expect(sql).toContain("private.is_allowed_work_order_status_transition");
    expect(sql).toContain("p_from_status = 'planned' and p_to_status in ('scheduled', 'cancelled')");
    expect(sql).toContain("p_from_status = 'scheduled' and p_to_status in ('planned', 'in_progress', 'cancelled')");
    expect(sql).toContain("p_from_status = 'in_progress' and p_to_status in ('scheduled', 'completed', 'cancelled')");
    expect(sql).toContain("status = 'completed' and completed_at is not null");
  });

  it("enables RLS and grants table reads only", () => {
    for (const table of ["sites", "work_orders", "work_order_status_history"]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
      expect(sql).toContain(`revoke all on table public.${table} from public, anon, authenticated`);
      expect(sql).toContain(`grant select on table public.${table} to authenticated`);
    }
  });

  it("keeps all CUD mutations RPC-only with authenticated grants", () => {
    for (const fn of [
      "create_site",
      "update_site",
      "archive_site",
      "restore_site",
      "create_work_order",
      "update_work_order",
      "transition_work_order_status",
    ]) {
      expect(sql).toContain(`function public.${fn}`);
    }
    expect(sql).not.toMatch(/grant (insert|update|delete) on table public\.(sites|work_orders)/);
  });

  it("uses security-definer functions with an empty search path", () => {
    expect(sql.match(/security definer/g)?.length).toBeGreaterThanOrEqual(12);
    expect(sql.match(/set search_path = ''/g)?.length).toBeGreaterThanOrEqual(12);
  });

  it("limits routine operation to Owner/Admin/Staff and administration to Owner/Admin", () => {
    expect(sql).toContain("array['owner', 'admin', 'staff']");
    expect(sql).toContain("array['owner', 'admin']");
    expect(sql).not.toMatch(/array\[[^\]]*'viewer'/);
  });

  it("adds only two high-value Work Order Attention rules", () => {
    expect(sql).toContain("'work_order_overdue'");
    expect(sql).toContain("'work_order_unassigned'");
    expect(sql).not.toMatch(/work_order_(stale|blocked|route|sla)/);
  });

  it("reuses existing Attention dedupe, signal, event, and expiry helpers", () => {
    expect(sql).toContain("private.build_attention_source_dedupe_key");
    expect(sql).toContain("private.append_attention_signal");
    expect(sql).toContain("private.insert_attention_item_event");
    expect(sql).toContain("private.expire_attention_item");
  });

  it("dedupes by organization, Work Order, and rule and expires healthy/completed state", () => {
    expect(sql).toContain("'work_order', p_work_order_id, p_rule_key");
    expect(sql).toContain("ai.status in ('open', 'acknowledged')");
    expect(sql).toContain("private.expire_work_order_attention_item");
    expect(sql).toContain("v_work_order.status = 'scheduled'");
    expect(sql).toContain("v_work_order.scheduled_for < v_now");
    expect(sql).toContain("v_work_order.status in ('scheduled', 'in_progress')");
    expect(sql).toContain("v_work_order.scheduled_for <= v_now + interval '24 hours'");
    expect(sql).toContain("v_work_order.technician_member_id is null");
    expect(sql).not.toMatch(/v_work_order\.status = 'completed'\s+and v_work_order\.scheduled_for/);
  });

  it("keeps advanced Field scope out of the schema", () => {
    const ddl = sql.split("\n").filter((line) => !line.trim().startsWith("--")).join("\n");
    expect(ddl).not.toMatch(/latitude|longitude|geofence|route_optimi|vehicle|inventory|material|timesheet|payroll|photo|signature|job_cost/);
  });
});

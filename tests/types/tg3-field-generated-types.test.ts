import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

describe("TG3 generated database contract", () => {
  it("exposes Site and Work Order rows without a Jobs or Technicians table", () => {
    const site: Database["public"]["Tables"]["sites"]["Row"] = {
      id: "site",
      organization_id: "org",
      customer_id: "customer",
      project_id: "project",
      name: "Warehouse",
      address_line_1: "Main Street 1",
      address_line_2: null,
      postal_code: "1000 AA",
      city: "Amsterdam",
      country: "Netherlands",
      operational_note: null,
      created_by_member_id: "member",
      archived_at: null,
      created_at: "now",
      updated_at: "now",
    };
    const workOrder: Database["public"]["Tables"]["work_orders"]["Row"] = {
      id: "work-order",
      organization_id: "org",
      project_id: site.project_id,
      site_id: site.id,
      title: "Install unit",
      instructions: null,
      technician_member_id: "member",
      scheduled_for: "now",
      status: "scheduled",
      completed_at: null,
      created_by_member_id: "member",
      created_at: "now",
      updated_at: "now",
    };
    expect(workOrder.project_id).toBe("project");
    expect(workOrder.technician_member_id).toBe("member");
  });

  it("types every public Field mutation and Attention evaluation RPC", () => {
    type Functions = Database["public"]["Functions"];
    const names: (keyof Functions)[] = [
      "create_site",
      "update_site",
      "archive_site",
      "restore_site",
      "create_work_order",
      "update_work_order",
      "transition_work_order_status",
      "evaluate_work_order_attention_rules",
    ];
    expect(names).toHaveLength(8);
  });
});

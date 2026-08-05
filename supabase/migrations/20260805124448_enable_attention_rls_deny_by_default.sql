-- ZyntixAI B1.7.2 Attention Database Foundation:
-- RLS enablement with deny-by-default (no operational policies until B1.7.3)

alter table public.attention_items enable row level security;
alter table public.attention_signals enable row level security;

revoke all on table public.attention_items from public;
revoke all on table public.attention_items from anon;
revoke all on table public.attention_items from authenticated;

revoke all on table public.attention_signals from public;
revoke all on table public.attention_signals from anon;
revoke all on table public.attention_signals from authenticated;

-- Intentionally no GRANT SELECT/INSERT/UPDATE/DELETE to anon or authenticated.
-- Intentionally no CREATE POLICY. B1.7.3 adds authorization matrix + RPC-only mutation path.
-- Application actors cannot UPDATE Signals (immutability trigger) or DELETE Signals
-- (no grants + RLS deny-by-default). Physical DELETE remains available to DB owner /
-- FK CASCADE only — not an application product path.

comment on table public.attention_items is
  'Organization-scoped Attention Items (Enrollment-sourced). B1.7.2: RLS enabled deny-by-default; B1.7.3 adds SELECT policies + SECURITY DEFINER RPCs.';

comment on table public.attention_signals is
  'Append-only Attention Signals. B1.7.2: RLS deny-by-default + UPDATE immutability trigger; application DELETE denied by privileges/RLS; B1.7.3 adds append-only creation RPC and SELECT policies.';

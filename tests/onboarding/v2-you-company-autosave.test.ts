import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LatestIntentAutosave,
  type AutosaveStatus,
} from "@/features/onboarding/ui/latest-intent-autosave";

type Values = { company: string };
type Result = { ok: boolean; persisted?: string };

function deferred<Result>() {
  let resolve!: (value: Result) => void;
  const promise = new Promise<Result>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

describe("V2 You & Company latest-intent autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 600ms and collapses rapid edits to the latest coherent state", async () => {
    const save = vi.fn(async (value: Values) => ({
      ok: true,
      persisted: value.company,
    }));
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      save,
      (result) => result.ok,
      vi.fn(),
    );

    queue.update({ company: "A" }, true);
    await vi.advanceTimersByTimeAsync(300);
    queue.update({ company: "Acme" }, true);
    await vi.advanceTimersByTimeAsync(599);
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ company: "Acme" });
    queue.dispose();
  });

  it("does not flash Saving before a request has remained pending for 400ms", async () => {
    const pending = deferred<Result>();
    const statuses: AutosaveStatus<Result>[] = [];
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      () => pending.promise,
      (result) => result.ok,
      (status) => statuses.push(status),
    );

    queue.update({ company: "Acme" }, true);
    await vi.advanceTimersByTimeAsync(600);
    await vi.advanceTimersByTimeAsync(399);
    expect(statuses.some((status) => status.phase === "saving")).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(statuses.at(-1)?.phase).toBe("saving");

    pending.resolve({ ok: true, persisted: "Acme" });
    await vi.runAllTimersAsync();
    queue.dispose();
  });

  it("serializes revisions so an older response cannot follow a newer write", async () => {
    const requestA = deferred<Result>();
    const requestB = deferred<Result>();
    const persisted: string[] = [];
    let activeRequests = 0;
    let maxActiveRequests = 0;
    const statuses: AutosaveStatus<Result>[] = [];
    const save = vi.fn(async (value: Values) => {
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      const result =
        value.company === "Acme" ? await requestA.promise : await requestB.promise;
      activeRequests -= 1;
      if (result.ok) {
        persisted.push(result.persisted!);
      }
      return result;
    });
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      save,
      (result) => result.ok,
      (status) => statuses.push(status),
    );

    queue.update({ company: "Acme" }, true);
    await vi.advanceTimersByTimeAsync(600);
    expect(save).toHaveBeenCalledTimes(1);

    queue.update({ company: "Acme Group" }, true);
    await vi.advanceTimersByTimeAsync(600);
    expect(save).toHaveBeenCalledTimes(1);
    expect(
      statuses.some(
        (status) => status.phase === "saved" && status.revision === 1,
      ),
    ).toBe(false);

    requestA.resolve({ ok: true, persisted: "Acme" });
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ company: "Acme Group" });

    requestB.resolve({ ok: true, persisted: "Acme Group" });
    await vi.advanceTimersByTimeAsync(0);
    expect(persisted).toEqual(["Acme", "Acme Group"]);
    expect(persisted.at(-1)).toBe("Acme Group");
    expect(maxActiveRequests).toBe(1);
    expect(statuses.at(-1)).toMatchObject({ phase: "saved", revision: 2 });
    queue.dispose();
  });

  it("flushes an unelapsed debounce and prevents a stale timer save", async () => {
    const save = vi.fn(async (value: Values) => ({
      ok: true,
      persisted: value.company,
    }));
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      save,
      (result) => result.ok,
      vi.fn(),
    );

    queue.update({ company: "Latest" }, true);
    await vi.advanceTimersByTimeAsync(200);
    const outcome = await queue.flush();
    expect(outcome).toMatchObject({ kind: "saved", revision: 1 });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ company: "Latest" });

    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
    queue.dispose();
  });

  it("queues latest Continue intent behind an active autosave", async () => {
    const requestA = deferred<Result>();
    const requestB = deferred<Result>();
    const save = vi.fn((value: Values) =>
      value.company === "A" ? requestA.promise : requestB.promise,
    );
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      save,
      (result) => result.ok,
      vi.fn(),
    );

    queue.update({ company: "A" }, true);
    await vi.advanceTimersByTimeAsync(600);
    queue.update({ company: "B" }, true);
    const flushed = queue.flush();
    expect(save).toHaveBeenCalledTimes(1);

    requestA.resolve({ ok: true, persisted: "A" });
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ company: "B" });

    requestB.resolve({ ok: true, persisted: "B" });
    await expect(flushed).resolves.toMatchObject({
      kind: "saved",
      revision: 2,
      result: { persisted: "B" },
    });
    queue.dispose();
  });

  it("coalesces rapid duplicate Continue flushes into one mutation", async () => {
    const pending = deferred<Result>();
    const save = vi.fn(() => pending.promise);
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      save,
      (result) => result.ok,
      vi.fn(),
    );
    queue.update({ company: "Acme" }, true);

    const first = queue.flush();
    const second = queue.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(1);
    pending.resolve({ ok: true, persisted: "Acme" });
    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ kind: "saved", revision: 1 }),
      expect.objectContaining({ kind: "saved", revision: 1 }),
    ]);
    queue.dispose();
  });

  it("retains dirty intent after failure and recovers on a later edit", async () => {
    const statuses: AutosaveStatus<Result>[] = [];
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, persisted: "Recovered" });
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      save,
      (result) => result.ok,
      (status) => statuses.push(status),
    );

    queue.update({ company: "Failure" }, true);
    await vi.advanceTimersByTimeAsync(600);
    expect(statuses.at(-1)?.phase).toBe("error");

    queue.update({ company: "Recovered" }, true);
    expect(statuses.at(-1)?.phase).toBe("dirty");
    await vi.advanceTimersByTimeAsync(600);
    expect(statuses.at(-1)).toMatchObject({
      phase: "saved",
      result: { persisted: "Recovered" },
    });
    queue.dispose();
  });

  it("allows a failed blocking flush to retry the same preserved values", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, persisted: "Acme" });
    const queue = new LatestIntentAutosave<Values, Result>(
      { company: "Initial" },
      save,
      (result) => result.ok,
      vi.fn(),
    );
    queue.update({ company: "Acme" }, true);

    await expect(queue.flush()).resolves.toMatchObject({
      kind: "failed",
      revision: 1,
    });
    await expect(queue.flush()).resolves.toMatchObject({
      kind: "saved",
      revision: 1,
      result: { persisted: "Acme" },
    });
    expect(save).toHaveBeenNthCalledWith(1, { company: "Acme" });
    expect(save).toHaveBeenNthCalledWith(2, { company: "Acme" });
    queue.dispose();
  });
});

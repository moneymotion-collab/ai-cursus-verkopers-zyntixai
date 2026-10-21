export type AutosavePhase = "idle" | "dirty" | "saving" | "saved" | "error";

export type AutosaveStatus<Result> = {
  phase: AutosavePhase;
  revision: number;
  result?: Result;
};

export type SaveOutcome<Result> =
  | { kind: "saved"; revision: number; result: Result }
  | { kind: "failed"; revision: number; result?: Result }
  | { kind: "superseded"; revision: number };

type PendingSave<Value, Result> = {
  revision: number;
  value: Value;
  promise: Promise<SaveOutcome<Result>>;
  resolve: (outcome: SaveOutcome<Result>) => void;
};

type ActiveSave<Result> = {
  revision: number;
  promise: Promise<SaveOutcome<Result>>;
};

/**
 * A single-writer, latest-value queue.
 *
 * At most one request is ever in flight. New edits replace queued (not active)
 * work, so an older request cannot finish after a newer server write.
 */
export class LatestIntentAutosave<Value, Result> {
  private latestValue: Value;
  private latestRevision = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private savingTimer: ReturnType<typeof setTimeout> | null = null;
  private pending: PendingSave<Value, Result> | null = null;
  private active: ActiveSave<Result> | null = null;
  private disposed = false;

  constructor(
    initialValue: Value,
    private readonly save: (value: Value) => Promise<Result>,
    private readonly isSuccess: (result: Result) => boolean,
    private readonly onStatus: (status: AutosaveStatus<Result>) => void,
    private readonly debounceMs = 600,
    private readonly savingFeedbackMs = 400,
  ) {
    this.latestValue = initialValue;
  }

  update(value: Value, eligibleForSave: boolean): number {
    this.latestValue = value;
    this.latestRevision += 1;
    this.clearDebounce();
    this.supersedePending();
    this.emit({ phase: "dirty", revision: this.latestRevision });

    if (eligibleForSave) {
      const revision = this.latestRevision;
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        if (revision === this.latestRevision) {
          void this.enqueueLatest();
        }
      }, this.debounceMs);
    }

    return this.latestRevision;
  }

  cancelScheduled(): void {
    this.clearDebounce();
    this.supersedePending();
  }

  async flush(): Promise<SaveOutcome<Result>> {
    this.clearDebounce();
    if (
      this.active?.revision === this.latestRevision &&
      this.pending === null
    ) {
      return this.active.promise;
    }
    if (this.pending?.revision === this.latestRevision) {
      return this.pending.promise;
    }
    return this.enqueueLatest();
  }

  dispose(): void {
    this.disposed = true;
    this.clearDebounce();
    this.clearSavingTimer();
    this.supersedePending();
  }

  private enqueueLatest(): Promise<SaveOutcome<Result>> {
    this.supersedePending();
    let resolve!: (outcome: SaveOutcome<Result>) => void;
    const promise = new Promise<SaveOutcome<Result>>((resolver) => {
      resolve = resolver;
    });
    this.pending = {
      revision: this.latestRevision,
      value: this.latestValue,
      promise,
      resolve,
    };
    this.drain();
    return promise;
  }

  private drain(): void {
    if (this.active || !this.pending || this.disposed) {
      return;
    }

    const attempt = this.pending;
    this.pending = null;
    const promise = Promise.resolve().then(() => this.execute(attempt));
    this.active = { revision: attempt.revision, promise };

    void promise.then((outcome) => {
      attempt.resolve(outcome);
      if (this.active?.revision === attempt.revision) {
        this.active = null;
      }
      this.drain();
    });
  }

  private async execute(
    attempt: PendingSave<Value, Result>,
  ): Promise<SaveOutcome<Result>> {
    this.clearSavingTimer();
    this.savingTimer = setTimeout(() => {
      this.savingTimer = null;
      if (
        this.active?.revision === attempt.revision &&
        attempt.revision === this.latestRevision
      ) {
        this.emit({ phase: "saving", revision: attempt.revision });
      }
    }, this.savingFeedbackMs);

    try {
      const result = await this.save(attempt.value);
      this.clearSavingTimer();
      if (this.isSuccess(result)) {
        if (
          attempt.revision === this.latestRevision &&
          this.pending === null
        ) {
          this.emit({
            phase: "saved",
            revision: attempt.revision,
            result,
          });
        } else {
          this.emit({ phase: "dirty", revision: this.latestRevision });
        }
        return { kind: "saved", revision: attempt.revision, result };
      }

      if (
        attempt.revision === this.latestRevision &&
        this.pending === null
      ) {
        this.emit({
          phase: "error",
          revision: attempt.revision,
          result,
        });
      } else {
        this.emit({ phase: "dirty", revision: this.latestRevision });
      }
      return { kind: "failed", revision: attempt.revision, result };
    } catch {
      this.clearSavingTimer();
      if (
        attempt.revision === this.latestRevision &&
        this.pending === null
      ) {
        this.emit({ phase: "error", revision: attempt.revision });
      } else {
        this.emit({ phase: "dirty", revision: this.latestRevision });
      }
      return { kind: "failed", revision: attempt.revision };
    }
  }

  private supersedePending(): void {
    if (!this.pending) {
      return;
    }
    this.pending.resolve({
      kind: "superseded",
      revision: this.pending.revision,
    });
    this.pending = null;
  }

  private clearDebounce(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private clearSavingTimer(): void {
    if (this.savingTimer) {
      clearTimeout(this.savingTimer);
      this.savingTimer = null;
    }
  }

  private emit(status: AutosaveStatus<Result>): void {
    if (!this.disposed) {
      this.onStatus(status);
    }
  }
}

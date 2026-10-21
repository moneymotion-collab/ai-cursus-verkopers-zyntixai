import type {
  ControlPlaneFilterBuilder,
  ControlPlaneQueryClient,
  ControlPlaneQueryResponse,
  ControlPlaneTableName,
} from "@/features/control-plane/server/control-plane-query";

type Filter =
  | { type: "eq"; column: string; value: string | number }
  | { type: "in"; column: string; values: readonly string[] }
  | { type: "is"; column: string; value: null };

export type ControlPlaneMemoryTables = Partial<
  Record<ControlPlaneTableName, Record<string, unknown>[]>
>;

class MemoryFilterBuilder implements ControlPlaneFilterBuilder {
  constructor(
    private readonly rows: Record<string, unknown>[],
    private readonly filters: Filter[] = [],
    private readonly orderBy: { column: string; ascending: boolean } | null = null,
  ) {}

  select(): ControlPlaneFilterBuilder {
    return this;
  }

  eq(column: string, value: string | number): ControlPlaneFilterBuilder {
    return new MemoryFilterBuilder(
      this.rows,
      [...this.filters, { type: "eq", column, value }],
      this.orderBy,
    );
  }

  in(column: string, values: readonly string[]): ControlPlaneFilterBuilder {
    return new MemoryFilterBuilder(
      this.rows,
      [...this.filters, { type: "in", column, values }],
      this.orderBy,
    );
  }

  is(column: string, value: null): ControlPlaneFilterBuilder {
    return new MemoryFilterBuilder(
      this.rows,
      [...this.filters, { type: "is", column, value }],
      this.orderBy,
    );
  }

  order(
    column: string,
    options?: { ascending?: boolean },
  ): ControlPlaneFilterBuilder {
    return new MemoryFilterBuilder(this.rows, this.filters, {
      column,
      ascending: options?.ascending !== false,
    });
  }

  then<TResult1 = ControlPlaneQueryResponse, TResult2 = never>(
    onfulfilled?:
      | ((value: ControlPlaneQueryResponse) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): ControlPlaneQueryResponse {
    let data = this.rows.filter((row) =>
      this.filters.every((filter) => {
        if (filter.type === "eq") {
          return row[filter.column] == filter.value;
        }
        if (filter.type === "in") {
          return filter.values.includes(String(row[filter.column] ?? ""));
        }
        return row[filter.column] === null;
      }),
    );
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      data = [...data].sort((a, b) => {
        const left = String(a[column] ?? "");
        const right = String(b[column] ?? "");
        return ascending ? left.localeCompare(right) : right.localeCompare(left);
      });
    }
    return { data, error: null };
  }
}

export function createControlPlaneMemoryClient(
  tables: ControlPlaneMemoryTables,
): ControlPlaneQueryClient {
  return {
    from(table: ControlPlaneTableName) {
      return new MemoryFilterBuilder(tables[table] ?? []);
    },
  };
}

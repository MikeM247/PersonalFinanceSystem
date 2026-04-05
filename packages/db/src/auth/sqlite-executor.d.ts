export type SqlValue = string | number | null | Uint8Array;
export interface SqlQueryResult<Row> {
    rows: Row[];
}
export interface SqlRunResult {
    changes: number;
}
export interface SqlExecutor {
    exec(sql: string): void;
    query<Row>(sql: string, parameters?: readonly SqlValue[]): SqlQueryResult<Row>;
    run(sql: string, parameters?: readonly SqlValue[]): SqlRunResult;
}

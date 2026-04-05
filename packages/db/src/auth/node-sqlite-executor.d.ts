import { DatabaseSync } from "node:sqlite";
import type { SqlExecutor, SqlValue } from "./sqlite-executor.js";
export declare class NodeSqliteExecutor implements SqlExecutor {
    private readonly database;
    constructor(database: DatabaseSync);
    exec(sql: string): void;
    query<Row>(sql: string, parameters?: readonly SqlValue[]): {
        rows: Row[];
    };
    run(sql: string, parameters?: readonly SqlValue[]): {
        changes: number;
    };
}
export declare function createNodeSqliteExecutor(databasePath: string): NodeSqliteExecutor;
export declare function applySqlMigrationFile(executor: SqlExecutor, migrationPath: string): void;

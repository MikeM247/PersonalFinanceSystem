import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import type { SqlExecutor, SqlValue } from "./sqlite-executor.js";

export class NodeSqliteExecutor implements SqlExecutor {
  constructor(private readonly database: DatabaseSync) {}

  exec(sql: string): void {
    this.database.exec(sql);
  }

  query<Row>(sql: string, parameters: readonly SqlValue[] = []): { rows: Row[] } {
    const statement = this.database.prepare(sql);
    const rows = statement.all(...parameters) as Row[];
    return { rows };
  }

  run(sql: string, parameters: readonly SqlValue[] = []): { changes: number } {
    const statement = this.database.prepare(sql);
    const result = statement.run(...parameters);
    return { changes: Number(result.changes ?? 0) };
  }
}

export function createNodeSqliteExecutor(databasePath: string): NodeSqliteExecutor {
  return new NodeSqliteExecutor(new DatabaseSync(databasePath));
}

export function applySqlMigrationFile(executor: SqlExecutor, migrationPath: string): void {
  executor.exec(readFileSync(migrationPath, "utf8"));
}

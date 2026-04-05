import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
export class NodeSqliteExecutor {
    database;
    constructor(database) {
        this.database = database;
    }
    exec(sql) {
        this.database.exec(sql);
    }
    query(sql, parameters = []) {
        const statement = this.database.prepare(sql);
        const rows = statement.all(...parameters);
        return { rows };
    }
    run(sql, parameters = []) {
        const statement = this.database.prepare(sql);
        const result = statement.run(...parameters);
        return { changes: Number(result.changes ?? 0) };
    }
}
export function createNodeSqliteExecutor(databasePath) {
    return new NodeSqliteExecutor(new DatabaseSync(databasePath));
}
export function applySqlMigrationFile(executor, migrationPath) {
    executor.exec(readFileSync(migrationPath, "utf8"));
}
//# sourceMappingURL=node-sqlite-executor.js.map
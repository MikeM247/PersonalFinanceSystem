import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applySqlMigrationFile,
  createNodeSqliteExecutor,
  hashPassword,
  loadOwnerProvisioningConfig,
  provisionOwnerAccount,
  SqlUserRepository,
} from "../packages/db/dist/src/index.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const migrationPath = resolve(
  repositoryRoot,
  "packages/db/dist/migrations/0001_auth_persistence.sql",
);

async function main() {
  const configuration = loadOwnerProvisioningConfig(process.env);
  const executor = createNodeSqliteExecutor(configuration.databasePath);
  applySqlMigrationFile(executor, migrationPath);

  const users = new SqlUserRepository(executor);
  const result = await provisionOwnerAccount(
    {
      ownerId: configuration.ownerId,
      ownerEmail: configuration.ownerEmail,
      ownerPassword: configuration.ownerPassword,
    },
    {
      userRepository: users,
      hashPassword,
    },
  );

  if (result.created) {
    console.log(`Owner account created for ${result.user.email}.`);
    return;
  }

  console.log(`Owner account already exists for ${result.user.email}. No changes made.`);
}

void main().catch((error) => {
  console.error("Owner account provisioning failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

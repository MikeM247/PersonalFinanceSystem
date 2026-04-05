import { argon2, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const argon2Async = promisify(argon2);

const ARGON2_MEMORY_KIB = 65536;
const ARGON2_PASSES = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_TAG_LENGTH = 32;
const ARGON2_SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    throw new Error("Owner password must not be empty.");
  }

  const salt = randomBytes(ARGON2_SALT_LENGTH);
  const hash = await argon2Async("argon2id", {
    message: Buffer.from(trimmedPassword, "utf8"),
    nonce: salt,
    parallelism: ARGON2_PARALLELISM,
    tagLength: ARGON2_TAG_LENGTH,
    memory: ARGON2_MEMORY_KIB,
    passes: ARGON2_PASSES,
  });

  return [
    "argon2id",
    `m=${ARGON2_MEMORY_KIB},t=${ARGON2_PASSES},p=${ARGON2_PARALLELISM}`,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

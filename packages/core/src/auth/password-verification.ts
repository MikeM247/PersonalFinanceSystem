import { argon2, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const argon2Async = promisify(argon2);

interface ParsedHash {
  memory: number;
  passes: number;
  parallelism: number;
  salt: Buffer;
  digest: Buffer;
}

function parseStoredHash(storedHash: string): ParsedHash {
  const [algorithm, parameters, saltEncoded, digestEncoded] = storedHash.split("$");
  if (algorithm !== "argon2id" || !parameters || !saltEncoded || !digestEncoded) {
    throw new Error("Stored password hash format is invalid.");
  }

  const values = new Map(
    parameters.split(",").map((entry) => {
      const [key, value] = entry.split("=");
      return [key, Number(value)];
    }),
  );

  const memory = values.get("m");
  const passes = values.get("t");
  const parallelism = values.get("p");
  if (!memory || !passes || !parallelism) {
    throw new Error("Stored password hash parameters are invalid.");
  }

  return {
    memory,
    passes,
    parallelism,
    salt: Buffer.from(saltEncoded, "base64url"),
    digest: Buffer.from(digestEncoded, "base64url"),
  };
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    return false;
  }

  let parsed: ParsedHash;
  try {
    parsed = parseStoredHash(storedHash);
  } catch {
    return false;
  }

  const derived = await argon2Async("argon2id", {
    message: Buffer.from(trimmedPassword, "utf8"),
    nonce: parsed.salt,
    parallelism: parsed.parallelism,
    tagLength: parsed.digest.length,
    memory: parsed.memory,
    passes: parsed.passes,
  });

  if (derived.length !== parsed.digest.length) {
    return false;
  }

  return timingSafeEqual(derived, parsed.digest);
}

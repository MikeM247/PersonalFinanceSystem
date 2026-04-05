import { normalizeEmail } from "./normalize-email.js";
import type { UserRepository } from "./repository-contracts.js";
import type { UserRecord } from "./types.js";

export interface OwnerAccountProvisioningInput {
  ownerId: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface OwnerAccountProvisioningDependencies {
  userRepository: UserRepository;
  hashPassword(password: string): Promise<string>;
  now?: () => Date;
}

export interface OwnerAccountProvisioningResult {
  created: boolean;
  user: UserRecord;
}

export async function provisionOwnerAccount(
  input: OwnerAccountProvisioningInput,
  dependencies: OwnerAccountProvisioningDependencies,
): Promise<OwnerAccountProvisioningResult> {
  const normalizedEmail = normalizeEmail(input.ownerEmail);
  const existingUser = await dependencies.userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    return {
      created: false,
      user: existingUser,
    };
  }

  const now = dependencies.now?.() ?? new Date();
  const passwordHash = await dependencies.hashPassword(input.ownerPassword);
  const createdUser = await dependencies.userRepository.create({
    id: input.ownerId,
    email: normalizedEmail,
    passwordHash,
    role: "owner",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  return {
    created: true,
    user: createdUser,
  };
}

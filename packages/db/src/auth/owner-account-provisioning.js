import { normalizeEmail } from "./normalize-email.js";
export async function provisionOwnerAccount(input, dependencies) {
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
//# sourceMappingURL=owner-account-provisioning.js.map
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
export declare function provisionOwnerAccount(input: OwnerAccountProvisioningInput, dependencies: OwnerAccountProvisioningDependencies): Promise<OwnerAccountProvisioningResult>;

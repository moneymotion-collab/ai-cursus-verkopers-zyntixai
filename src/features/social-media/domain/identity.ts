import type { InstagramProfessionalAccountType } from "./account-type";
import type { ImplementedSocialProvider } from "./provider";
import type { SocialExternalAccountId } from "./types";

/**
 * Provider-derived account identity from a future adapter (B1.1-D).
 * Must not contain credential material.
 */
export type SocialProviderAccountIdentity = {
  provider: ImplementedSocialProvider;
  externalAccountId: SocialExternalAccountId;
  displayName: string | null;
  username: string | null;
  professionalAccountType: InstagramProfessionalAccountType | null;
};

/**
 * Authorized inventory returned by the provider after login.
 * Browser-supplied arbitrary external_account_id is not independent authority.
 */
export type SocialAuthorizedAccountInventory = {
  provider: ImplementedSocialProvider;
  accounts: readonly SocialProviderAccountIdentity[];
};

export function isAccountInAuthorizedInventory(
  inventory: SocialAuthorizedAccountInventory,
  externalAccountId: SocialExternalAccountId,
): boolean {
  return inventory.accounts.some(
    (account) => account.externalAccountId === externalAccountId,
  );
}

export function selectAuthorizedAccount(
  inventory: SocialAuthorizedAccountInventory,
  externalAccountId: SocialExternalAccountId,
): SocialProviderAccountIdentity | null {
  return (
    inventory.accounts.find(
      (account) => account.externalAccountId === externalAccountId,
    ) ?? null
  );
}

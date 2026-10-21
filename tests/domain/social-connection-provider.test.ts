import { describe, expect, it } from "vitest";
import {
  IMPLEMENTED_SOCIAL_PROVIDERS,
  KNOWN_SOCIAL_PROVIDER_FAMILIES,
  isConnectionEnabledSocialProvider,
  isImplementedSocialProvider,
  isKnownSocialProviderFamily,
} from "@/features/social-media/domain/provider";
import {
  INSTAGRAM_LOGIN_PRODUCT,
  isFacebookLoginProduct,
  isImplementedSocialLoginProduct,
} from "@/features/social-media/domain/login-product";
import {
  isSupportedInstagramProfessionalAccount,
  normalizeInstagramProfessionalAccountType,
} from "@/features/social-media/domain/account-type";
import {
  isApplicationUuidNotProviderAccountId,
  isSocialExternalAccountId,
  isSocialUuid,
} from "@/features/social-media/domain/ids";
import { validateImplementedSocialProvider } from "@/features/social-media/validation/mutation-schemas";

describe("social provider support policy", () => {
  it("locks Instagram as the only implemented provider", () => {
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
    expect(isImplementedSocialProvider("instagram")).toBe(true);
  });

  it("fail-closes unsupported and future family names", () => {
    for (const value of [
      "facebook",
      "tiktok",
      "linkedin",
      "youtube",
      "x",
      "twitter",
      "",
      "INSTAGRAM",
    ]) {
      expect(isImplementedSocialProvider(value)).toBe(false);
      expect(isConnectionEnabledSocialProvider(value, true, true)).toBe(false);
    }
  });

  it("does not treat known family membership as connect authorization", () => {
    expect(isKnownSocialProviderFamily("facebook")).toBe(true);
    expect(isImplementedSocialProvider("facebook")).toBe(false);
    expect(
      isConnectionEnabledSocialProvider("facebook", true, true),
    ).toBe(false);
    expect(KNOWN_SOCIAL_PROVIDER_FAMILIES).toContain("instagram");
  });

  it("requires both feature gates before Instagram is connection-enabled", () => {
    expect(isConnectionEnabledSocialProvider("instagram", false, false)).toBe(
      false,
    );
    expect(isConnectionEnabledSocialProvider("instagram", true, false)).toBe(
      false,
    );
    expect(isConnectionEnabledSocialProvider("instagram", false, true)).toBe(
      false,
    );
    expect(isConnectionEnabledSocialProvider("instagram", true, true)).toBe(
      true,
    );
  });

  it("rejects unsupported providers at the trust boundary", () => {
    expect(validateImplementedSocialProvider("instagram").success).toBe(true);
    expect(validateImplementedSocialProvider("facebook").success).toBe(false);
    expect(validateImplementedSocialProvider("tiktok").success).toBe(false);
  });
});

describe("Instagram Login product", () => {
  it("locks instagram_login and does not treat facebook_login as implemented", () => {
    expect(INSTAGRAM_LOGIN_PRODUCT).toBe("instagram_login");
    expect(isImplementedSocialLoginProduct("instagram_login")).toBe(true);
    expect(isImplementedSocialLoginProduct("facebook_login")).toBe(false);
    expect(isFacebookLoginProduct("facebook_login")).toBe(true);
    expect(isFacebookLoginProduct("instagram_login")).toBe(false);
  });
});

describe("Instagram professional account types", () => {
  it("accepts business and creator including provider raw MEDIA_CREATOR", () => {
    expect(normalizeInstagramProfessionalAccountType("business")).toBe(
      "business",
    );
    expect(normalizeInstagramProfessionalAccountType("BUSINESS")).toBe(
      "business",
    );
    expect(normalizeInstagramProfessionalAccountType("creator")).toBe(
      "creator",
    );
    expect(normalizeInstagramProfessionalAccountType("MEDIA_CREATOR")).toBe(
      "creator",
    );
    expect(isSupportedInstagramProfessionalAccount("business")).toBe(true);
    expect(isSupportedInstagramProfessionalAccount("creator")).toBe(true);
  });

  it("rejects personal and unknown account types", () => {
    expect(normalizeInstagramProfessionalAccountType("personal")).toBeNull();
    expect(normalizeInstagramProfessionalAccountType("PERSONAL")).toBeNull();
    expect(isSupportedInstagramProfessionalAccount("personal")).toBe(false);
    expect(isSupportedInstagramProfessionalAccount(null)).toBe(false);
    expect(isSupportedInstagramProfessionalAccount("")).toBe(false);
  });
});

describe("identifier boundaries", () => {
  it("keeps Instagram external account ids distinct from application UUIDs", () => {
    const igUserId = "17841405309211844";
    const appId = "11111111-1111-4111-8111-111111111111";
    expect(isSocialExternalAccountId(igUserId)).toBe(true);
    expect(isSocialUuid(igUserId)).toBe(false);
    expect(isApplicationUuidNotProviderAccountId(igUserId)).toBe(false);
    expect(isSocialUuid(appId)).toBe(true);
    expect(isSocialExternalAccountId("")).toBe(false);
    expect(isSocialExternalAccountId(" 123 ")).toBe(false);
  });
});

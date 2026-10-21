/**
 * Instagram Login is not interchangeable with Facebook Login (OD-SMM-10).
 * facebook_login is not an active B1.1 path.
 */

export const IMPLEMENTED_SOCIAL_LOGIN_PRODUCTS = ["instagram_login"] as const;

export type ImplementedSocialLoginProduct =
  (typeof IMPLEMENTED_SOCIAL_LOGIN_PRODUCTS)[number];

export type SocialLoginProduct = ImplementedSocialLoginProduct;

export const INSTAGRAM_LOGIN_PRODUCT = "instagram_login" as const satisfies SocialLoginProduct;

export function isImplementedSocialLoginProduct(
  value: string,
): value is ImplementedSocialLoginProduct {
  return (IMPLEMENTED_SOCIAL_LOGIN_PRODUCTS as readonly string[]).includes(
    value,
  );
}

export function isFacebookLoginProduct(value: string): boolean {
  return value === "facebook_login";
}

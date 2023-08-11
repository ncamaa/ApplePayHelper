/**
 * Configuration object for ApplePayHelper.
 */
export interface ApplePayConfig {
  /**
   * Your Apple Merchant ID.
   */
  merchantId: string;

  /**
   * The display name for your merchant.
   */
  displayName: string;

  /**
   * The initiative context (usually your domain).
   */
  initiativeContext: string;

  /**
   * The version of the Apple Pay token format.
   */
  version: string;

  /**
   * The initiative for the payment, typically "web" for web-based payments.
   */
  initiative: string;

  /**
   * The payment processor's private key PEM file content.
   */
  paymentProcessorPrivateKeyPem: string;

  /**
   * The merchant certificate only PEM file content.
   */
  merchantCertOnlyPem: string;

  /**
   * The merchant private key only PEM file content.
   */
  merchantKeyOnlyPem: string;
}

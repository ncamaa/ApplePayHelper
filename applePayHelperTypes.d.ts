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

  /**
   * Validate the expiration date of the token and also verifies the certificate chain
   * Defaults to true.
   */
  isValidateExpirationDate?: boolean;

  /**
   * Token expiration window in milliseconds.
   * Defaults to 5 minutes.
   */
  tokenExpirationWindow?: number;
}

export interface StartSessionResponseFromApple {
  epochTimestamp: number;
  expiresAt: number;
  merchantSessionIdentifier: string;
  nonce: string;
  merchantIdentifier: string;
  domainName: string;
  displayName: string;
  signature: string;
  operationalAnalyticsIdentifier: string;
  retries: number;
  pspId: string;
}

export interface ApplePaymentResponse extends PaymentResponse {
  requestId: string;
  methodName: string;
  details: ApplePaymentResponse_Details;
  shippingAddress: null;
  shippingOption: null;
  payerName: null;
  payerEmail: null;
  payerPhone: null;
}

export interface ApplePaymentResponse_Token {
  paymentData: ApplePaymentResponse_PaymentData;
  paymentMethod: ApplePaymentResponse_PaymentMethod;
  transactionIdentifier: string;
}

export interface ApplePaymentResponse_PaymentData {
  data: string;
  signature: string;
  header: ApplePaymentResponse_Header;
  version: string;
}

// extend ApplePaymentResponse_PaymentData and add 'metadata' property
export interface ApplePaymentResponse_PaymentDataWithMetadata
  extends ApplePaymentResponse_PaymentData {
  metadata: WebhookMetaData;
}

export interface ApplePaymentResponse_Header {
  publicKeyHash: string;
  ephemeralPublicKey: string;
  transactionId: string;
}

export interface ApplePaymentResponse_PaymentMethod {
  displayName: string;
  network: string;
  type: string;
}

// decryption interfaces

export interface DecryptedTokenRaw {
  applicationPrimaryAccountNumber: string;
  applicationExpirationDate: string;
  currencyCode: string;
  transactionAmount: number;
  deviceManufacturerIdentifier: string;
  paymentDataType: string;
  paymentData: DecryptedTokenRaw_PaymentData;
}

export interface DecryptedTokenRaw_PaymentData {
  onlinePaymentCryptogram: string;
}

/**
 * Decrypted token returned after decrypting an Apple Pay token.
 */
export interface PayCOMDecryptedToken {
  /**
   * The source data of the decrypted token.
   */
  source_data: SourceData;
  /**
   * The amount associated with the token.
   */
  amount: number;
  /**
   * The currency used in the token.
   */
  currency: string;
}

/**
 * Source data for the decrypted token.
 */
export interface SourceData {
  /**
   * The type of the source data.
   */
  type: string;
  /**
   * The network token information.
   */
  network_token: NetworkToken;
}

/**
 * Network token information for the decrypted token's source data.
 */
export interface NetworkToken {
  /**
   * The token value.
   */
  token: string;
  /**
   * The type of the token.
   */
  token_type: string;
  /**
   * The expiration month of the token.
   */
  expiry_month: string;
  /**
   * The expiration year of the token.
   */
  expiry_year: string;
  /**
   * ThreeDS data for the token (3D Secure).
   */
  three_ds: ThreeDs;
}

/**
 * ThreeDS data for the decrypted token's network token.
 */
export interface ThreeDs {
  /**
   * The Electronic Commerce Indicator for the token.
   */
  eci: string;
  /**
   * The cryptogram associated with the token.
   */
  cryptogram: string;
}

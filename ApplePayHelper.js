const ApplePaySession = require("./ApplePaySession");
const Decryptor = require("./Decryptor");
const Mapper = require("./Mapper");

/**
 * ApplePayHelper Class
 * Provides utilities for Apple Pay integration, including session initiation, token decryption, and data mapping.
 */
class ApplePayHelper {
  /**
   * Constructs an instance of ApplePayHelper.
   * @param {import('./applePayHelperTypes').ApplePayConfig} config - Configuration object containing necessary parameters.
   */
  constructor(config) {
    this.config = config;
    this.session = new ApplePaySession(config);
    this.decryptor = new Decryptor(config);
    this.mapper = new Mapper(config);
  }

  /**
   * @typedef {import('./applePayHelperTypes').StartSessionResponseFromApple} StartSessionResponseFromApple
   *
   * Initiates the Apple Pay session.
   * @param {{appleValidationURL?: String}} data - An object containing the Apple Pay validation URL.
   * @returns {Promise<StartSessionResponseFromApple>} - The result of the session initiation.
   */
  async initiateSession(data) {
    try {
      const res = await this.session.start(data);
      return res;
    } catch (error) {
      console.error("Error initiating Apple Pay session:", error);
      throw error;
    }
  }

  /**
   * Decrypts the Apple Pay token.
   * @param {import('./applePayHelperTypes').ApplePaymentResponse_PaymentData} token - The Apple Pay token to be decrypted.
   * @returns {Promise<import('./applePayHelperTypes').DecryptedTokenRaw>} - The decrypted token.
   */
  async decryptToken(token) {
    try {
      return await this.decryptor.decrypt(token);
    } catch (error) {
      console.error("Error decrypting Apple Pay token:", error);
      throw error;
    }
  }

  /**
   * Maps the decrypted token to the desired format.
   * @param {Promise<import('./applePayHelperTypes').DecryptedTokenRaw>} decryptedToken - The decrypted Apple Pay token.
   * @param {string} provider - The provider's name (e.g., "PayCom").
   * @returns { Promise<import('./applePayHelperTypes').PayCOMDecryptedToken } - The mapped token.
   */
  mapToken(decryptedToken, provider) {
    try {
      const mapped = this.mapper.map(decryptedToken, provider);

      return mapped;
    } catch (error) {
      console.error("Error mapping decrypted token:", error);
      throw error;
    }
  }
}

module.exports = ApplePayHelper;

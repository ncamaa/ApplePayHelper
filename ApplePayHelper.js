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
   * @param {Object} config - Configuration object containing necessary parameters.
   */
  constructor(config) {
    this.config = config;
    this.session = new ApplePaySession(config);
    this.decryptor = new Decryptor(config);
    this.mapper = new Mapper(config);
  }

  /**
   * Initiates the Apple Pay session.
   * @param {Object} data - Data required to start the Apple Pay session.
   * @returns {Promise<Object>} - The result of the session initiation.
   */
  async initiateSession(data) {
    try {
      return await this.session.start(data);
    } catch (error) {
      console.error("Error initiating Apple Pay session:", error);
      throw error;
    }
  }

  /**
   * Decrypts the Apple Pay token.
   * @param {Object} token - The Apple Pay token to be decrypted.
   * @returns {Promise<Object>} - The decrypted token.
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
   * @param {Object} decryptedToken - The decrypted Apple Pay token.
   * @param {string} provider - The provider's name (e.g., "PayCom").
   * @returns {Object} - The mapped token.
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

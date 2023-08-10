const PaymentToken = require('./PaymentToken');
const Mapper = require('./Mapper');

/**
 * Decryptor Class
 * Handles the logic to decrypt the Apple Pay token.
 */
class Decryptor {
  /**
   * Constructs an instance of Decryptor.
   * @param {Object} config - Configuration object containing necessary parameters.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Decrypts the Apple Pay token.
   * @param {Object} token - The Apple Pay token to be decrypted.
   * @returns {Promise<Object>} - The decrypted token.
   */
  async decrypt(token) {
    try {
      const paymentToken = new PaymentToken(token);
      const decrypted = paymentToken.decrypt(
        this.config.appleMerchantCertPem,
        this.config.applePaymentProcessorPrivateKeyPem
      );

      // If you want to map the decrypted token immediately after decryption
      const mapper = new Mapper(this.config);
      const mapped = mapper.map(decrypted);

      return mapped;
    } catch (error) {
      console.error('Error decrypting Apple Pay token:', error);
      throw error;
    }
  }
}

module.exports = Decryptor;

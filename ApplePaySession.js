const request = require("request");

/**
 * ApplePaySession Class
 * Handles the logic related to starting the Apple Pay session.
 */
class ApplePaySession {
  /**
   * Constructs an instance of ApplePaySession.
   * @param {Object} config - Configuration object containing necessary parameters.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Starts the Apple Pay session.
   * @param {Object} data - Data required to start the Apple Pay session.
   * @returns {Promise<Object>} - The result of the session initiation.
   */
  async start(data) {
    let { appleValidationURL } = data;

    if (!appleValidationURL) {
      appleValidationURL =
        "https://apple-pay-gateway.apple.com/paymentservices/startSession";
    }

    try {
      const response = await this.validateMerchant(appleValidationURL);
      return response;
    } catch (error) {
      console.error("Error occurred in validateMerchant function:", error);
      throw error;
    }
  }

  /**
   * Validates the merchant using Apple Pay.
   * @param {string} appleValidationURL - The Apple Pay validation URL.
   * @returns {Promise<Object>} - The result of the merchant validation.
   */
  async validateMerchant(appleValidationURL) {
    const options = {
      url: appleValidationURL,
      agentOptions: {
        cert: this.config.merchantCertOnlyPem,
        key: this.config.merchantKeyOnlyPem,
      },
      method: "post",
      body: {
        merchantIdentifier: this.config.merchantId,
        displayName: this.config.displayName,
        initiative: this.config.initiative,
        initiativeContext: this.config.initiativeContext,
      },
      json: true,
    };

    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (body) {
          resolve(body);
        } else if (error) {
          reject(error);
        }
      });
    });
  }
}

module.exports = ApplePaySession;

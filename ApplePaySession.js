const https = require("https");

/**
 * ApplePaySession Class
 * Handles the logic related to starting the Apple Pay session.
 */
class ApplePaySession {
  /**
   * Constructs an instance of ApplePaySession.
   * @param {import('./applePayHelperTypes').ApplePayConfig} config - Configuration object containing necessary parameters.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * @typedef {import('./applePayHelperTypes').StartSessionResponseFromApple} StartSessionResponseFromApple
   *
   * Starts the Apple Pay session.
   * @param {{appleValidationURL?: String}} data - An object containing the Apple Pay validation URL.
   * @returns {Promise<StartSessionResponseFromApple>} - The result of the session initiation.
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
   * @returns {Promise<import('./applePayHelperTypes').ApplePaymentResponse>} - The result of the merchant validation.
   */
  async validateMerchant(appleValidationURL) {
    return new Promise((resolve, reject) => {
      // Create an HTTPS agent with the certificate and key
      const agent = new https.Agent({
        cert: this.config.merchantCertOnlyPem,
        key: this.config.merchantKeyOnlyPem,
      });

      // Prepare the request options
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        agent,
      };

      // Create the request
      const req = https.request(appleValidationURL, requestOptions, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Failed to validate merchant: ${data}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      // Write the request body
      req.write(
        JSON.stringify({
          merchantIdentifier: this.config.merchantId,
          displayName: this.config.displayName,
          initiative: this.config.initiative,
          initiativeContext: this.config.initiativeContext,
        })
      );

      // End the request
      req.end();
    });
  }
}

module.exports = ApplePaySession;

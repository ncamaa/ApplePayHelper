/**
 * Mapper Class
 * Handles the logic to map the decrypted Apple Pay token to the desired format.
 */
class Mapper {
  /**
   * Constructs an instance of Mapper.
   * @param {Object} config - Configuration object containing necessary parameters.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Maps the decrypted token using the specified provider's format.
   * @param {Object} decryptedToken - The decrypted Apple Pay token.
   * @param {string} provider - The provider's name (e.g., "PayCom").
   * @returns {Object} - The mapped token.
   */
  map(decryptedToken, provider = 'PayCom') {
    switch (provider) {
      case 'PayCom':
        return this.mapToPayCom(decryptedToken);
      // Add cases for other providers as needed
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Maps the decrypted token to the PayCom format.
   * @param {Object} decryptedToken - The decrypted Apple Pay token.
   * @returns {Object} - The mapped token.
   */
  mapToPayCom(decryptedToken) {
    const applicationExpirationDate = decryptedToken.applicationExpirationDate;
    const currencyCode = decryptedToken.currencyCode;
    const transactionAmount = decryptedToken.transactionAmount;
    const onlinePaymentCryptogram = decryptedToken.paymentData.onlinePaymentCryptogram;

    return {
      source_data: {
        type: 'network_token',
        network_token: {
          token: decryptedToken.applicationPrimaryAccountNumber,
          token_type: 'applepay',
          expiry_month: applicationExpirationDate.substring(2, 4),
          expiry_year: `20${applicationExpirationDate.substring(0, 2)}`,
          three_ds: {
            eci: '06', // Assuming ECI is a constant value in this case
            cryptogram: onlinePaymentCryptogram
          }
        }
      },
      amount: transactionAmount,
      currency: this.getCurrencyCode(currencyCode)
    };
  }

  /**
   * Returns the three-letter currency code in lowercase for a given numerical currency code.
   * @param {number} numCode - The numerical currency code (e.g., 840).
   * @returns {string} - The three-letter currency code in lowercase (e.g., "usd"), or "unknown" if the numerical code is not recognized.
   */
  getCurrencyCode(numCode) {
    const currencyMap = {
      840: 'usd',
      978: 'eur',
      376: 'ils'
    };

    const currencyCode = currencyMap[numCode];
    return currencyCode ? currencyCode : 'unknown';
  }
}

module.exports = Mapper;

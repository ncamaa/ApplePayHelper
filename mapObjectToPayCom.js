/**
 * Transforms a payment result object into the required source data format.
 *
 * @param {import('../../types/applePay').ExpectedObjectForApplePayDecryptionClass} input The input object containing payment details.
 * @return {import('../../types/applePay').paycom} The transformed object in the target format.
 */
function mapObjectToPayCom(input) {
  // Extracting relevant data from the input object
  const applicationExpirationDate = input.applicationExpirationDate
  const currencyCode = input.currencyCode
  const transactionAmount = input.transactionAmount
  const onlinePaymentCryptogram = input.paymentData.onlinePaymentCryptogram

  // Mapping to the required output format
  return {
    source_data: {
      type: 'network_token',
      network_token: {
        token: input.applicationPrimaryAccountNumber,
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
    currency: getCurrencyCode(currencyCode)
  }
}

module.exports = mapObjectToPayCom

/**
 * Returns the three-letter currency code in lowercase for a given numerical currency code.
 *
 * @param {number} numCode - The numerical currency code (e.g., 840).
 * @returns {string} The three-letter currency code in lowercase (e.g., "usd"), or "unknown" if the numerical code is not recognized.
 *
 * @example
 *
 * const code = getCurrencyCode(840);
 * console.log(code);  // Outputs: "usd"
 */
function getCurrencyCode(numCode) {
  // A map of numerical currency codes to lowercase three-letter currency codes.
  const currencyMap = {
    840: 'usd',
    978: 'eur',
    376: 'ils'
  }

  // Retrieve the lowercase three-letter currency code from the map using the numerical code.
  const currencyCode = currencyMap[numCode]

  // If the currency code is found, return it. Otherwise, return "unknown".
  return currencyCode ? currencyCode : 'unknown'
}

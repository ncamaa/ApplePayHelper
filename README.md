[![npm downloads](https://img.shields.io/npm/dt/apple-pay-helper.svg)](https://www.npmjs.com/package/apple-pay-helper)
[![npm version](https://badge.fury.io/js/apple-pay-helper.svg)](https://www.npmjs.com/package/apple-pay-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# 🍏 ApplePayHelper

ApplePayHelper is a comprehensive JavaScript library designed to simplify the integration of Apple Pay within your Node.js applications. It provides a seamless way to initiate Apple Pay sessions, decrypt payment tokens, and map the decrypted tokens to different payment providers. Most of the decryption logic is taken from [samcorcos/apple-pay-decrypt]('https://github.com/samcorcos/apple-pay-decrypt') and was modified to work with modern Node.js. I highly recommend checking his guide on how to generate the required PEM files for Apple Pay. Although mentioned `Unpacked Size 45 kB` in the npm package, the actual sum size of the files that are being used is around `14kb` and `7kb` on gzip format. That is not including the dependencies.

## 🌟 Features

- **Apple Pay Merchant Validation**: Easily initiate Apple Pay sessions with Apple's servers for the `onmerchantvalidation` event.
- **Payment Token Decryption**: Securely decrypt Apple Pay payment tokens using your merchant certificates once the user has authorized the payment.
- **Payment Provider Mapping**: Map the decrypted payment tokens to different payment providers.

## 📦 Installation

You can install the `apple-pay-helper` library from npm:

```bash
npm install apple-pay-helper
```

## Before You Begin

#### 📜 You'll need to have the following files before you can get started:

1. Merchant certificate (merchantCertOnlyPem)
2. Merchant private key (merchantKeyOnlyPem)
3. Payment processor private key (paymentProcessorPrivateKeyPem)

#### You can read more here on how to generate these files:

- [File Numbers 1,2](GenerateMerchantCertAndKeyPem.md)
- [File Number 3](GeneratePaymentProcessorKeyPem.md)
- The old decrypting library that does not support modern Node.js has a good guide on how to generate the required files. You can find it [here](https://github.com/samcorcos/apple-pay-decrypt)

## 🚀 Quick Start

Here's a quick example to get you started:

```javascript
const fs = require("fs");
const ApplePayHelper = require("apple-pay-helper");

/**
 * Get the 3 required PEM files from the filesystem.
 * 1. Merchant certificate (merchantCertOnlyPem)
 * 2. Merchant private key (merchantKeyOnlyPem)
 * 3. Payment processor private key (paymentProcessorPrivateKeyPem)
 * Note: Make sure to generate these files using the instructions
 */
const merchantCertOnlyPem = fs
  .readFileSync("path/to/your-merchant-cert-file.pem")
  .toString();
const merchantKeyOnlyPem = fs
  .readFileSync("path/to/your-merchant-key-file.pem")
  .toString();
const paymentProcessorPrivateKeyPem = fs
  .readFileSync("path/to/your-payment-processor-key-file.pem")
  .toString();

const applePayConfig = {
  merchantId: "merchant.com.yourdomain.pay",
  displayName: "Your Company",
  initiativeContext: "yourdomain.com",
  version: "0008",
  initiative: "web", // web, ios, etc.
  isValidateExpirationDate: true, // neither to validate the expiration date of the payment token or not
  tokenExpirationWindow: 300000, // defaults to 5 minutes
  paymentProcessorPrivateKeyPem: paymentProcessorPrivateKeyPem,
  merchantCertOnlyPem: merchantCertOnlyPem,
  merchantKeyOnlyPem: merchantKeyOnlyPem,
};

const applePayHelper = new ApplePayHelper(applePayConfig);

/**
 * Initiate an Apple Pay session with Apple's servers. Use the response inside the 'onmerchantvalidation' event handler in the front.
 */
const appleValidationURL =
  "https://apple-pay-gateway.apple.com/paymentservices/startSession";
const response = await applePayHelper.initiateSession(appleValidationURL);

// After the user has authorized the payment, you can send the encrypted token from the front and decrypt the token like so:
const decryptedToken = await applePayHelper.decryptToken(paymentData);

// at this point you send the decrypted token to your payment processor
```

For a more detailed example, check out the [test file](testing-server.js)

## 📖 Resources

- [Apple's official demo](https://applepaydemo.apple.com/)
- [Create a certificate signing request](https://developer.apple.com/help/account/create-certificates/create-a-certificate-signing-request)
- [Becoming an Apple Pay Merchant](https://developers.tabapay.com/reference/how-to-become-an-apple-pay-merchant)
- [Apple Pay Example](https://ionutghisoi.medium.com/apple-pay-example-payments-1-acc2b7954b05)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙌 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

Happy coding! 🎉

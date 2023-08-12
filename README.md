# 🍏 ApplePayHelper

ApplePayHelper is a comprehensive JavaScript library designed to simplify the integration of Apple Pay within your Node.js applications. It provides a seamless way to initiate Apple Pay sessions, decrypt payment tokens, and map the decrypted tokens to different payment providers. Most of the decryption logic is taken from [samcorcos/apple-pay-decrypt]('https://github.com/samcorcos/apple-pay-decrypt') and was modified to work with modern Node.js. I highly recommend checking his guide on how to generate the required PEM files for Apple Pay.

## 🌟 Features

- **Apple Pay Session Initialization**: Easily initiate Apple Pay sessions with Apple's servers.
- **Payment Token Decryption**: Securely decrypt Apple Pay payment tokens using your merchant certificates.
- **Payment Provider Mapping**: Map the decrypted payment tokens to different payment providers like PayCom.

## 📦 Installation

You can install the ApplePayHelper library from npm:

```bash
npm install apple-pay-helper
```

## Before You Begin

#### 📜 You'll need to have the following files before you can get started:

1. Merchant certificate (merchantCertOnlyPem)
2. Merchant private key (merchantKeyOnlyPem)
3. Payment processor private key (paymentProcessorPrivateKeyPem)

#### You can ready more here how to generate these files:

- [File Numbers 1,2](GenerateMerchantCertAndKeyPem.md)
- [File Number 3](GeneratePaymentProcessorKeyPem.md)

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
const merchantCertOnlyPem = fs.readFileSync("path/to/your-file.pem").toString();
const merchantKeyOnlyPem = fs.readFileSync("path/to/your-file.pem").toString();
const paymentProcessorPrivateKeyPem = fs
  .readFileSync("path/to/your-file.pem")
  .toString();

const applePayConfig = {
  merchantId: "merchant.com.yourdomain.pay",
  displayName: "Your Company",
  initiativeContext: "yourdomain.com",
  version: "0008",
  initiative: "web", // web, ios, etc.
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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙌 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

Happy coding! 🎉

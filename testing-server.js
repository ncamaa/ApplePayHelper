const express = require("express");
const ApplePayHelper = require("./ApplePayHelper");
const fs = require("fs");
const app = express();

// get ENV / Config variables
const {
  merchantCertOnlyPemPath,
  merchantKeyOnlyPemPath,
  paymentProcessorPrivateKeyPemPath,
  displayName,
  merchantId,
  initiativeContext,
} = require("./config");

/**
 * Get the 3 required PEM files from the filesystem.
 * 1. Merchant certificate (merchantCertOnlyPem)
 * 2. Merchant private key (merchantKeyOnlyPem)
 * 3. Payment processor private key (paymentProcessorPrivateKeyPem)
 * Note: Make sure to generate these files using the instructions
 */
const merchantCertOnlyPem = fs.readFileSync(merchantCertOnlyPemPath).toString();

const merchantKeyOnlyPem = fs.readFileSync(merchantKeyOnlyPemPath).toString();

const paymentProcessorPrivateKeyPem = fs
  .readFileSync(paymentProcessorPrivateKeyPemPath)
  .toString();

/** @type { import('./applePayHelperTypes').ApplePayConfig } applePayConfig */
// Configuration for Apple Pay
const applePayConfig = {
  merchantId: merchantId,
  displayName: displayName,
  initiativeContext: initiativeContext,
  initiative: "web", // web, ios, etc.
  isValidateExpirationDate: true, // validate the expiration date of the token and also verifies the certificate chain
  tokenExpirationWindow: 30000000000, // 5 minutes
  paymentProcessorPrivateKeyPem: paymentProcessorPrivateKeyPem,
  merchantCertOnlyPem: merchantCertOnlyPem,
  merchantKeyOnlyPem: merchantKeyOnlyPem,
};

const applePayHelper = new ApplePayHelper(applePayConfig);

app.use(express.json());

// Endpoint to start Apple Pay session
// When working with the PaymentRequest API in the frontend, the 'onmerchantvalidation' event will be triggered, and the event object will contain a 'validationURL' property. It is recommended to use this URL to start the Apple Pay session (under `appleValidationURL` property in the request body in this case). After receiving a successful response from the `initiateSession` function, you can call the event.complete(res) function with the result (StartSessionResponseFromApple) of this function as the parameter. This will prompt the user to authorize the payment with Touch ID or Face ID.
app.post("/start-session", async (req, res) => {
  try {
    let appleValidationURL = req.body.appleValidationURL;
    if (!appleValidationURL)
      appleValidationURL =
        "https://apple-pay-gateway.apple.com/paymentservices/startSession";
    const response = await applePayHelper.initiateSession(appleValidationURL);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error starting Apple Pay session:", error);
    res
      .status(500)
      .send("An error occurred while starting the Apple Pay session.");
  }
});

// Endpoint to decrypt Apple Pay token
// After the merchant validation and the user's authorization of the payment, the request.show() promise will be resolved with a ApplePaymentResponse object (take a look at the types file). To get the payment token out of it in the frontend you should do something like `const token = paymentResponse.details.paymentData`. This object will is a paymentToken, which is the encrypted Apple Pay token. This token can be sent to the backend to be decrypted. The decrypted token will contain the payment data, which can be used to process the payment.
app.post("/decrypt-token", async (req, res) => {
  try {
    // the token must be of type ApplePaymentResponse_PaymentData which is under details.paymentData in the ApplePaymentResponse object
    /** @type {import('./applePayHelperTypes').ApplePaymentResponse_PaymentData} token */
    const token = req.body.token; // Assuming the token is sent in the request body
    const decryptedToken = await applePayHelper.decryptToken(token);

    return res.status(200).json(decryptedToken);

    // map the decrypted token to the format required by your payment processor. This is an example of how to map the token to the format required by PayCom, but you'll have to modify this to match the format required by your payment processor.
    const mapped = applePayHelper.mapToken(decryptedToken, "PayCom");

    // now you'll have to send the mapped token to your payment processor, this is just
    // await processPaymentByYourPaymentProcessor(mapped);

    return res.status(200).send("Success");
  } catch (error) {
    console.error("Error decrypting Apple Pay token:", error);
    res
      .status(500)
      .send("An error occurred while decrypting the Apple Pay token.");
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Server is running on pot ${PORT}`);
});

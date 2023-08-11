const express = require("express");
const ApplePayHelper = require("./ApplePayHelper");
const fs = require("fs");
const path = require("path");
const app = express();

const {
  merchantCertOnlyPemPath,
  merchantKeyOnlyPemPath,
  paymentProcessorPrivateKeyPemPath,
  displayName,
  merchantId,
  initiativeContext,
} = require("./config");

const paymentProcessorPrivateKeyPem = fs
  .readFileSync(path.join(paymentProcessorPrivateKeyPemPath))
  .toString();

const merchantCertOnlyPem = fs
  .readFileSync(path.join(merchantCertOnlyPemPath))
  .toString();

const merchantKeyOnlyPem = fs
  .readFileSync(path.join(merchantKeyOnlyPemPath))
  .toString();

app.use(express.json());

/** @type {import('./applePayHelperTypes').ApplePayConfig} applePayConfig */
// Configuration for Apple Pay
const applePayConfig = {
  merchantId: "merchant.com.zeebuz.pay",
  displayName: "Zeebuz",
  initiativeContext: "dev-pay.zeebuz.com",
  version: "0008",
  initiative: "web", // web, ios, etc.
  paymentProcessorPrivateKeyPem: paymentProcessorPrivateKeyPem,
  merchantCertOnlyPem: merchantCertOnlyPem,
  merchantKeyOnlyPem: merchantKeyOnlyPem,
};

const applePayHelper = new ApplePayHelper(applePayConfig);

// Endpoint to start Apple Pay session
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
app.post("/decrypt-token", async (req, res) => {
  try {
    const token = req.body.token; // Assuming the token is sent in the request body
    const decryptedToken = await applePayHelper.decryptToken(token);

    // return decryptedToken without mapping:
    // res.status(200).json(decryptedToken);

    // return mapped token:
    const mapped = applePayHelper.mapToken(decryptedToken, "PayCom");

    return res.json(mapped);
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

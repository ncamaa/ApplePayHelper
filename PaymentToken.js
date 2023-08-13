const crypto = require("crypto");
const forge = require("node-forge");
const ECKey = require("ec-key");
const { X509Certificate } = require("@peculiar/x509");
const ApplePayHelper = require("./ApplePayHelper");
const pkijs = require("pkijs"); // needed
const asn1js = require("asn1js"); // needed
const TOKEN_EXPIRE_WINDOW = 30000; // should be set to 5 minutes (300000 ms) per apple
const LEAF_CERTIFICATE_OID = "1.2.840.113635.100.6.29";
const INTERMEDIATE_CA_OID = "1.2.840.113635.100.6.2.14";
const SIGNINGTIME_OID = "1.2.840.113549.1.9.5";
const MERCHANT_ID_FIELD_OID = "1.2.840.113635.100.6.32";
const webCrypto = require("@peculiar/webcrypto"); // needed
/**
 * Class to handle the decryption of Apple Pay tokens.
 */
class PaymentToken {
  /**
   * @param {import('./applePayHelperTypes').ApplePaymentResponse_PaymentData} tokenAttrs - The Apple Pay token to be decrypted.
   */
  constructor(tokenAttrs) {
    this.tokenAttrs = tokenAttrs;
    this.ephemeralPublicKey = tokenAttrs.header.ephemeralPublicKey;
    this.cipherText = tokenAttrs.data;
  }

  /**
   * Main method to decrypt the token.
   * @param {string} certPem - Merchant certificate in PEM format.
   * @param {string} privatePem - Merchant private key in PEM format.
   * @param {boolean} validateExpiration - Whether to validate the expiration of the token.
   * @param {number} [expirationWindow=300000] - The expiration window in milliseconds.
   * @returns { import('./applePayHelperTypes').DecryptedTokenRaw } Decrypted token data.
   */
  decrypt(
    certPem,
    privatePem,
    validateExpiration = true,
    expirationWindow = TOKEN_EXPIRE_WINDOW
  ) {
    if (validateExpiration) {
      this.validateTokenExpiration(expirationWindow);
    }

    const sharedSecret = this.sharedSecret(privatePem);
    const merchantId = this.merchantIdPeculiar(certPem);
    const symmetricKey = this.symmetricKey(merchantId, sharedSecret);
    const decrypted = this.decryptCiphertext(symmetricKey, this.cipherText);

    return JSON.parse(decrypted);
  }

  /**
   * Validates the expiration of a token signature.
   *
   * @param {number} expirationWindow - The window of time (in milliseconds) in which the signature is considered valid.
   * @throws {Error} If the signature has expired.
   */
  validateTokenExpiration(expirationWindow) {
    // Create a new instance of the web crypto API
    const webcrypto = new webCrypto.Crypto();

    // Set the crypto engine to use OpenSSL
    pkijs.setEngine(
      "ossl-engine",
      webcrypto,
      new pkijs.CryptoEngine({
        name: "openssl",
        crypto: webcrypto,
        subtle: webcrypto.subtle,
      })
    );

    // Destructure the token attributes
    const {
      signature,
      header,
      data: encryptedPaymentData,
      metadata,
    } = this.tokenAttrs;

    // Destructure the header attributes
    const { ephemeralPublicKey, transactionId } = header;

    // Convert the signature from base64 to a buffer
    const cmsSignedBuffer = Buffer.from(signature, "base64");

    // Parse the buffer using ASN.1 syntax
    const cmsSignedASN1 = asn1js.fromBER(
      new Uint8Array(cmsSignedBuffer).buffer
    );

    // Create a ContentInfo object from the ASN.1 schema
    const cmsContentSimpl = new pkijs.ContentInfo({
      schema: cmsSignedASN1.result,
    });

    // Create a SignedData object from the ContentInfo content
    const cmsSignedData = new pkijs.SignedData({
      schema: cmsContentSimpl.content,
    });

    // Check the certificates in the signed data
    this.checkCertificates(cmsSignedData.certificates);

    // Get the current date and time
    const now = new Date();

    // Get the signer information from the signed data
    const signerInfo = cmsSignedData.signerInfos[0];

    // Get the signed attributes from the signer information
    const signerInfoAttrs = signerInfo.signedAttrs.attributes;

    // Find the signing time attribute
    const attr = signerInfoAttrs.find((x) => x.type === SIGNINGTIME_OID);

    // Convert the signing time attribute to a Date object
    const signedTime = new Date(attr.values[0].toDate());

    // Check if the current time is past the expiration window
    if (now - signedTime > expirationWindow) {
      throw new Error("Signature has expired");
    }
  }

  /**
   * Checks the certificates for validity.
   *
   * This function checks that there are exactly two certificates provided,
   * and that the first certificate has the leaf certificate OID extension,
   * and the second certificate has the intermediate CA OID extension.
   *
   * @param {Array} certificates - An array of certificate objects to check.
   * @throws {Error} If the number of certificates is not 2, or if the required extensions are not found.
   */
  checkCertificates(certificates) {
    // Check that there are exactly 2 certificates
    if (certificates.length !== 2) {
      throw new Error(
        `Signature certificates number error: expected 2 but got ${certificates.length}`
      );
    }

    // Check that the first certificate has the leaf certificate OID extension
    if (
      !certificates[0].extensions.find((x) => x.extnID === LEAF_CERTIFICATE_OID)
    ) {
      throw new Error(
        `Leaf certificate doesn't have extension: ${LEAF_CERTIFICATE_OID}`
      );
    }

    // Check that the second certificate has the intermediate CA OID extension
    if (
      !certificates[1].extensions.find((x) => x.extnID === INTERMEDIATE_CA_OID)
    ) {
      throw new Error(
        `Intermediate certificate doesn't have extension: ${INTERMEDIATE_CA_OID}`
      );
    }
  }

  /**
   * Compute shared secret using merchant private key and ephemeral public key.
   * @param {string} privatePem - Merchant private key in PEM format.
   * @returns {string} Shared secret.
   */
  sharedSecret(privatePem) {
    const prv = new ECKey(privatePem, "pem");
    const publicEc = new ECKey(this.ephemeralPublicKey, "spki");
    return prv.computeSecret(publicEc).toString("hex");
  }

  merchantIdPeculiar(cert) {
    try {
      // Parse the certificate using the @peculiar/x509 library
      const certificate = new X509Certificate(cert);

      const { issuerName, issuer } = certificate;

      const certExtensions = certificate.getExtensions(MERCHANT_ID_FIELD_OID);

      const { values } = certExtensions;

      const { value } = certExtensions[0];

      const uint8View = new Uint8Array(value);

      const merchantId22 = String.fromCharCode.apply(null, uint8View);

      const merchantId = merchantId22.split("@")[1];

      return merchantId;
    } catch (e) {
      console.error("Unable to extract merchant ID from certificate", e);
    }
  }

  /**
   * Derive the symmetric key using the key derivation function described in NIST SP 800-56A, section 5.8.1
   * https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-56ar.pdf
   * The symmetric key is a sha256 hash that contains shared secret token plus encoding information
   */
  symmetricKey(merchantId, sharedSecret) {
    const KDF_ALGORITHM = "\x0did-aes256-GCM"; // The byte (0x0D) followed by the ASCII string "id-aes256-GCM". The first byte of this value is an unsigned integer that indicates the string’s length in bytes; the remaining bytes are a constiable-length string.
    const KDF_PARTY_V = Buffer.from(merchantId, "hex").toString("binary"); // The SHA-256 hash of your merchant ID string literal; 32 bytes in size.
    const KDF_PARTY_U = "Apple"; // The ASCII string "Apple". This value is a fixed-length string.
    const KDF_INFO = KDF_ALGORITHM + KDF_PARTY_U + KDF_PARTY_V;

    let hash = crypto.createHash("sha256");
    hash.update(Buffer.from("000000", "hex"));
    hash.update(Buffer.from("01", "hex"));
    hash.update(Buffer.from(sharedSecret, "hex"));
    hash.update(KDF_INFO, "binary");

    return hash.digest("hex");
  }

  /**
   * Decrypting the cipher text from the token (data in the original payment token) key using AES–256 (id-aes256-GCM 2.16.840.1.101.3.4.1.46), with an initialization vector of 16 null bytes and no associated authentication data.
   *
   */
  decryptCiphertext(symmetricKey, cipherText) {
    const data = forge.util.decode64(cipherText);
    const SYMMETRIC_KEY = forge.util.createBuffer(
      Buffer.from(symmetricKey, "hex").toString("binary")
    );
    const IV = forge.util.createBuffer(
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).toString(
        "binary"
      )
    ); // Initialization vector of 16 null bytes
    const CIPHERTEXT = forge.util.createBuffer(data.slice(0, -16));

    const decipher = forge.cipher.createDecipher("AES-GCM", SYMMETRIC_KEY); // Creates and returns a Decipher object that uses the given algorithm and password (key)
    const tag = data.slice(-16, data.length);

    decipher.start({
      iv: IV,
      tagLength: 128,
      tag,
    });

    decipher.update(CIPHERTEXT);
    decipher.finish();
    return Buffer.from(decipher.output.toHex(), "hex").toString("utf-8");
  }
}

module.exports = PaymentToken;

const crypto = require("crypto");
const forge = require("node-forge");
const ECKey = require("ec-key");
const { X509Certificate } = require("@peculiar/x509");
const ApplePayHelper = require("./ApplePayHelper");
const TOKEN_EXPIRE_WINDOW = 300000; // should be set to 5 minutes (300000 ms) per apple
const LEAF_CERTIFICATE_OID = "1.2.840.113635.100.6.29";
const INTERMEDIATE_CA_OID = "1.2.840.113635.100.6.2.14";
const SIGNINGTIME_OID = "1.2.840.113549.1.9.5";
const MERCHANT_ID_FIELD_OID = "1.2.840.113635.100.6.32";

/**
 * Class to handle the decryption of Apple Pay tokens.
 */
class PaymentToken {
  /**
   * @param {Object} tokenAttrs - Attributes of the token.
   */
  constructor(tokenAttrs) {
    this.ephemeralPublicKey = tokenAttrs.header.ephemeralPublicKey;
    this.cipherText = tokenAttrs.data;
  }

  /**
   * Main method to decrypt the token.
   * @param {string} certPem - Merchant certificate in PEM format.
   * @param {string} privatePem - Merchant private key in PEM format.
   * @returns {Object} Decrypted token data.
   */
  decrypt(certPem, privatePem) {
    const sharedSecret = this.sharedSecret(privatePem);
    const merchantId = this.merchantIdPeculiar(certPem);
    const symmetricKey = this.symmetricKey(merchantId, sharedSecret);
    const decrypted = this.decryptCiphertext(symmetricKey, this.cipherText);

    return JSON.parse(decrypted);
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

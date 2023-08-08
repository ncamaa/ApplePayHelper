// const x509 = require('x509')
const crypto = require('crypto')
const forge = require('node-forge')
const ECKey = require('ec-key')
const { X509Certificate } = require('@peculiar/x509')

// CONSTANTS
const TOKEN_EXPIRE_WINDOW = 300000 // should be set to 5 minutes (300000 ms) per apple
const LEAF_CERTIFICATE_OID = '1.2.840.113635.100.6.29'
const INTERMEDIATE_CA_OID = '1.2.840.113635.100.6.2.14'
const SIGNINGTIME_OID = '1.2.840.113549.1.9.5'
const MERCHANT_ID_FIELD_OID = '1.2.840.113635.100.6.32'

/**
 * Initializing an instance of `PaymentToken` with JSON values present in the Apple Pay token string
 * JSON representation - https://developer.apple.com/library/ios/documentation/PassKit/Reference/PaymentTokenJSON/PaymentTokenJSON.html
 */
class PaymentToken {
  constructor(tokenAttrs) {
    this.ephemeralPublicKey = tokenAttrs.header.ephemeralPublicKey
    this.cipherText = tokenAttrs.data
  }

  /**
   * Decrypting the token using the PEM formatted merchant certificate and private key (the latter of which, at least, is managed by a third-party)
   */
  decrypt(certPem, privatePem) {
    const sharedSecret = this.sharedSecret(privatePem)
    console.log('sharedSecret', sharedSecret)
    const merchantId = this.merchantIdPeculiar(certPem)
    console.log('merchantId', merchantId)
    const symmetricKey = this.symmetricKey(merchantId, sharedSecret)
    console.log('symmetricKey', symmetricKey)
    const decrypted = this.decryptCiphertext(symmetricKey, this.cipherText)
    return JSON.parse(decrypted)

    // matches the second close brace and returns everything before and including
    // the second close brace. we need this because the result often returns with
    // some random cruft at the end, such as `�d*�<?}ތ0j{��[`
    // const regex = /^.+}.*?(})/g

    // return JSON.parse(decrypted.match(regex)[0])
  }

  /**
   * Generating the shared secret with the merchant private key and the ephemeral public key(part of the payment token data)
   * using Elliptic Curve Diffie-Hellman (id-ecDH 1.3.132.1.12).
   * As the Apple Pay certificate is issued using prime256v1 encryption, create elliptic curve key instances using the package - https://www.npmjs.com/package/ec-key
   */
  sharedSecret(privatePem) {
    const prv = new ECKey(privatePem, 'pem') // Create a new ECkey instance from PEM formatted string
    const publicEc = new ECKey(this.ephemeralPublicKey, 'spki') // Create a new ECKey instance from a base-64 spki string
    return prv.computeSecret(publicEc).toString('hex') // Compute secret using private key for provided ephemeral public key
  }

  verifySignatureExpiration() {}

  merchantIdPeculiar(cert) {
    try {
      console.log('parsing cert....')
      // Parse the certificate using the @peculiar/x509 library
      const certificate = new X509Certificate(cert)

      const { issuerName, issuer } = certificate

      // console.log({ issuerName, issuer })

      const certExtensions = certificate.getExtensions(MERCHANT_ID_FIELD_OID)
      console.log('akjsdfgklasjdfh')
      const { values } = certExtensions
      console.log({ certExtensions, values })

      const { value } = certExtensions[0]

      console.log({ value })

      const uint8View = new Uint8Array(value)
      const merchantId22 = String.fromCharCode.apply(null, uint8View)

      const merchantId = merchantId22.split('@')[1]
      console.log({ merchantId }) // If merchantId is encoded as a

      return merchantId
    } catch (e) {
      console.error('Unable to extract merchant ID from certificate', e)
    }
  }

  /**
   * Derive the symmetric key using the key derivation function described in NIST SP 800-56A, section 5.8.1
   * https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-56ar.pdf
   * The symmetric key is a sha256 hash that contains shared secret token plus encoding information
   */
  symmetricKey(merchantId, sharedSecret) {
    const KDF_ALGORITHM = '\x0did-aes256-GCM' // The byte (0x0D) followed by the ASCII string "id-aes256-GCM". The first byte of this value is an unsigned integer that indicates the string’s length in bytes; the remaining bytes are a constiable-length string.
    const KDF_PARTY_V = Buffer.from(merchantId, 'hex').toString('binary') // The SHA-256 hash of your merchant ID string literal; 32 bytes in size.
    const KDF_PARTY_U = 'Apple' // The ASCII string "Apple". This value is a fixed-length string.
    const KDF_INFO = KDF_ALGORITHM + KDF_PARTY_U + KDF_PARTY_V

    let hash = crypto.createHash('sha256')
    hash.update(Buffer.from('000000', 'hex'))
    hash.update(Buffer.from('01', 'hex'))
    hash.update(Buffer.from(sharedSecret, 'hex'))
    hash.update(KDF_INFO, 'binary')

    return hash.digest('hex')
  }

  /**
   * Decrypting the cipher text from the token (data in the original payment token) key using AES–256 (id-aes256-GCM 2.16.840.1.101.3.4.1.46), with an initialization vector of 16 null bytes and no associated authentication data.
   *
   */
  decryptCiphertext(symmetricKey, cipherText) {
    const data = forge.util.decode64(cipherText)
    const SYMMETRIC_KEY = forge.util.createBuffer(
      Buffer.from(symmetricKey, 'hex').toString('binary')
    )
    const IV = forge.util.createBuffer(
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).toString(
        'binary'
      )
    ) // Initialization vector of 16 null bytes
    const CIPHERTEXT = forge.util.createBuffer(data.slice(0, -16))

    const decipher = forge.cipher.createDecipher('AES-GCM', SYMMETRIC_KEY) // Creates and returns a Decipher object that uses the given algorithm and password (key)
    const tag = data.slice(-16, data.length)

    decipher.start({
      iv: IV,
      tagLength: 128,
      tag
    })

    decipher.update(CIPHERTEXT)
    decipher.finish()
    return Buffer.from(decipher.output.toHex(), 'hex').toString('utf-8')
  }
}

module.exports = PaymentToken

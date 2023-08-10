// files used here:
// applePaymentProcessorPrivateKeyPem: ./apple-pay-certs/tabapay/key.pem
// appleMerchantCertPem: /apple-pay-certs/merchant_certificate/only_merchant_certificate_pem.pem
const { logger } = require('firebase-functions')
const path = require('path')
const fs = require('fs')
const asn1js = require('asn1js') // needed
const pkijs = require('pkijs') // needed
const forge = require('node-forge') // needed
const { Crypto } = require('@peculiar/webcrypto') // needed
const { paycom_requestApplePayCharge } = require('../paymentLink/utils.js')
const PaymentToken = require('./PaymentToken')
const mapObjectToPayCom = require('./mapObjectToPayCom')

const TOKEN_EXPIRE_WINDOW = 300000 // should be set to 5 minutes (300000 ms) per apple
const LEAF_CERTIFICATE_OID = '1.2.840.113635.100.6.29'
const INTERMEDIATE_CA_OID = '1.2.840.113635.100.6.2.14'
const SIGNINGTIME_OID = '1.2.840.113549.1.9.5'
const MERCHANT_ID_FIELD_OID = '1.2.840.113635.100.6.32'

// payment processor private key
const applePaymentProcessorPrivateKeyPemPath = path.join(
  __dirname,
  './apple-pay-certs/tabapay/key.pem'
)
const applePaymentProcessorPrivateKeyPem = fs.readFileSync(
  applePaymentProcessorPrivateKeyPemPath
)

// merchant certificate in pem
const appleMerchantCertPemPath = path.join(
  __dirname,
  '/apple-pay-certs/merchant_certificate/only_merchant_certificate_pem.pem'
)
const appleMerchantCertPem = fs.readFileSync(appleMerchantCertPemPath)

const checkCertificates = certificates => {
  if (certificates.length !== 2) {
    throw new Error(
      `Signature certificates number error: expected 2 but got ${certificates.length}`
    )
  }
  if (
    !certificates[0].extensions.find(x => x.extnID === LEAF_CERTIFICATE_OID)
  ) {
    throw new Error(
      `Leaf certificate doesn't have extension: ${LEAF_CERTIFICATE_OID}`
    )
  }
  if (!certificates[1].extensions.find(x => x.extnID === INTERMEDIATE_CA_OID)) {
    throw new Error(
      `Intermediate certificate doesn't have extension: ${INTERMEDIATE_CA_OID}`
    )
  }
}

const validateSignatureExpiration = cmsSignedData => {
  const signerInfo = cmsSignedData.signerInfos[0]

  const signerInfoAttrs = signerInfo.signedAttrs.attributes

  const attr = signerInfoAttrs.find(x => x.type === SIGNINGTIME_OID)

  const signedTime = new Date(attr.values[0].toDate())

  // log to console in human readable format
  console.log('Signed time:', signedTime.toString())

  const now = new Date()

  if (now - signedTime > TOKEN_EXPIRE_WINDOW) {
    throw new Error('Signature has expired')
  } else {
    console.log('Signature is still valid.')
  }
}

// ACTUAL EXPORT FUNCTION

/**
 * @typedef { import('../../types/applePay.d.ts').ApplePaymentResponse_PaymentData } ApplePaymentResponse_PaymentData
 */

/**
 * Function to decrypt Apple Pay token.
 * @param { {data: ApplePaymentResponse_PaymentData} } payload - The encrypted Apple Pay data.
 * @param { functions.https.CallableContext } context - The function execution context.
 * @returns {{success: Boolean, error?:String, data?: String }} - The function response.
 */
exports.decryptAppleTokenFunction = async (payload, context) => {
  try {
    const data = payload
    console.log('payload')
    console.log(payload)
    console.log(JSON.stringify(payload, null, 2))

    logger.log('payload.data')
    logger.log(payload.data)
    logger.log('payload.header')
    logger.log(payload.header)
    logger.log('payload.metadata')
    logger.log(payload.metadata)

    const webcrypto = new Crypto()

    pkijs.setEngine(
      'ossl-engine',
      webcrypto,
      new pkijs.CryptoEngine({
        name: 'openssl',
        crypto: webcrypto,
        subtle: webcrypto.subtle
      })
    )

    // Input data from the client.
    const {
      version,
      signature,
      header,
      data: encryptedPaymentData,
      metadata
    } = data

    // The following values should be obtained from your payment token
    const { ephemeralPublicKey, transactionId } = header

    // from here, follow tutorial
    const cmsSignedBuffer = Buffer.from(signature, 'base64')

    // console.log('CMS signed buffer:', cmsSignedBuffer.toString('hex'))

    const cmsSignedASN1 = asn1js.fromBER(new Uint8Array(cmsSignedBuffer).buffer)

    // log to console
    // console.log('CMS signed ASN1:', cmsSignedASN1)

    const cmsContentSimpl = new pkijs.ContentInfo({
      schema: cmsSignedASN1.result
    })

    const cmsSignedData = new pkijs.SignedData({
      schema: cmsContentSimpl.content
    })

    // check certificates
    console.log('Checking certificates...')
    checkCertificates(cmsSignedData.certificates)
    console.log('Certificates checked.')

    // log AppleRootCA
    // console.log('AppleRootCA:', AppleRootCA)

    const p1 = Buffer.from(ephemeralPublicKey, 'base64')

    const p2 = Buffer.from(encryptedPaymentData, 'base64')

    const p3 = Buffer.from(transactionId, 'hex')

    const signedData = Buffer.concat([p1, p2, p3])

    // validate signature expiration
    console.log('Validating signature expiration...')
    validateSignatureExpiration(cmsSignedData)
    console.log('Signature expiration validated.')

    const paymentToken = new PaymentToken(data)

    console.log('appleMerchantCertPem')
    const decr = paymentToken.decrypt(
      appleMerchantCertPem,
      applePaymentProcessorPrivateKeyPem
    )

    const mapped = mapObjectToPayCom(decr)

    console.log('mapped', mapped)

    const reference = metadata.paymentLinkId || 'unknown'

    const amount = metadata.totalCentsIncludingFeeAndTip

    const customer_reference_id = 'apple_pay_' + reference

    const mappedWithMetadata = {
      ...mapped,
      metadata,
      reference,
      receipt: true,
      amount,
      customer_reference_id
    }

    console.log('Creating a charge in Pay.com...')

    console.log('mappedWithMetadata', mappedWithMetadata)

    const chargeResponse = await paycom_requestApplePayCharge(
      mappedWithMetadata
    )

    console.log('Charge response:', chargeResponse)

    // For now, just return the received data.
    return {
      success: true,
      data: chargeResponse.id
    }
  } catch (e) {
    console.log(e)
    return {
      success: false,
      error: e.message
    }
  }
}

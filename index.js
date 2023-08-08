// Required modules for apple payment session
const functions = require('firebase-functions')
const https = require('https')
const request = require('request')
const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

const { decryptAppleTokenFunction } = require('./decrypt-token')

const version = '0008' // Define your version

const config = functions.config()
const applePaySettings = config.auth.apple_pay

const { merchant_id, display_name, initiative_context } = applePaySettings

const merchantId = merchant_id || 'merchant.com.zeebuz.pay'
const displayName = display_name || 'Zeebuz'
const initiativeContext = initiative_context || 'dev-pay.zeebuz.com'

console.log({
  merchantId,
  displayName,
  initiativeContext
})

// Read the certificates from file
// This file was created by using the creating the CSR file and uploading it to the Apple Developer Portal, then downloading the certificate, double clicking it to install it in Keychain Access, then exporting it together with the private key as a .p12 file, then converting it to a .pem file using the following command: openssl pkcs12 -in apple_pay.p12 -out apple-pay-cert.pem -nodes -clcerts
const pemCertFilePath = path.join(
  __dirname,
  './apple-pay-certs/merchant_certificate/apple-pay-cert.pem'
)
const merchantCertAndKeyPem = fs.readFileSync(pemCertFilePath).toString()

// Firebase function to handle Apple Pay Session requests
exports.applePaySession = functions.https.onCall(async (data, context) => {
  let { appleValidationURL } = data

  console.log('Received Apple Pay session request: ', data)

  if (!appleValidationURL) {
    console.info('No Apple Pay validation URL provided. Using default URL.')
    appleValidationURL =
      'https://apple-pay-gateway.apple.com/paymentservices/startSession'
  }

  try {
    // Call the validateMerchant function and return its result
    const response = await validateMerchant(appleValidationURL)
    console.log('Validate Merchant response received')
    return response
  } catch (error) {
    console.error('Error occurred in validateMerchant function:', error)
    return {
      success: false,
      error
    }
  }
})

// Function to validate merchant using Apple Pay
async function validateMerchant(appleValidationURL) {
  // Define the path to the PEM certificate
  console.log('Successfully read PEM certificate from file.')

  try {
    // Define request options
    const options = {
      url: appleValidationURL,
      agentOptions: {
        cert: merchantCertAndKeyPem, // Use PEM certificate
        key: merchantCertAndKeyPem // Use PEM certificate as key
      },
      method: 'post',
      body: {
        merchantIdentifier: merchantId,
        displayName: displayName,
        initiative: 'web',
        initiativeContext: initiativeContext
      },
      json: true
    }

    // Send the request and await the response
    const response = await promisifyRequest(options)

    // Return the successful response
    return {
      success: true,
      response
    }
  } catch (error) {
    console.error(
      'Error occurred while communicating with Apple Pay gateway:',
      error
    )

    // Return the error response
    return {
      success: false,
      error
    }
  }
}

// Helper function to promisify the request function
function promisifyRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (body) {
        console.log('Successful response from Apple Pay gateway.')
        resolve(body)
      } else if (error) {
        console.error('Error in request to Apple Pay gateway:', error)
        reject(error)
      }
    })
  })
}

exports.decryptAppleToken = functions.https.onCall(decryptAppleTokenFunction)

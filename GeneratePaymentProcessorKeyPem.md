note: This part can be tricky. In case something is not working for you, you can generate the files using [this]('https://github.com/samcorcos/apple-pay-decrypt#readme') guide

## 🗝️ Creating Payment Processing Private Key as a PEM File for Apple Merchant Certification 🗝️

#### Step 0: Obtain a Payment Processing Certificate from Apple Developer Portal 🍏

Before you can create the private key file, you must first obtain a Payment Processing Certificate from the Apple Developer Portal. You'll need to create a Certificate Signing Request (CSR) using ECC 256 bit key pair. Follow the guide provided by Apple to create a CSR: [Create a Certificate Signing Request (CSR)](https://developer.apple.com/help/account/create-certificates/create-a-certificate-signing-request).

Once you have the CSR, you can use it to create a Payment Processing Certificate in the Apple Developer Portal. Download the certificate in p12 format.

#### Step 1: Export the Payment Processing Certificate as a p12 File 📜

1. 🖥️ Open the Keychain Access on your macOS machine.
2. 🔍 Find the Payment Processing Certificate you want to export.
3. 🖱️ Right-click on the certificate and select "Export."
4. 📂 Choose the p12 format for the export and save the file to your desired location.

#### Step 2: Convert the p12 File to PEM Format (Certificate and Private Key Together) 🔐

1. 🖥️ Open your terminal and navigate to the directory where the p12 file is located.
2. 🏃‍♂️ Run the following command to convert the p12 file to PEM format:

   ```bash
   $ openssl pkcs12 -in PaymentProcessing.p12 -out combined.pem -nodes
   ```

   Replace `PaymentProcessing.p12` with the name of your p12 file.

#### Step 3: Extract the Private Key from the Combined PEM File 🔑

1. 🏃‍♂️ Run the following command to extract the private key from the combined PEM file:

   ```bash
   $ openssl pkey -in combined.pem -out payment_processor_privatekey.pem
   ```

🎉 Congratulations! You now have the Payment Processing Private Key in PEM format (`payment_processor_privatekey.pem`). Keep this file in a secure location, as it contains sensitive information.

#### 📝 Note

- 🔒 Always handle certificates and private keys with extreme care. Exposure of these files could compromise the security of your application.
- 🛠️ If you encounter any issues, you may need to consult the OpenSSL documentation or seek help from a knowledgeable colleague or online community.

Happy coding, and stay secure! 🚀

note: This part can be tricky. In case something is not working for you, you can generate the files using [this]('https://github.com/samcorcos/apple-pay-decrypt#readme') guide

## 🗝️ Creating Certificate and Private Key as Separate PEM Files for Apple Merchant Certification 🗝️

#### Step 0: Obtain a Merchant Certificate from Apple Developer Portal 🍏

Before you can create the certificate and private key files, you must first obtain a merchant certificate from the Apple Developer Portal. You'll need to create a Certificate Signing Request (CSR) to do this. Follow the guide provided by Apple to create a CSR: [Create a Certificate Signing Request (CSR)](https://developer.apple.com/help/account/create-certificates/create-a-certificate-signing-request).

Once you have the CSR, you can use it to create a merchant certificate in the Apple Developer Portal. Download the certificate in p12 format.

#### Step 1: Export the Certificate as a p12 File 📜

1. 🖥️ Open the Keychain Access on your macOS machine.
2. 🔍 Find the certificate you want to export.
3. 🖱️ Right-click on the certificate and select "Export."
4. 📂 Choose the p12 format for the export and save the file to your desired location.

#### Step 2: Convert the p12 File to PEM Format (Certificate and Private Key Together) 🔐

1. 🖥️ Open your terminal and navigate to the directory where the p12 file is located.
2. 🏃‍♂️ Run the following command to convert the p12 file to PEM format:

   ```bash
   $ openssl pkcs12 -in Certificates.p12 -out combined.pem -nodes
   ```

   Replace `Certificates.p12` with the name of your p12 file.

#### Step 3: Extract the Certificate from the Combined PEM File 📄

1. 🏃‍♂️ Run the following command to extract the certificate from the combined PEM file:

   ```bash
   $ openssl x509 -in combined.pem -out certificate.pem
   ```

#### Step 4: Extract the Private Key from the Combined PEM File 🔑

1. 🏃‍♂️ Run the following command to extract the private key from the combined PEM file:

   ```bash
   $ openssl pkey -in combined.pem -out privatekey.pem
   ```

🎉 Congratulations! You now have the certificate in PEM format (`certificate.pem`) and the private key in PEM format (`privatekey.pem`) as separate files. Keep these files in a secure location, as they contain sensitive information.

#### 📝 Note

- 🔒 Always handle certificates and private keys with extreme care. Exposure of these files could compromise the security of your application.
- 🛠️ If you encounter any issues, you may need to consult the OpenSSL documentation or seek help from a knowledgeable colleague or online community.

Happy coding, and stay secure! 🚀

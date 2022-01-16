const fs = require('fs');
const crypto = require('crypto');

let publicKey = fs.readFileSync("./rsa_4096_pub.pem").toString()
function encrypt(toEncrypt, publicKey) {
    const buffer = Buffer.from(toEncrypt, 'utf8')
    const encrypted = crypto.publicEncrypt(publicKey, buffer)
    return encrypted.toString('base64')
}

module.exports = async function handler(req, res, instances) {
  try {
    let encrypted = encrypt(JSON.stringify(instances), publicKey);
    res.status(200).send(encrypted);
  } catch (e) {
    res.status(500).send(); 
  }
}

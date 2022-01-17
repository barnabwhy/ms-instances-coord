require( "dotenv" ).config()

const express = require('express')
const app = express()
const port = process.env.LISTEN_PORT || 80

const fs = require('fs');
const crypto = require('crypto');
let publicKey = fs.readFileSync(process.env.PUB_KEY_PATH ||"./rsa_4096_pub.pem").toString()

function encrypt(toEncrypt, publicKey) {
    const buffer = Buffer.from(toEncrypt, 'utf8')
    const encrypted = crypto.publicEncrypt(publicKey, buffer)
    return encrypted.toString('base64')
}

let pathToInstances = process.env.INSTANCES_PATH || './instances.json';
let instances = JSON.parse(fs.readFileSync(pathToInstances, 'utf-8'));
let encrypted = encrypt(JSON.stringify(instances), publicKey);
let addresses = Object.values(instances).map(inst => (inst.secure ? 'https://' : 'http://')+inst.host+':'+inst.port)

fs.watch(pathToInstances, (eventType, filename) => {
    try {
        if(eventType == "change") {
            let fileData = fs.readFileSync(pathToInstances, 'utf-8');
            let fileJson = JSON.parse(fileData);
            instances = fileJson;
            encrypted = encrypt(JSON.stringify(instances), publicKey);
            addresses = Object.values(instances).map(inst => (inst.secure ? 'https://' : 'http://')+inst.host+':'+inst.port)
        }
    } catch(e) {
        console.log(e)
    }
});

app.get('/', (req, res) => {
    res.send("This is the master server remote instance host, you shouldn't be here.")
});

app.get('/instances', (req, res) => {
    try {
        res.status(200).send(encrypted);
    } catch (e) {
        res.status(500).send(); 
    }
});
app.get('/addresses', (req, res) => {
    try {
        res.status(200).json(addresses);
      } catch (e) {
        res.status(500).send(); 
    }
});

app.listen(port, () => {
  console.log(`Master server coordinator listening on port ${port}`)
})

require( "dotenv" ).config()

const fs = require('fs');
var key  = fs.readFileSync('web_key.pem').toString();
var cert = fs.readFileSync('web_cert.pem').toString();

const https = require('https');
const serverHTTPS = https.createServer({key, cert}, handler);
const http = require('http');
const serverHTTP = http.createServer(handler);

const port = process.env.LISTEN_PORT || 80
const port_secure = process.env.LISTEN_PORT_SECURE || 443

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

const httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({});
const proxyWeb = function(req, res, options) {
    return new Promise((resolve, reject) => {
        proxy.web(req, res, options, (err, req) => {
            if(err) reject(err)
            else resolve(req)
        });
    })
}

async function handler(req, res) {
    if(req.url == '/instances') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(encrypted);
        res.end();
    } else if(req.url == '/addresses') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(addresses);
        res.end();
    } else {
        let servers = shuffleArray(addresses);
        
        let done = false;
        for(let i = 0; i < servers.length; i++) {
            if(done) return
            try {
                await proxyWeb(req, res, { target: servers[i] });
                done = true
            }catch (e) {
                if(e.code != 'ECONNREFUSED') console.log(e)
            }

        }
    }
}

serverHTTP.listen(port, () => {
    console.log(`Master server coordinator listening on port ${port}`)
})
serverHTTPS.listen(port_secure, () => {
     console.log(`Master server coordinator listening on port ${port_secure}`)
})

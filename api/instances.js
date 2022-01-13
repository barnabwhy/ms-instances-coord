const util = require('util');
const dns = require('dns');
const lookup = util.promisify(dns.lookup);

module.exports = async function handler(req, res, instances) {
  try {
    if(!req.query.id) return res.status(400).send()
    let ip = req.socket.remoteAddress;
    if(ip.startsWith("::ffff:")) ip = ip.slice(7);
    let selfFound = false;
    let instancesWithSelfs = await Promise.all(instances.map(inst => {
      return new Promise(async resolve => {
        let instIp = await lookup(inst.host.split('://')[1]);
        if(inst.id == req.query.id && instIp.address == ip) selfFound = true; 
        resolve(Object.assign(inst, { isSelf: (inst.id == req.query.id) }))
      });
    }))
    if(selfFound) {
      res.status(200).json(instancesWithSelfs);
    } else {
      res.status(401).send()
    }
  } catch (e) {
    res.status(500).send(); 
  }
}

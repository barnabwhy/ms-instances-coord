module.exports = async function handler(req, res, instances) {
  try {
    let addresses = Object.values(instances).map(inst => inst.host+':'+inst.port)
    res.status(200).json(addresses);
  } catch (e) {
    res.status(500).send(); 
  }
}

const _ = require('lodash');
const dal = require('../dal/account');

async function newAccount(req, res) {
    try {
        const { x,y,z } = req.body;
       
        res.json({ z,y,z });
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}


module.exports = {
    newAccount
}
const _ = require('lodash');

const dal = require('../dal/user');

// If add here, add to dal
async function login(req, res) {
    try {
        const { username, password } = req.body;
        let loginObject = await dal.login(username, password);
        let token = loginObject.token;
        let error = loginObject.error;
        let userID = loginObject.userID;
        if (error) {
            res.statusMessage = error;
            res.status(401).send(error).end();
            return;
        }
        res.json({ token, userID });
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

async function getUser(req, res) {
    try {
        const { userID } = req.body;
        let userObject = await dal.getUser(userID);
        let user = userObject.user;
        let error = userObject.error;
        if (error) {
            res.statusMessage = error;
            res.status(404).send(error).end();
            return;
        }
        res.json({ user });
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

async function addUser(req, res) {
    try {
        res.status(403).send().end();
        return;



        const { username, password, firstname, lastname, phone, email, database } = req.body;
        const result = await dal.addUser(username, password, firstname, lastname, phone, email, database);
        let error = _.get(result,'error');
        if (!error){
            res.status(200).send().end();
            return;
        }else{
            res.statusMessage = error;
            res.status(409).send().end();
            return;
        }
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

async function updateUser(req, res) {
    try {
        const { userID, username, password, email} = req.body;
        const result = await dal.updateUser(userID, username, password, email);
        let error = _.get(result,'error');
        let user = _.get(result,'user');
        if (!error){
            res.json(user);
            return;
        }else{
            res.statusMessage = error;
            res.status(404).send().end();
            return;
        }
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

module.exports = {
    login,
    addUser,
    getUser,
    updateUser
}
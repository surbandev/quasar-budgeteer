const _ = require('lodash');
const dal = require('../dal/setting');
const { json } = require('express');

async function setUserSetting(req, res) {
    try {
        const { setting, value } = req.body;
        const userID = req.user.id;
        const result = await dal.setUserSetting(userID,setting,value);
        res.json(result);
        return result;
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

async function deleteUserSetting(req, res) {
    try {
        const { setting } = req.body;
        const userID = req.user.id;
        await dal.deleteUserSetting(userID,setting);
        res.status(200).send().end();
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

async function getUserSetting(req, res) {
    try {
        const { setting } = req.body;
        const userID = req.user.id;
        const result = await dal.getUserSetting(userID,setting);
        res.json(_.get(result,'value',''));
     
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}


module.exports = {
    setUserSetting,
    deleteUserSetting,
    getUserSetting
}
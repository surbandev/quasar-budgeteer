const express = require('express');
const _ = require('lodash');
const settingsLogic = require('../logic/setting');
const { authenticateToken } = require('../middlware/session');

const app = express.Router();
app.post('/set-user-setting', authenticateToken, async (req, res) => {
    settingsLogic.setUserSetting(req, res);
});

app.delete('/delete-user-setting', authenticateToken, async (req, res) => {
   settingsLogic.deleteUserSetting(req, res);
});

app.get('/get-user-setting', authenticateToken, async (req, res) => {
   settingsLogic.getUserSetting(req, res);
});


module.exports = app;
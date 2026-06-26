const express = require('express');
const _ = require('lodash');
const profilesLogic = require('../logic/profile');
const { authenticateToken } = require('../middlware/session');

const app = express.Router();
app.post('/add-new-profile', authenticateToken, async (req, res) => {
    profilesLogic.addNewProfile(req, res);
});

app.put('/update-profile', authenticateToken, async (req, res) => {
    profilesLogic.updateProfile(req, res);
});

app.get('/get-profile-by-id', authenticateToken, async (req, res) => {
    profilesLogic.getProfileByID(req, res);
});

app.get('/get-profile-by-phone', authenticateToken, async (req, res) => {
    profilesLogic.getProfileByPhone(req, res);
});

app.get('/get-all-profiles', authenticateToken, async (req, res) => {
    profilesLogic.getAllProfiles(req, res);
});

app.delete('/remove-profile', authenticateToken, async (req, res) => {
    profilesLogic.removeProfile(req, res);
});

module.exports = app;
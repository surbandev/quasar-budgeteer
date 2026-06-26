const jwt = require('jsonwebtoken');
const express = require('express');
const _ = require('lodash');
const feedbackLogic = require('../logic/feedback');
const { authenticateToken } = require('../middlware/session');

const app = express.Router();

app.post('/submit-feedback', authenticateToken, async (req, res) => {
    feedbackLogic.submitFeedback(req, res);
});


module.exports = app;
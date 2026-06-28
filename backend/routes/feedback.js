const jwt = require('jsonwebtoken');
const express = require('express');
const _ = require('lodash');
const feedbackLogic = require('../logic/feedback');
const { authenticateToken } = require('../middlware/session');
const { requireAdmin } = require('../middlware/admin');

const app = express.Router();

app.post('/submit-feedback', authenticateToken, async (req, res) => {
    feedbackLogic.submitFeedback(req, res);
});

app.get('/all', authenticateToken, requireAdmin, async (req, res) => {
    feedbackLogic.listFeedback(req, res);
});


module.exports = app;
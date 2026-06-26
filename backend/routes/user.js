const express = require('express');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const userLogic = require('../logic/user');

const app = express.Router();

// Login endpoint, if add here, add to user under logic
app.post('/login', async (req, res) => {
    userLogic.login(req,res);
});

app.get('/get-user', async (req, res) => {
    userLogic.getUser(req,res);
});

app.post('/add-user', async (req, res) => {
    userLogic.addUser(req,res);
});

app.post('/register', async (req, res) => {
    userLogic.addUser(req,res);
});

app.put('/update-user', async (req, res) => {
    userLogic.updateUser(req,res);
});

module.exports = app;
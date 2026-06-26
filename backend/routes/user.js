const express = require('express');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const userLogic = require('../logic/user');
const adminLogic = require('../logic/admin');
const { authenticateToken } = require('../middlware/session');
const { requireAdmin } = require('../middlware/admin');

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
    userLogic.register(req,res);
});

app.put('/update-user', async (req, res) => {
    userLogic.updateUser(req,res);
});

app.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    adminLogic.listUsers(req, res);
});

app.post('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    adminLogic.createUser(req, res);
});

app.put('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    adminLogic.updateUser(req, res);
});

app.delete('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    adminLogic.deleteUser(req, res);
});

module.exports = app;
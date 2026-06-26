const jwt = require('jsonwebtoken');
const express = require('express');
const _ = require('lodash');
const scenariosLogic = require('../logic/scenario');
const { authenticateToken } = require('../middlware/session');

const app = express.Router();

app.post('/clone-scenario', authenticateToken, async (req, res) => {
    scenariosLogic.cloneScenario(req, res);
});

app.post('/create-scenario', authenticateToken, async (req, res) => {
    scenariosLogic.createScenario(req, res);
});

app.get('/get-all-scenarios-for-profile', authenticateToken, async (req, res) => {
    scenariosLogic.getAllScenariosForProfile(req, res);
});

app.get('/get-scenario-by-ids', authenticateToken, async (req, res) => {
    scenariosLogic.getScenarioByIDs(req, res);
});

app.put('/update-scenario', authenticateToken, async (req, res) => {
    scenariosLogic.updateScenario(req, res);
});

app.delete('/remove-scenario', authenticateToken, async (req, res) => {
    scenariosLogic.removeScenario(req, res);
});

app.post('/create-event', authenticateToken, async (req, res) => {
    scenariosLogic.createEvent(req, res);
});

app.put('/update-event', authenticateToken, async (req, res) => {
    scenariosLogic.updateEvent(req, res);
});

app.delete('/remove-event', authenticateToken, async (req, res) => {
    scenariosLogic.removeEvent(req, res);
});

app.get('/get-events-for-scenario', authenticateToken, async (req, res) => {
    scenariosLogic.getEventsForScenario(req, res);
});

app.get('/get-summary-for-scenario-on-date', authenticateToken, async (req, res) => {
    scenariosLogic.getSummaryForScenarioOnDate(req, res);
});

app.post('/toggle-event-active', authenticateToken, async (req, res) => {
    scenariosLogic.toggleEventActive(req, res);
});

app.get('/get-events-for-scenario-for-month', authenticateToken, async (req, res) => {
    scenariosLogic.getEventsForScenarioForMonth(req, res);
});

app.post('/calculate-loan-details', authenticateToken, async (req, res) => {
    scenariosLogic.calculateLoanDetails(req, res);
});

module.exports = app;
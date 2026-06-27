const _ = require('lodash');
const dal = require('../dal/scenario');
const profileDAL = require('../dal/profile');
const analysisLogic = require('./analysis');
const loanLogic = require('./loans');
const { normalizeEventFields } = require('./eventFields');
const { is } = require('bluebird');

async function cloneScenario(req, res) {
    try {
        const {
            scenarioID,
            profileID,
            name,
            description
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const newScenario = await dal.cloneScenario(scenarioID, profileID, name, description, req.user.id);
        res.json(newScenario);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to create new Scenario' });
    }
}

async function createScenario(req, res) {
    try {
        const {
            profileID,
            name,
            description,
            is_default = false
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        const newScenario = await dal.createScenario(profileID, name, description, is_default, req.user.id);
        res.json(newScenario);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to create new Scenario' });
    }
}

async function getAllScenariosForProfile(req, res) {
    try {
        const {
            profileID = req.body.id
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        const scenarios = await dal.getAllScenariosForProfile(profileID, req.user.id);
        res.json(scenarios);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Scenarios' });
    }
}

async function getScenarioByIDs(req, res) {
    try {
        const {
            profileID,
            scenarioID
        } = req.body;
        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        const scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        res.json(scenario);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Scenario' });
    }
}

async function updateScenario(req, res) {
    try {
        const {
            scenarioID,
            profileID,
            name,
            description
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        const scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const updatedScenario = await dal.updateScenario(scenarioID, profileID, name, description, req.user.id);
        res.json(updatedScenario);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Scenario' });
    }
}

async function removeScenario(req, res) {
    try {
        const {
            profileID,
            scenarioID
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }
        const result = await dal.removeScenario(scenarioID, profileID, req.user.id);
        if (result.error) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }
        res.status(200).send().end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove Scenario' });
    }
}



async function createEvent(req, res) {
    try {
        const {
            profileID,
            scenarioID,
            name,
            description,
            type,
            category,
            frequency,
            startDate,
            endDate,
            amount,
            active,
            principal,
            interest,
            calculatedEndDate,
            monthlyPayment,
            loanTerm,
            escrow
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const normalized = normalizeEventFields({
            category,
            startDate,
            endDate,
            calculatedEndDate,
            amount,
            active,
            principal,
            interest,
            monthlyPayment,
            loanTerm,
            escrow,
            description,
        });

        const newEvent = await dal.createEvent(
            profileID,
            scenarioID,
            name,
            normalized.description,
            type,
            normalized.category,
            frequency,
            normalized.startDate,
            normalized.endDate,
            normalized.amount,
            normalized.active,
            normalized.principal,
            normalized.interest,
            normalized.calculatedEndDate,
            normalized.monthlyPayment,
            normalized.term,
            normalized.escrow,
            req.user.id,
        );
        res.json(newEvent);
        return;
    } catch (error) {
        console.error('Failed to create event:', error);
        res.status(500).json({ error: 'Failed to create new Event' });
    }
}


async function updateEvent(req, res) {
    try {
        const {
            eventID,
            profileID,
            scenarioID,
            name,
            description,
            type,
            category,
            frequency,
            startDate,
            endDate,
            amount,
            active,
            principal,
            interest,
            calculatedEndDate,
            monthlyPayment,
            term,
            escrow
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const normalized = normalizeEventFields({
            category,
            startDate,
            endDate,
            calculatedEndDate,
            amount,
            active,
            principal,
            interest,
            monthlyPayment,
            term,
            loanTerm: req.body.loanTerm,
            escrow,
            description,
        });

        const updatedEvent = await dal.updateEvent(
            eventID,
            scenarioID,
            profileID,
            name,
            normalized.description,
            type,
            normalized.category,
            frequency,
            normalized.startDate,
            normalized.endDate,
            normalized.amount,
            normalized.active,
            normalized.principal,
            normalized.interest,
            normalized.calculatedEndDate,
            normalized.monthlyPayment,
            normalized.term,
            normalized.escrow,
            req.user.id,
        );
        res.json(updatedEvent);
        return;
    } catch (error) {
        console.error('Failed to update event:', error);
        res.status(500).json({ error: 'Failed to update Event' });
    }
}

async function removeEvent(req, res) {
    try {
        const {
            eventID,
            profileID,
            scenarioID
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const result = await dal.removeEvent(scenarioID, profileID, eventID, req.user.id);
        if (result.error) {
            res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).send().end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove Event' });
    }
}

async function getEventsForScenario(req, res) {
    try {
        const {
            profileID,
            scenarioID
        } = req.query;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const scenarioEvents = await dal.getEventsForScenario(scenarioID, profileID, req.user.id);
        res.json(scenarioEvents);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Scenario Events' });
    }
}

async function getSummaryForScenarioOnDate(req, res) {
    try {
        const {
            scenarioID,
            profileID,
            date
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const scenarioEvents = await analysisLogic.getSummaryForDate(scenarioID, profileID, date, req.user.id);
        res.json(scenarioEvents);
        return;

    } catch (error) {
        res.status(500).json({ error: 'Failed to get Scenario Summary By Date' });
    }
}

async function toggleEventActive(req, res) {
    try {
        const {
            scenarioID,
            profileID,
            eventID
        } = req.body;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        let event = await dal.getEventByIDs(scenarioID, profileID, eventID, req.user.id);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        await dal.toggleEventActive(scenarioID, profileID, eventID, req.user.id);

        const updatedEvent = await dal.getEventByIDs(scenarioID, profileID, eventID, req.user.id);
        res.json(updatedEvent);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to get toggle event active' });
    }
}

async function getEventsForScenarioForMonth(req, res) {
    try {
        const {
            scenarioID,
            profileID,
            month,
            year
        } = req.query;

        const profile = await profileDAL.getProfileByID(profileID, req.user.id);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        let scenario = await dal.getScenarioByIDs(scenarioID, profileID, req.user.id);
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }

        const eventsForMonth = await analysisLogic.getScenarioEventsForMonth(scenarioID, profileID, month, year, req.user.id);
        res.json(eventsForMonth);
        return;

    } catch (error) {
        res.status(500).json({ error: 'Failed to get Events for the month' });
    }
}

async function calculateLoanDetails(req, res) {
    try {
        const {
            totalLoanAmount,
            additionalPrincipalPayment,
            interestRate,
            startDate,
            loanTerm
        } = req.body;

        // Validate input
        const validation = loanLogic.validateLoanData({
            totalLoanAmount,
            additionalPrincipalPayment,
            interestRate,
            startDate
        });

        if (!validation.isValid) {
            res.status(400).json({ error: 'Invalid loan data', details: validation.errors });
            return;
        }

        // Calculate loan details
        const loanDetails = loanLogic.calculateLoanDetails(
            totalLoanAmount,
            additionalPrincipalPayment,
            interestRate,
            startDate,
            loanTerm
        );

        if (!loanDetails) {
            res.status(400).json({ error: 'Unable to calculate loan details' });
            return;
        }

        res.json(loanDetails);
        return;

    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate loan details' });
    }
}

module.exports = {
    cloneScenario,
    createScenario,
    getAllScenariosForProfile,
    getScenarioByIDs,
    updateScenario,
    removeScenario,
    createEvent,
    updateEvent,
    removeEvent,
    getEventsForScenario,
    getSummaryForScenarioOnDate,
    toggleEventActive,
    getEventsForScenarioForMonth,
    calculateLoanDetails
}
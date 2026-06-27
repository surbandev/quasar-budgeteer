const _ = require('lodash');
const db = require('./db');

async function cloneScenario(scenarioID, profileID, name, description, userID) {
    const params = [
        scenarioID,
        profileID,
        name,
        description ?? ''
    ]
    let newScenario = await db.dbExecuteOne("CALL sp_scenarios_clone_scenario(?,?,?,?)", params, userID);
    return newScenario;
}


async function removeScenario(scenarioID, profileID, userID) {
    const scenario = await getScenarioByIDs(scenarioID, profileID, userID);
    if (!scenario) {
        return {
            error: "Scenario not found"
        }
    }
    const params = [
        scenarioID,
        profileID
    ]
    await db.dbExecuteOne('CALL sp_scenarios_remove_scenario(?,?)', params, userID);
    return {};
}

async function updateScenario(scenarioID, profileID, name, description, userID) {
    const params = [
        scenarioID,
        profileID,
        name,
        description ?? '',
    ]
    return db.dbExecuteOne("CALL sp_scenarios_update_scenario(?,?,?,?)", params, userID);
};


async function getScenarioByIDs(scenarioID, profileID, userID) {
    const sql = `SELECT * FROM scenarios WHERE id = ? AND profile_id = ?`;
    let scenario = await db.dbQueryOne(sql, [scenarioID, profileID], userID);
    return scenario;
}

async function getAllScenariosForProfile(profileID, userID) {
    const sql = `SELECT * FROM scenarios WHERE profile_id = ?`;
    return db.dbQuery(sql, [profileID], userID);
}

async function createScenario(profileID, name, description, is_default, userID) {
    const params = [
        profileID,
        name,
        description ?? '',
        is_default ?? 1
    ]
    let newScenario = await db.dbExecuteOne("CALL sp_scenarios_add_scenario(?,?,?,?)", params, userID );
    return newScenario;
}

async function createEvent(profileID, scenarioID, name, description, type, category, frequency, startDate, endDate, amount, active, principal, interest, calculatedEndDate, monthlyPayment, term, escrow, userID) {
    const params = [
        scenarioID,
        profileID,
        name,
        description ?? '',
        type,
        category,
        frequency,
        startDate,
        endDate,
        amount,
        active,
        principal ?? 0,
        interest ?? 0,
        calculatedEndDate ?? '',
        monthlyPayment ?? 0,
        term ?? 0,
        escrow ?? 0
    ]
    let newEvent = await db.dbExecuteOne("CALL sp_scenarios_add_event(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", params, userID);
    return newEvent;
}

async function removeEvent(scenarioID, profileID, eventID, userID) {
    const event = await getEventByIDs(scenarioID, profileID, eventID, userID);
    if (!event) {
        return {
            error: "Event not found"
        }
    }
    const params = [
        eventID,
        scenarioID,
        profileID
    ]
    await db.dbExecuteOne('CALL sp_scenarios_remove_event(?,?,?)', params, userID);
    return {};
}

async function updateEvent(eventID, scenarioID, profileID, name, description, type, category, frequency, startDate, endDate, amount, active, principal, interest, calculatedEndDate, monthlyPayment, term, escrow, userID) {
    const params = [
        eventID,
        scenarioID,
        profileID,
        name,
        description ?? '',
        type,
        category,
        frequency,
        startDate,
        endDate,
        amount,
        active,
        principal ?? 0,
        interest ?? 0,
        calculatedEndDate ?? '',
        monthlyPayment ?? 0,
        term ?? 0,
        escrow ?? 0
    ]
    return db.dbExecuteOne("CALL sp_scenarios_update_event(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", params, userID);
};

async function getEventByIDs(scenarioID, profileID, eventID, userID) {
    const sql = `SELECT * FROM scenario_events WHERE id = ? AND scenario_id = ? AND profile_id = ?`;
    return db.dbQueryOne(sql, [eventID, scenarioID, profileID], userID);
}

async function getEventsForScenario(scenarioID, profileID, userID) {
    const scenario = await getScenarioByIDs(scenarioID, profileID, userID);
    if (!scenario) {
        return {
            error: "Scenario not found"
        }
    }
    const params = [
        scenarioID,
        profileID
    ]
    return db.dbQuery('SELECT * FROM scenario_events WHERE scenario_id = ? AND profile_id = ?', params, userID);
}

async function getEventsForScenarioByDate(scenarioID, profileID, date, userID) {
    return db.dbQuery(`
            SELECT * FROM scenario_events
            WHERE scenario_id = ?
            AND profile_id = ?
            AND active = 1
            AND start_date <= ?
            AND (end_date IS NULL OR end_date >= ?)
          `, [scenarioID, profileID, date, date], userID);
}

async function toggleEventActive(scenarioID, profileID, eventID, userID) {
    return db.dbExecuteOne('CALL sp_scenarios_toggle_event_active(?,?,?)', [eventID, profileID, scenarioID], userID);
}

async function getScenarioEvents(scenarioID, profileID, userID) {
    return db.dbQuery(`
        SELECT * FROM scenario_events 
        WHERE active = 1 
        AND scenario_id = ?
        AND profile_id = ?`,
        [scenarioID, profileID], userID
    );
}


module.exports = {
    cloneScenario,
    createScenario,
    removeScenario,
    updateScenario,
    getScenarioByIDs,
    getAllScenariosForProfile,
    createEvent,
    updateEvent,
    removeEvent,
    getEventByIDs,
    getEventsForScenario,
    getEventsForScenarioByDate,
    toggleEventActive,
    getScenarioEvents
}
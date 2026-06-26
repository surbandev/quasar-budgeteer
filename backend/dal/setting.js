const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const common = require('../logic/common');

async function setUserSetting(userID, setting, value) {
    let result = await db.dbExecuteOne("CALL sp_settings_set_setting(?,?,?)",[userID, _.toUpper(setting), value],userID);
    return result;
}

async function deleteUserSetting(userID, setting) {
    let result = await db.dbExecuteOne("CALL sp_settings_delete_setting(?,?)",[userID, _.toUpper(setting)],userID);
    return result;
}

async function getUserSetting(userID, setting){
    let result = await db.dbQueryOne("SELECT value FROM settings WHERE user_id = ? AND setting = ?",[userID, _.toUpper(setting)],userID);
    return result;
}

module.exports = {
    setUserSetting,
    deleteUserSetting,
    getUserSetting
}
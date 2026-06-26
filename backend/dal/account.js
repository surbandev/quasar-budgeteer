const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const common = require('../logic/common');

async function addAccount(userID, firstName, lastName, phone, email) {
    const newDBID = uuidv4();
    const newDBUsername = common.randomString(20);
    const newDBPassword = common.randomString(50);

    await db.dbExecute("CREATE DATABASE `"+newDBID+"`;");
    await db.dbExecute("CALL sp_databases_add_database(?,?,?,?);", [newDBID, newDBUsername, newDBPassword, userID]);
    await db.dbExecute("CALL sp_users_set_database(?,?)",[userID, newDBID]);

    let dbSetupScripts = await db.dbQuery("SELECT cmd FROM database_setup_scripts ORDER BY id ASC",[]);
    for(let script of dbSetupScripts){
        await db.dbExecute(script.cmd, [], userID);
    }

    await db.dbExecuteOne("CALL sp_profiles_add_default_profile(?,?,?,?,?)",[userID, firstName, lastName, phone, email],userID)

    return newDBID;
}

module.exports = {
    addAccount
}
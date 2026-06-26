const _ = require('lodash');
const db = require('./db');

async function addNewProfile(firstName, lastName, phone, email, userID){
    let profilePhone = await getProfileByPhone(phone, userID);
    let profileEmail = await getProfileByEmail(email, userID);
    if (profilePhone || profileEmail){
        return {
            error: "Profile already exists"
        };
    }
    profile = await db.dbExecuteOne("CALL sp_profiles_add_profile(?, ?, ?, ?)", [firstName, lastName, phone, email], userID);
    return {
        profile
    };
}

async function removeProfile(profileID, userID){
    let profile = await getProfileByID(profileID, userID);
    if (!profile){
        return {
            error: "Profile not found"
        };
    }
    await db.dbExecute("CALL sp_profiles_remove_profile(?)", [profileID], userID);
    return {};
}

async function updateProfile(profileID, firstName, lastName, phone, email, userID){
    let profile = await getProfileByID(profileID, userID);
    if (!profile){
        return {
            error: "Profile not found"
        };
    }
    profile = await db.dbExecuteOne("CALL sp_profiles_update_profile(?, ?, ?, ?, ?)", [profileID, firstName, lastName, phone, email], userID);
    return {
        profile
    };
}

async function getProfileByPhone(phone, userID){
    return db.dbQueryOne("SELECT * FROM profiles WHERE phone = ?",[phone], userID);
}

async function getProfileByEmail(email, userID){
    return db.dbQueryOne("SELECT * FROM profiles WHERE email = ?",[email], userID);
}

async function getProfileByID(profileID, userID){
    return db.dbQueryOne("SELECT * FROM profiles WHERE id = ?",[profileID], userID);
}

async function getAllProfiles(userID){
    return db.dbQuery("SELECT * FROM profiles",[], userID);
}


module.exports = {
    addNewProfile,
    removeProfile,
    updateProfile,
    getProfileByPhone,
    getProfileByEmail,
    getProfileByID,
    getAllProfiles
}
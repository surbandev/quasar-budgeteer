const db = require('./db');

async function submitFeedback(userID, type, message) {
    try{
        let result = await db.dbExecuteOne("CALL sp_feedback_submit_feedback(?,?,?)",[userID, type, message]);
        return result;
    }catch(e){
        return null;
    }
}

async function listFeedback() {
    const rows = await db.dbQuery("SELECT * FROM feedback");
    return rows || [];
}

module.exports = {
    submitFeedback,
    listFeedback
}
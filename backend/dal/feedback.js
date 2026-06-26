const db = require('./db');

async function submitFeedback(userID, type, message) {
    try{
        let result = await db.dbExecuteOne("CALL sp_feedback_submit_feedback(?,?,?)",[userID, type, message]);
        return result;
    }catch(e){
        return null;
    }
}

module.exports = {
    submitFeedback
}
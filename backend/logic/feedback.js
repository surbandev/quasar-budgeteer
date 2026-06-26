const dal = require('../dal/feedback');
const _ = require('lodash');

async function submitFeedback(req, res) {
    try {
        let type = _.get(req,'body.type');
        let msg = _.get(req,'body.message');
        let result = await dal.submitFeedback(req.user.id, type, msg);
        if (result.error){
            res.statusMessage = result.error;
            res.status(409).send().end();
            return;
        }
        res.status(200).send().end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
}

module.exports = {
    submitFeedback
}
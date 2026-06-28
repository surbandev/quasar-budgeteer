const dal = require('../dal/feedback');
const userDal = require('../dal/user');
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

const DATE_KEYS = ['created_at', 'created', 'createdAt', 'timestamp', 'date', 'submitted_at'];
const USER_KEYS = ['user_id', 'userid', 'userId', 'userID'];

function getRowDate(row) {
    for (const key of DATE_KEYS) {
        if (row[key]) return row[key];
    }
    return null;
}

function getRowUserId(row) {
    for (const key of USER_KEYS) {
        if (row[key] != null) return row[key];
    }
    return null;
}

// Admin only: returns all feedback, newest first, with the submitting user's
// display name/username resolved from the master users table.
async function listFeedback(req, res) {
    try {
        const [rows, users] = await Promise.all([dal.listFeedback(), userDal.getAllUsers()]);

        const usersById = new Map();
        for (const u of users || []) {
            usersById.set(String(u.id), u);
        }

        const feedback = (rows || [])
            .map((row) => {
                const userId = getRowUserId(row);
                const user = userId != null ? usersById.get(String(userId)) : null;
                const fullName = user
                    ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
                    : '';
                return {
                    ...row,
                    submittedAt: getRowDate(row),
                    username: user ? user.username : null,
                    displayName: fullName || (user ? user.username : null),
                };
            })
            .sort((a, b) => {
                const da = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                const db_ = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                return db_ - da;
            });

        res.json({ feedback });
    } catch (error) {
        console.error('Error listing feedback:', error);
        res.status(500).json({ error: 'Failed to load feedback' });
    }
}

module.exports = {
    submitFeedback,
    listFeedback
}
const _ = require('lodash');

const dal = require('../dal/user');
const { createFullUser } = require('./provisionUser');
const { sendAccessRequestEmail } = require('./accountEmails');
const logger = require('./logger');

// If add here, add to dal
async function login(req, res) {
    try {
        const { username, password } = req.body;
        let loginObject = await dal.login(username, password);
        let token = loginObject.token;
        let error = loginObject.error;
        let userID = loginObject.userID;
        if (error) {
            res.statusMessage = error;
            res.status(401).send(error).end();
            return;
        }
        res.json({ token, userID });
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

async function getUser(req, res) {
    try {
        const userID = req.query.userID || req.body?.userID;
        let userObject = await dal.getUser(userID);
        let user = userObject.user;
        let error = userObject.error;
        if (error) {
            res.statusMessage = error;
            res.status(404).send(error).end();
            return;
        }
        if (user?.password) {
            delete user.password;
        }
        res.json({ user });
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

async function addUser(req, res) {
    try {
        const { username, password, firstname, lastname, phone, email } = req.body;
        const result = await createFullUser({
            username,
            password,
            firstname,
            lastname,
            phone,
            email,
        });

        let error = _.get(result, 'error');
        if (!error) {
            res.status(200).send().end();
            return;
        }

        res.statusMessage = error;
        res.status(String(error).includes('already exists') ? 409 : 400).json({ error });
    } catch (e) {
        console.error('Error in addUser:', e);
        res.status(500).json({ error: e.sqlMessage || e.message || 'Internal Server Error' });
    }
}

async function register(req, res) {
    res.status(403).send().end();
}

// Public: a prospective user submits the registration form. We do NOT create an
// account here; we email the administrator the submitted details for approval.
async function requestAccess(req, res) {
    try {
        const firstname = _.trim(_.get(req, 'body.firstname', ''));
        const lastname = _.trim(_.get(req, 'body.lastname', ''));
        const username = _.toLower(_.trim(_.get(req, 'body.username', '')));
        const email = _.trim(_.get(req, 'body.email', ''));
        const phone = _.trim(_.get(req, 'body.phone', ''));
        const password = _.get(req, 'body.password', '');
        const plan = _.trim(_.get(req, 'body.plan', ''));

        if (!firstname || !lastname || !username || !email || !password) {
            res.status(400).json({ error: 'Please fill in all required fields.' });
            return;
        }

        // Log the request (without the plaintext password) so it shows in the admin Logs.
        logger.logAccountRequest(`New account request: ${username} (${email})`, {
            firstname,
            lastname,
            username,
            email,
            phone,
            plan,
        });

        // Respond immediately — email is best-effort and must not block the user.
        // (Railway Hobby blocks SMTP; even with timeouts, we don't want registration
        // to hang or fail because email delivery failed.)
        res.status(200).json({ submitted: true });

        sendAccessRequestEmail({
            firstname,
            lastname,
            username,
            email,
            phone,
            password,
            plan,
        }).catch((mailErr) => {
            console.error('Background access-request email failed:', mailErr);
        });
        return;
    } catch (e) {
        console.error('Error in requestAccess:', e);
        logger.logError('requestAccess failed', e.message || String(e));
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function updateUser(req, res) {
    try {
        const { userID, username, password, email} = req.body;
        const result = await dal.updateUser(userID, username, email, password);
        let error = _.get(result,'error');
        let user = _.get(result,'user');
        if (!error){
            res.json(user);
            return;
        }else{
            res.statusMessage = error;
            res.status(404).send().end();
            return;
        }
    } catch (e) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send().end();
    }
}

module.exports = {
    login,
    addUser,
    register,
    requestAccess,
    getUser,
    updateUser
}
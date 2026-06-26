const _ = require('lodash');
const dal = require('../dal/profile');

async function addNewProfile(req, res) {
    try {
        const firstName = req.body.first_name;
        const lastName = req.body.last_name;
        const phone = req.body.phone;
        const email = req.body.email;
        const newProfileObject = await dal.addNewProfile(firstName, lastName, phone, email, req.user.id);
        const newProfile = newProfileObject.profile;
        const error = newProfileObject.error;
        if (error){
            res.statusMessage = error;
            res.status(409).send().end();
            return;
        }
        res.json(newProfile);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to add new Profile' });
    }
}

async function removeProfile(req, res) {
    try {
        const profileID = req.body.profileID;
        let profile = await dal.getProfileByID(profileID, req.user.id);
        if (!profile){
            res.statusMessage = "Profile not found";
            res.status(404).send().end();
            return;
        }
        let result = await dal.removeProfile(profileID, req.user.id);
        if (result.error){
            res.statusMessage = result.error;
            res.status(409).send().end();
            return;
        }
        res.status(200).send().end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove Profile' });
    }
}

async function updateProfile(req, res) {
    try {
        const {
            profileID = req.body.id,
            firstName = req.body.first_name,
            lastName = req.body.last_name,
            phone = req.body.phone,
            email = req.body.email
        } = req.body;

        let profile = await dal.getProfileByID(profileID, req.user.id);
        if (!profile){
            res.statusMessage = "Profile not found";
            res.status(404).send().end();
            return;
        }

        let profileObject = await dal.updateProfile(profileID, firstName, lastName, phone, email, req.user.id);
        
        if (profileObject.error){
            res.statusMessage = error;
            res.status(409).send().end();
            return;
        }

        res.json(profileObject.profile);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Profile' });
    }
}

async function getProfileByID(req, res) {
    try {
        const profile = await dal.getProfileByID(req.body.profileID, req.user.id);
        res.json(profile);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Profile' });
    }
}

async function getProfileByPhone(req, res) {
    try {
        const profile = await dal.getProfileByPhone(req.body.phone, req.user.id);
        res.json(profile);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Profile' });
    }
}

async function getProfileByEmail(req, res) {
    try {
        const profile = await dal.getProfileByEmail(req.body.email, req.user.id);
        res.json(profile);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Profile' });
    }
}

async function getAllProfiles(req, res) {
    try {
        const profiles = await dal.getAllProfiles(req.user.id);
        res.json(profiles);
        return;
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Profile' });
    }
}

module.exports = {
    addNewProfile,
    removeProfile,
    updateProfile,
    getProfileByID,
    getProfileByPhone,
    getProfileByEmail,
    getAllProfiles
}
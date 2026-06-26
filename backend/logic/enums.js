const _ = require('lodash');
const dal = require('../dal/enums');

async function getTransactionTypes(req, res) {
    try {
        const transactionTypes = await dal.getTransactionTypes();
        res.json(transactionTypes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transaction_types' });
    }
}
async function getFrequencyTypes(req, res) {
    try {
        const frequencyTypes = await dal.getFrequencyTypes();
        res.json(frequencyTypes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch frequency_types' });
    }
}

module.exports = {
    getTransactionTypes,
    getFrequencyTypes
}
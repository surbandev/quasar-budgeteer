const _ = require('lodash');

module.exports = {
    tweakRquest: ((req, res, next) => {
        let query = _.get(req,'query',{});
        let body = _.get(req,'body',{});
        let newBody = {...query, ...body};
        _.set(req, 'body', newBody);
        next();
    }),
}
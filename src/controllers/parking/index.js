const query = require('./query.controller');
const assignment = require('./assignment.controller');
const payment = require('./payment.controller');
const simulation = require('./simulation.controller');
const admin = require('./admin.controller');

module.exports = {
    ...query,
    ...assignment,
    ...payment,
    ...simulation,
    ...admin
};

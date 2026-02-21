const query = require('./query.controller');
const assignment = require('./assignment.controller');
const payment = require('./payment.controller');
const simulation = require('./simulation.controller');
const solvency = require('./solvency.controller');

module.exports = {
    ...query,
    ...assignment,
    ...payment,
    ...simulation,
    ...solvency
};

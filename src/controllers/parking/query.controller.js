const lotsController = require('./query/lots.controller');
const historyController = require('./query/history.controller');
const predictionController = require('./query/prediction.controller');

module.exports = {
    ...lotsController,
    ...historyController,
    ...predictionController
};

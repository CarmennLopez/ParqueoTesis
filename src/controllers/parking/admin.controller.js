const lotsController = require('./admin/lots.controller');
const usersController = require('./admin/users.controller');
const statsController = require('./admin/stats.controller');

module.exports = {
    ...lotsController,
    ...usersController,
    ...statsController
};

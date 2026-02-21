const register = require('./register.controller');
const login = require('./login.controller');
const token = require('./token.controller');
const profile = require('./profile.controller');

module.exports = {
    ...register,
    ...login,
    ...token,
    ...profile
};

const passport = require('passport');
 require("dotenv").config()

require("dotenv").config();
const { Strategy, ExtractJwt } = require('passport-jwt');
const User = require('../model/User');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.secrate_jwt,
};

passport.use(
  new Strategy(opts, async (jwt_payload, done) => {
    try {
      const user = await User.findOne({
        _id: jwt_payload.id,   
        status: "active",      
        isDeleted: false,
      });

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

const authenticateJWT = passport.authenticate('jwt', { session: false });

module.exports = { authenticateJWT };
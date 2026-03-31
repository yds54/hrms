require("dotenv").config();
const passport = require("passport");

const { Strategy, ExtractJwt } = require("passport-jwt");
const { USER, AUTH} = require("../model/modelIndex");
const { USER_STATUS } = require("../utils/enum");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.secrate_jwt,
  passReqToCallback: true,
};

passport.use(
  new Strategy(opts, async (req, jwt_payload, done) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      const session = await AUTH.findOne({
        token,
        isDeleted: false,
      });

      if (!session) {
        return done(null, false);
      }

      const user = await USER.findOne({
        _id: jwt_payload.id,
        status: USER_STATUS.ACTIVE,
        isDeleted: false,
      });

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }),
);

const authenticateJWT = passport.authenticate("jwt", { session: false });

module.exports = { authenticateJWT };

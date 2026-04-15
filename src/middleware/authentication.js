require("dotenv").config();
const passport = require("passport");

const { Strategy, ExtractJwt } = require("passport-jwt");
const { USER, AUTH } = require("../model/modelIndex");
const { USER_STATUS } = require("../utils/enum");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.secrate_jwt,
  passReqToCallback: true,
  ignoreExpiration: true,
};

passport.use(
  new Strategy(opts, async (req, jwt_payload, done) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      const currentTime = Math.floor(Date.now() / 1000);
      if (jwt_payload.exp < currentTime) {
        await AUTH.updateOne({ token }, { isDeleted: true });
        return done(null, false);
      }

      const session = await AUTH.findOne({
        token,
        isDeleted: false,
        expiresAt: { $gt: new Date() },
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

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    return authenticateJWT(req, res, next);
  }

  next();
};

module.exports = { authenticateJWT, optionalAuth };

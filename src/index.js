const cookieParser = require('cookie-parser');
// used to store and parse jwt token in cookies
const jwt = require('jsonwebtoken')
// bring in the jwt library for auth
require('dotenv').config({ path: 'variables.env' })
// sets up the environment variables for the db
const createServer = require('./createServer');
// imports our server we created.
const db = require('./db')
// imports the db we configured.


const server = createServer();
// stores the function createServer to a new variable.


// parse thru cookie for JWT.
server.express.use(cookieParser());
// converts cookies to a formatted object rather than a raw string as it is available in a browser.

// decode JWT to access userId on each request
server.express.use((req, res, next) => {
  // pull token out of request:
  const { token } = req.cookies;
  console.log(token);

  if (token) {

    // sending the appsecret along while decoding the token, this ensures no one can tamper with their cookies.
    const { userId } = jwt.verify(token, process.env.APP_SECRET);

    //put the userId ontot the req for future requests to access.
    req.userId = userId;
  }

  next();
  // passes the request down the line allowing each page render to access the response.
});


// Middleware to populate the user on each request when logged in:
server.express.use(async (req, res, next) => {
  // exit if user is not logged in.
  if (!req.userId) return next();
  // find the user where the id matches.
  const user = await db.query.user({
    where: { id: req.userId }
    // return the following info about the user:
  }, '{id, permissions, email name}');
  // console.log(user);

  // put the user onto the request to pass it along:
  req.user = user;
  next();
})

server.start(
  {
    cors: {
      // limits server requests to only originate from the same domain & require credentials
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    // logs server details to a clickable link in terminal when server boots up.
    console.log(`Server is now running on port http://localhost:${deets.port}`)
  }
)

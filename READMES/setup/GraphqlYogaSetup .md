## Setup Graphql Yoga

Graphql yoga is an express server that connects to and handles data from our prisma database for us. It acts as the interaction layer between our app and our database.  Yoga makes the setup and configuration of all the tools needed to run our database and query from our database a simple process, as opposed to configuring everything manually. 

create new file in backend: `db.js` & import prisma:

```js
const {Prisma} = require('prisma-binding')
```

next define a new database - this utilizes the `prisma.graphl` generated file we have from the prisma installation. 

```js
const db = new Prisma({
  typeDefs: 'src/generated/primsa.graphql',
})
```

> this associates all of the queries, mutations, and types defined in the generated `prisma.graphql` file

Next we can also define our `.env` variables that we need to pass in as well here:

```js
const db = new Prisma({
  typeDefs: 'src/generated/primsa.graphql',
  endpoint: process.env.PRISMA_ENDPOINT,
  debug: false,
})
```

> when debug is set to: `true`, it will log all queries and mutations to console. must be false in production.



Finally we'll need to export our newly defined DB:

```js
module.exports = db;
```





Let's create another file: `src/createServer.js` & import `GraphQLServer`

```js
const {GraphQLServer} = require('graphql-yoga')
```



Next we'll define our resolvers:

```js
const Mutation = require('./resolvers/Mutations')
const Query = require('./resolvers/Query')
```



>  there are two kinds of resolvers:
>
> - <u>query resolvers</u>: help us query our data from the database
> - <u>mutation resolvers:</u> which help us add data to our database. 
>
> every exposed endpoitn that users can query will have a resolver that handles that actions available for that endpoint. 



Before we create our server, we must reference a file called: `schema.graphql`, which we'll go ahead and create now. This file will eventaully contain all of our queries and resolvers. 



Now we can go ahead and define as well as create our server:

```js
function createServer() {

}

module.exports = createServer;
```



Inside this function that creates our graphql server, we can configure our options:

```js
function createServer() {
  return new GraphQLServer({
    typeDefs: 'src/schema.graphql',
    // assigns the type definitions generated from prisma setup
    resolvers: {
      //defining any resolvers.
      Mutataion,
      Query
    },
    resolverValidationOptions: {
      // handles error handling edge case issues.
      requireResolversForResolveType: false
    },
    context: re => ({ ...req, db }),
    // allows us to access the database from the resolvers.
  })
}
```





Now we can go ahead and configure our backend's `index.js`:

first thing we'll do is make sure our `.env` variables are available to our application: 

```js
require('dotenv').config({ path: 'variables.env' })
// sets up the environment variables for the db
```

> requiring the `variables.env` file in the entry point of our server: `index.js`



Next we'll require the `server` & `db`

```js
const createServer = require('./createServer');
// imports our server we created.
const db = require('./db')
// imports the db we configured.
```



Next we can setup our new server using `createServer`:

```js
const server = createServer();
// stores the function createServer to a new variable.
```



Then let's configure the server:

```js
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
    console.log('Server is now running on port http://localhost:${deets.port}')
  }
)
```





Finally in order to run our server

We'll want to define a dummy `resolver` & `query` graphql won't boot up if it does not find any queries or resolvers defined. 

```js
type Mutation {
  hi: String
}

type Query {
  hi: String
}
```



So now we should be able to run our server by running: 

```shell
yarn dev
```


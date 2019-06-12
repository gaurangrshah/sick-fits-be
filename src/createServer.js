const { GraphQLServer } = require('graphql-yoga');

const Mutation = require('./resolvers/Mutation')
const Query = require('./resolvers/Query')
const db = require('./db');

//Create graphQL Yoga Server:

function createServer() {
  return new GraphQLServer({
    typeDefs: 'src/schema.graphql',
    // assigns the type definitions generated from prisma setup
    resolvers: {
      //defining any resolvers to matchup to our schema defined above
      Mutation,
      Query,
    },
    resolverValidationOptions: {
      // handles error handling edge case issues.
      requireResolversForResolveType: false
    },
    context: req => ({ ...req, db }),
    // exposes the database from the resolvers to requests.
  })
}

module.exports = createServer;

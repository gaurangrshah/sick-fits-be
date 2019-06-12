// this file connects to the remove prisma db and allows us to query using javascript.

const { Prisma } = require('prisma-binding');

const db = new Prisma({
  typeDefs: 'src/generated/prisma.graphql',
  endpoint: process.env.PRISMA_ENDPOINT,
  debug: false,
  // when true, will log all queries and mutations to console. must be false in production.
})

module.exports = db;

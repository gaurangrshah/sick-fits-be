/*
const stripe = require('stripe');
const config = stripe(process.env.STRIPE_SECRET);
module.exports = config;
*/

module.exports = require('stripe')(process.env.STRIPE_SECRET);
// requires stripe node module and passes in the secret key



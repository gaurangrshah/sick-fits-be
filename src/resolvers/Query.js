const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current userId
    if (!ctx.request.userId) {
      // check the request off context for userId
      return null
      // if no id then return null
    }
    return ctx.db.query.user({
      where: { id: ctx.request.userId },
      // targeting user where the userId matches ctx.request.userId
    }, info) // passes in info as the 2nd arg.
    // allows us to dissect what fields we need from the user when we need them.
  },

  async users(parent, args, ctx, info) {
    // 1. check if the user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in');
    }
    // 2. Check if the user has the permissions to query all the users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])
    // checks to see user has admin permission and permissionupdate

    // 3. query all users?
    return ctx.db.query.users({}, info)
    // note the first arg, `where` gets provided an empty object.
    // once again the 2nd arg, `info` contains the fields from the query that we are requesting.
  },
  async order(parent, args, ctx, info) {
    //1. Make sure user is logged in
    if (!ctx.request.userId) throw new Error('Please log in');

    //2. Query the current order.
    const order = await ctx.db.query.order({
      where: { id: args.id },
    }, info)
    //3. Check if they have the permissiones to see this order.
    // does user own this order?
    const ownsOrder = order.user.id === ctx.request.userId;
    // does user have permission to view this order?
    const hasPermissionsToSeeOrder = ctx.request.user.permissions.includes('ADMIN');

    if (!ownsOrder || !hasPermissionsToSeeOrder) {
      throw new Error(`Sorry, You cant view this, because this is your order ${ownsOrder}||and your permission ${hasPermissionsToSeeOrder})`)
    }

    //4. Return the order.
    return order
  },
  async orders(parent, args, ctx, info) {
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('you must be signed in!');
    }
    return ctx.db.query.orders(
      {
        where: {
          user: { id: userId },
        },
      }, info);
  },
};
module.exports = Query;

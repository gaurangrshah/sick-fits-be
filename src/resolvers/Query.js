const { forwardTo } = require('prisma-binding');

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
};
module.exports = Query;

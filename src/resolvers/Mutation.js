const bcrypt = require('bcryptjs');
//used for pw hashing
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
// used to secure the resetToken available by default via Node.
const { promisify } = require('util');
//used to turn callbacks fns into promises-  available by default via Node.
const { transport, makeANiceEmail } = require('../mail');
// used to capture emails sent from the server
const { hasPermission } = require('../utils');


const Mutations = {

  async createItem(parent, args, ctx, info) {
    // TODO: check if user is logged in. -- will update when users are added.

    const item = await ctx.db.mutation.createItem({
      data: {
        // This is how to create a relationship between the Item and the User
        user: {
          connect: {
            id: ctx.request.userId,
          },
        },
        ...args,
      },
    }, info)
    // passing info along as the 2nd argument, allows our query to be handled from our frontend
    // and be passed back to the backend.
    console.log('created:', item);
    return item;
  },

  updateItem(parent, args, ctx, info) {
    // create copy of any updates:
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    //because we are not updating the id itself, just the other data that goes along with that particular id.
    return ctx.db.mutation.updateItem({
      // tack on the updates variable which we created from the copy of ...args
      data: updates,
      where: {
        // referencing the id of the item we want to update.
        id: args.id
      },
    }, info); // passed in info as the 2nd arg to udpateitem -- allows us to specify what gets returned --  down the line.
    // ctx - is the context we get back from the request, db is the reference to our prisma db.
    // then we specify that we are dealing with a mutation, and not a query, and then referencing the particular query of updateItem --
  },

  async deleteItem(parent, args, ctx, info) {
    // defining the where variable, referencing it to args.id (the id that gets passed in as an arg)
    const where = { id: args.id };

    //1. find the item
    const item = await ctx.db.query.item({ where }, `{ id title user { id }}`);
    // passing in the where variable and  raw graphql template that defines what we want returned to maKe sure we get atleast the id / title back o fthe removed item. -- sometimes there can be issues, so we are making sure to be explicit.

    //2. TODO: check privileges (make sure person is allowed to delete this item)
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    ); // some() checks to see if at least one of the items in the array

    if (!ownsItem && !hasPermissions) {
      throw new Error("You don't have permission to do that!");
    }

    //3. delete item.
    return ctx.db.mutation.deleteItem({ where }, info);
    // once again passing in info as the 2nd arg to this mutation as well.

  },

  async signup(parent, args, ctx, info) {
    // ensure emails get saved as lowercase string.
    args.email = args.email.toLowerCase();

    // hash pw
    const password = await bcrypt.hash(args.password, 10)
    // bcrypt.hash takes to parameters 1: the users password, and 2. either a "SALT" or the length of a salt, in our case we've used the length option, passing in a length of 10. -- Salting passowrds ensures their uniqueness.

    // Create user in DB:  --  'createUser' see generated prisma.graphql
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,  // spreads out args
        password, // updates user with new pw, or sets new pw.
        permissions: { set: ['USER'] } // set default USER permission
      },
    }, info)    // info passed as 2nd arg.

    // Create JWT token.
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // jwt.sign takes in the userID and the secret defined in the '.env'

    // store JWT as response on cookie:
    ctx.response.cookie('token', token, {
      httpOnly: true, // ensures cookie cannot be accessed by javascript
      maxAge: 1000 * 60 * 60 * 24 * 365, // max expiry 1 year.
    })


    // return user to the browser:
    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    // 1. Check if user is registered (ie, does email exist in db)
    const user = await ctx.db.query.user({ where: { email } });
    // passed in the destructured email from {args} in the params.

    if (!user) {
      // if user does not exist throw error:
      throw new Error(`No such user found for email ${email}`);
    } // this error can be displayed to the user if needed on the front end. that is why we are handling it here.

    // 2. Validate password
    const valid = await bcrypt.compare(password, user.password);
    // takes entered password -> hashes it -> compares to hash on file from signup.

    if (!valid) {
      throw new Error('Invalid Password!');
    }

    // 3. generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // signs the auth token for he user.id with our APP_SECRET attached.

    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      // takes cookie from response, and sets token onto it.
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. return the user
    return user;
  },

  signout(parent, args, ctx, info) {
    // handle logout by clearing cookies
    ctx.response.clearCookie('token');
    // clearCookie is a method available via 'cookie-parser'

    // return logout message (not displayed, but can be...)
    return { message: 'Goodbye' }
  },

  async requestReset(parent, args, ctx, info) {
    // 1. Verify email (see if email is registered)
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }

    // MY ORIGINAL:
    const randomBytesPromiseified = promisify(randomBytes);
    const resetToken = (await randomBytesPromiseified(20)).toString('hex');
    // call randomBytes, pass in a length(20), which returns a "buffer" which we then covert to a string via .toString(hex) -- promisify just takes the callback that we get from random bytes and returns an async promise instead.

    // 2a. Set an expiry on the token:
    const resetTokenExpiry = Date.now() * 3600000; // 1 hour from now

    // 2b. handle response & save our custom resetToken & exipry variables to the user:
    const res = await ctx.db.mutation.updateUser({
      // adding the newly created token and expiry to the user via their email:
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    // console.log(res); // ❌ security issue should never log this in production

    // 3. Email the user the token
    const mailRes = await transport.sendMail({
      // sendMail takes in the details of our email:
      from: 'gshah@gshahdev.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: makeANiceEmail(`Your password reset token is here! \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`)
      // NOTE: we could add a try catch to the above mailres function for error handling.

    });

    // 4 return message
    return { message: 'Thanks!' };
  },

  async resetPassword(parent, args, ctx, info) {
    // 1. check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Yo Passwords don't match!");
    }
    // 2. check if its a legit reset token
    // 3. Check if its expired
    const [user] = await ctx.db.query.users({
      // `users` query returns an array from which we destructure the first item as `[user]`
      where: {
        // `users` query also allows us to provide more robust input for the `where` arg:
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error('This token is either invalid or expired!');
    }
    // 4. Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email }, // we chould use the email or the resetToken here.
      data: {
        password,
        resetToken: null, // clear resetToken
        resetTokenExpiry: null, // clear resetTokenExpiry
      },
    });
    // 6. Generate JWT for the updated user:
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 8. return the new user
    return updatedUser;
  },

  async updatePermissions(parent, args, ctx, info) {
    // 1. Is user logged in?
    if (!ctx.request.userId) {
      throw new Error('You Must Be Logged In');
    }
    // 2. Query current user
    const currentUser = await ctx.db.query.user({
      where: {
        id: ctx.request.userId
      },
    }, info)
    // 3. Check user's permissions
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // 4. Update Permissions
    console.log(`updateuser: ${args.userId}`)
    return ctx.db.mutation.updateUser({
      // using the prisma generated updateUser mutation here:
      data: {
        // data to be updated:
        permissions: {
          set: args.permissions
        }, // setting permissions - because enum must use "set:" syntax
      },
      where: {
        id: args.userId
      }, // which item to udpate with data.
    }, info);

  },

  async addToCart(parent, args, ctx, info) {
    // 1. Check if user is signed in.
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in');
    }
    // 2. Query the users current cart
    // we're running a query for multiple items because, we need to query user & item ids
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },   // provides the usersId to the query
        item: { id: args.id },  // provides the item's Id to the query.
        // both ids must match, meaning the user has this item in their cart already.
      },
    })
    // 3a. if item already exists in cart increment by 1
    if (existingCartItem) {
      console.log('This item is already in the cart');
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id }, // match items by existing cart item id
        data: { quantity: existingCartItem.quantity + 1 } // when found increment by 1
      }, info)
    }
    // 3b. if this item does not exist, create a new one with the value of 1
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId }, // establishes the relationship
        },
        item: {
          connect: { id: args.id }, // establishes the relationship
        },
      },
    }, info);

  },
};

module.exports = Mutations;

## User Signup and Permission Flow

Our goal in this portion is to build out our user portion of the database as well as creating the permision flow that keeps track of which users have what permissions. We'll be starting in the ==backend==

open `datamodel.prisma` & let's extend our User type's, fieldset:

```sql
enum Permission {
  # enums help provide a preset list of possible options for a given type.
  ADMIN
  USER
  ITEMCREATE
  ITEMUPDATE
  ITEMDELETE
  PERMISSIONUPDATE
  # list of possible permissions available to type: User, as defined below.
}
```



Anytime we make changes to the datamodel we must redeploy to prisma for the changes to take effect and for prisma to update our generated `primsa.graphql` file.

```shell
yarn deploy
```

> we're presented with an error that says we have some users without passwords in our database already, we'll login to prisma console to remove any users currently in the database:
>
> ```shell
> prisma console
> ```
>
> ![image-20190610212443616](http://ww2.sinaimg.cn/large/006tNc79ly1g3wyhhc6smj30w607g751.jpg)

Once we remove any users in the DB we can run deploy again: 

```shell
yarn deploy
```



We were also prompted to change our specified type for the Permission field:

```react
  permissions: [Permission] @scalarList(strategy: RELATION)
```

> solved from: https://github.com/prisma/prisma/issues/4426#issuecomment-487389870





Once that's doing we can define our new schema mutation for signup: 

==backend== `src/schema.graphql`

```react
signup(email: String!, password: String!, name: String!): User!
```

> New signups requre a name, email & password and returns a `User`



> **NOTE**: we'll be using JWT access tokens to validate logged in users. Once logged in we'll save the loggedIn data to a cookie and that cookie will ensure that the users permissions are always loaded on each page load when they are logged in. 
>
> There are other methods of achieving this like storing the JWT in local storage, but that method involves a bit more work in order to send the auth token along on each page load. And can cause some Paint glitches if the server doesn't first recognize that the user is logged in, it may render the logged out view till it is able to see the token stored in local storage. 

We'll have to make some modifications to ==backend== `src/index.js` to handle our jwt token:

first step is to import `cookie-parser` to allow us to access and store our token in the user's cookies:

```react
const cookieParser = require('cookie-parser');
// used to store and parse jwt token in cookies
```



Next we can finish the first of the two `todo` tags we left in this file:

```react
//TODO use express mdidleware to handle cookies (JWT)
server.express.use(cookieParser());
// converts cookies to a formatted object rather than a raw string as it is available in a browser.
```

> middleware is a function that will run in the middle of the request and the response.  Middleware can be used to handle any functionality that needs to be handled in between when the request is recieved and when the content from the request is served to the user. This includes things like: authorization, transforming content, translating locally, etc. 
>
> In our case, we are going to be accepting the request, then parsing any cookies that came along with the request so that we can parse the JWT and ensure the user is authenticated. 



next we have to setup the resovler for the signup mutation:

==backend== `src/resolvers/Mutation.js`

We'll need a package called `b-crypt` which helps us hash user's passwords so we can securely save to DB. 

```react
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')'
```

> also imported the `jsonwebtoken` package

Now we can get to the actual resolver itself:

```react
  async signup(parent, args, ctx, info) {
    // ensure emails get saved as lowercase string.
    args.email = args.email.toLowerCase()

    // hash pw
    args.password = await bcrypt.hash(args.password, 10)

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

    // return user to the browser once signed in and cookie stored.
    return user;
  },
```

> `bcrypt.hash()` takes to parameters 1: the users password, and 2. either a "SALT" or the length of a salt, in our case we've used the length option, passing in a length of 10. -- Salting passowrds ensures their uniqueness.



Once this is set we can take a look at http://localhost:4444 and check to see if our schema is in tact:

![image-20190610222300690](http://ww4.sinaimg.cn/large/006tNc79ly1g3x062lkkkj30fx0k5jt0.jpg)

We can also test our mutation in the playground:

```sql
mutation createUser {
  signup(email: "gaurang.r.shah@gmail.com", password: "bunty007", name: "G") {
    name
    email
    password
    permissions
  }
}
```

> and the result: 

```sql
{
  "data": {
    "signup": {
      "name": "G",
      "email": "gaurang.r.shah@gmail.com",
      "password": "$2a$10$VfW2sVaSFsyGfE6oRmXiQOF2RtuNQEtNY4meenbGSiGPen6hpo2C.",
      "permissions": [
        "USER"
      ]
    }
  }
}
```



We can also now see the same user in our primsa db:

![image-20190610223440286](http://ww4.sinaimg.cn/large/006tNc79ly1g3x0i6y8ccj308c0gg0ti.jpg)



Now that we have the signup process setup in the database, all we need to do is to add a form to our signup page and wire it up with our signup mutation. 
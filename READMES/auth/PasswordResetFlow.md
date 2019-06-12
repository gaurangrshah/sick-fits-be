# Password reset Flow

---------------------------------

We'll be implmenting a password reset flow which involves having a form, where a user can enter their email, where we then send them a token via email, which allows them to reset their password. We'll be setting a time limit on the token where it is only good for one hour. 

We'll first need to start distinguising between user types, as we implement this feature. 

If we take a look at the types we get back from our generated `primsa.graphql` file:

![image-20190611202134859](http://ww3.sinaimg.cn/large/006tNc79ly1g3y2a3kla3j30in052t93.jpg)

> We'll notice that we already have a `resetToken` available to us, along with a `resetTokenExpiry`. — these should not be available on the client-side for security reasons and the way we lock them down is to redefine them in our yoga client, so that the generated user type from prisma is no longer available to us on the frontend:

inside `schema.graphql`:

```react
type User {
  id: ID!
  name: String!
  email: String!
  permissions: [Permission!]!
}
```

> **NOTE**: we've removed the `implements Node` implementation, as we don't access node via Yoga. We've also removed the `password`, `resetToken`, and `resetTokenExpiry` declarations as we don't want those to leak to the front end.
>
> the `permissions` enum, which we defined in our datamodel, will get imported to this file from the same commented import we have at the top of the file:
>
> ``` 
> # import * from './generated/prisma.graphql'
> ```
>
> - any type or field reference that we define here that refers to one that is elsewhere is accessible via the import. 



While we're in the schema file we'll define another mutation that we'll need:

```react
requestReset(email: String!): SuccessMessage
```

Now we'll need to add a request reset mutation for this define definition in `src/resolvers/Mutation.js` 

```react
  requestReset(parent, args, ctx, info) {...}
```





The resetToken that we generate will need to be unique and cryptographically secure as well. We don't want to make the token something that can be easily hacked. So we'll we using a built-in package from node called crypto, and we're using a method called `{randomBytes}`:

```react
const {randomBytes} = require ('crypto');
// used to secure the resetToken

const {promisify} = require('util');
//used to turn callbacks fns into promises-  available by default via Node.
```

> randombytes currently runs its return data via a callback fn, but we'll want to turn that into a promise so we can use another method that is also available to us via another Node package: `{promisify}` from the Node `util` library



Now let's fill out the requestReset flow:

```react
 async requestReset(parent, args, ctx, info) {
    // 1. Verify email (see if email is registered)
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }

    // 2. Set a reset token
    const randomBytesPromiseified = promisify(randomBytes);
    const resetToken = (await randomBytesPromiseified(20)).toString('hex');
    // call randomBytes, pass in a length(20), which returns a "buffer" which we then covert to a string via .toString(hex) -- promisify just takes the callback that we get from random bytes and returns an async promise instead. 

    // 2a. Set an expiry on the token:
    const resetTokenExpiry = Date.now() * 3600000; // 1 hour from now

    // 2b. handle response & save our custom resetToken & exipry variables to the user:
    const res = await ctx.db.mutation.updateuser({
      // adding the newly created token and expiry to the user via their email:
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    })
    console.log(res);
		return { message: 'Thanks!' };
    // TODO: 3. Email the user the token
  },
```

> `randomBytes` is a method available to us off the the node default `crypto` library. We've used it here to secure our resetToken and add an expiry to it, limiting login using the token to a 1 hour window. 

We can check to see if this mutation is working, but running it in our playground: 

```sql
mutation requestRest {
  requestReset(email: "xaviersteel@gmail.com") {
    message
  }
}
```

and the response:

```sql
{
  "data": {
    "requestReset": {
      "message": "Thanks!"
    }
  }
}
```



We also see it getting logged into the node console:

```react
[Object: null prototype] {
  id: 'cjwrbrvkifom00b12mp9awcv9',
  name: 'Xavier',
  email: 'xaviersteel@gmail.com',
  password:
   '$2a$10$N.RTAS3goaQKm/1TSk5QSujlrh2lixHgKDBP2Bww3eRJAt9v7jcbe',
  resetToken: '427a12e959c9f364fffe1fbac4547a29ed3bb8df',
  resetTokenExpiry: 5617094057654400000 }
```



We can go to the backend in prisma and grab our `resetToken` for this user: 

![image-20190611215011409](http://ww2.sinaimg.cn/large/006tNc79ly1g3y4u7oam0j30hg0dngmv.jpg)

```sql
// prisma reset token: 
427a12e959c9f364fffe1fbac4547a29ed3bb8df
```

> we'll need to keep this handy as we setup our password reset schema



`src/schema.graphql`: Add a reset password type to our schema:

```react
 resetPassword(resetToken: String!, password: String!, confirmPassword: String!): User!
  # requires a resetToken which is a string, as well as a new password, and a confirmation, then returns a User.
```





We can then go back to our `Mutation.js` and code up our mutation for the resetPassword type:

```react
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
```

> **NOTE**:  we're currently using the `users` query to hit the db with as opposed to the `user` query we've been using. The `users` query returns an array from where we have structured the first item out as `[user]`
>
> the reason for this is that the `user` query requires an `@unique` input in order to satisfy the `where:` argument. Currently we've only defined two unique fields for the `user` type:
>
> ![image-20190611220723526](../../../../../../../Library/Application Support/typora-user-images/image-20190611220723526.png)
>
> If we had access we could use either one of those, but the `users` query instead, allows us to perform more robust queries, on our case we're using it to ensure our token is still valid. by using the `_gte` suffix to see if our `tokenExpiry`   is `greater than or equal to` an hour ago. 



once we have this mutation in place we can go ahead and run in via our playground with using the `resetToken` we got from the prisma backend:

```sql
mutation reset {
  resetPassword(resetToken: "427a12e959c9f364fffe1fbac4547a29ed3bb8df", password: "bunty007", confirmPassword: "bunty007") {
    id
    name
  }
}
```

and the result:

```sql
{
  "data": {
    "resetPassword": {
      "id": "cjwrbrvkifom00b12mp9awcv9",
      "name": "Xavier"
    }
  }
}
```

Now we can go ahead an sign in with the new password. 

Now if we ran the query again, it should've been invalidated:

```sql
{
  "data": null,
  "errors": [
    {
      "message": "This token is either invalid or expired!",
      "locations": [
        {
          "line": 8,
          "column": 3
        }
      ],
      "path": [
        "resetPassword"
      ]
    }
  ]
}
```

> perfecto! 



Now we can focus on the ==FrontEnd== to get our password reset form setup:

Create a new component `src/components/RequestReset.js`:

```react
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';


const REQUEST_RESET_MUTATION = gql`
  mutation REQUEST_RESET_MUTATION($email: String!) {
    requestReset(email: $email) {
      message
    }
  }
`;

class Signin extends Component {
  state = {
    email: '',
  };
  saveToState = e => {
    this.setState({ [e.target.name]: e.target.value });
  };
  render() {
    return (
      <Mutation
        mutation={REQUEST_RESET_MUTATION}
        variables={this.state}
      >
        {(reset, { error, loading, called }) => (
          <Form
            method="post"
            onSubmit={async e => {
              e.preventDefault();
              await reset();
              this.setState({ email: '' });
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Request a password reset.</h2>
              <Error error={error} />
              {!error && !loading && called && <p>Success! check your email for a reset link.</p>}

              <label htmlFor="email">
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="email"
                  value={this.state.email}
                  onChange={this.saveToState}
                />
              </label>

              <button type="submit">Request Reset</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

export default Signin;
```

> this component was modified from `src/components/Signin.js`



We can now import our RequestReset component into `src/pages/signup.js`:

```react
import RequestReset from '../components/RequestReset';
```

then render it:

```react
  <Columns>
    <Signup />
    <Signin />
    <RequestReset />
  </Columns>
```



We should also handle our success response, we could just do something like this:

```react
const success = await reset();
```

> then we can display the success message when the async fn resolves, but instead, there is another property that is available to us from our mutation's fn: `called` -  is a boolean that says whether or not this mutation has been called yet.
>
> ```react
> {!error && !loading && called && <p>Success! check your email for a reset link.</p>}
> ```



Now if we fill out the form we'll see a new resetToken logged in the console (‼️ which we'll remove in production. ) which tells us the first part of the form is working, now we have to create a form to handle the users actual reset of their password after they click the email reset link. 

Create new page: `src/pages/reset.js`

```react
const reset = props => {
  return (
    <p>reset your password {props.query.resetToken}</p>
  )
}

export default reset
```

> Attempting to pass resetToken along with the url and put it out onto the DOM via props.query.resetToken

```react
// new prisma reset token:
a3a6cd5f562af4b14494362e67d8abeaa13de35f
```

Now we can append that request to our url and see if we're able to pul it out via `props.query.resetToken` from the reset page: `src/pages/reset.js`

> http://localhost:7777/reset?resetToken=a3a6cd5f562af4b14494362e67d8abeaa13de35f
>
> ![image-20190611230232548](http://ww4.sinaimg.cn/large/006tNc79ly1g3y6xjrqgbj30cw038jrd.jpg)
>
> we're def. able to pass it along with the urls. 



Now let's create a new component: `src/components/Reset.js`:

```react
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';


const RESET_MUTATION = gql`
  mutation RESET_MUTATION($resetToken: String!, $password: String!, $confirmPassword: String!) {
    resetPassword( resetToken: $resetToken, password: $password, confirmPassword: $confirmPassword){
      id
      email
      name
    }
  }
`;

class Reset extends Component {
  static propTypes = {
    resetToken: PropTypes.string.isRequired,
  }

  state = {
    password: '',
    confirmPassword: '',
  };

  saveToState = e => {
    this.setState({ [e.target.name]: e.target.value });
  };


  render() {
    return (
      <Mutation
        mutation={RESET_MUTATION}
        variables={{
          resetToken: this.props.resetToken,
          password: this.state.password,
          confirmPassword: this.state.confirmPassword,
        }}
      >
        {(reset, { error, loading }) => (
          <Form
            method="post"
            onSubmit={async e => {
              e.preventDefault();
              const success = await reset();
              this.setState({ password: '', confirmPassword: '' });
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Reset your password.</h2>
              <Error error={error} />
              <label htmlFor="password">
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="password"
                  value={this.state.password}
                  onChange={this.saveToState}
                />
              </label>

              <label htmlFor="confirmPassword">
                Confirm Password
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="confirmPassword"
                  value={this.state.confirmPassword}
                  onChange={this.saveToState}
                />
              </label>

              <button type="submit">Reset Password!</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

export default Reset;
```



Now let's import this component into `src/pages/reset.js`:

```react
import Reset from '../components/Reset';

const reset = props => {
  return (
    <p>reset your password</p>
    <Reset resetToken={props.query.resetToken} />
  )
}

export default reset
```

> **NOTE**: we've passed the resetToken in as a prop to the Reset component



Once its rendering we can pass in the token once again to the reset url:

> http://localhost:7777/reset?resetToken=08bccc0fd775a142a6f5fba7323f130df032e8be

now that it is working we'll want to handle one more thing, where we log a user in automatically when they've reset their password. We'll use `refetchQueries` on our mutation to achieve this in `src/components/Reset.js`

first import the `CURRENT_USER_QUERY` from `src/components/User.js`

```react
import {CURRENT_USER_QUERY} from './User';
```

then we can use `refetchQueries` to refetch the `CURRENT_USER_QUERY` after the user has been logged in after password reset:

```react
<Mutation
  mutation={RESET_MUTATION}
  variables={{
    resetToken: this.props.resetToken,
      password: this.state.password,
        confirmPassword: this.state.confirmPassword,
  }}
  refetchQueries={[{ query: CURRENT_USER_QUERY }]}
  >
```

This can be used to load the any of the user's settings/preferences once they've been authenticated.

Now the next step is to get our server sending the reset emails when a user requests a password reset.
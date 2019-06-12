## Handle user sign in via form:

---------------------------------

Let's start in the ==BackEnd== `src/schema.graql`

we can define the mutation type for our signin mutation:

```react
  signin(email: String!, password: String!): User!
```



Next we have to setup the resolver for the signin mutation type: `src/resolvers/Mutation.js`:

```react
//signin(parent, args, ctx, info) {...},
async signin(parent, {email, password}, ctx, info) {...},
```

> basic boiler for a Mutation, specifying all the args we have access to. 
>
> **NOTE**: signin is an `async` function, we'll have to `await` for the response from the query
>
> **ALSO NOTE**: we've destructure the `args` parameter in line to: `{email, password}`



1. Check to see if the user's email exists, if not throw an error:

```react
    // 1. Check if user is registered (ie, does email exist in db)
    const user = await ctx.db.query.user({ where: { email } })
    // passed in the destructured email from {args} in the params.

    if (!user) {
      // if user does not exist throw error:
      throw new Error(`Sorry no user registered for email: ${email}`);
    } 
```

> **NOTE**: this error can be displayed to the user if needed on the front end. that is why we are handling it here. 



2. Validate Entered Password:

```react
// 2. Validate password
const valid = await bcrypt.compare(password, user.password);
```

> **NOTE**: takes entered password -> hashes it -> compares to hash on file from signup — using the compare method from bcrypt. 



3. If email is registered and password is valid, then we can generate the user's Auth token:

```react
// 3. generate JWT token
const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

```

> signs the auth token for he user.id with our APP_SECRET attached. 



4. Set the cookie with the signed token:

```react
// 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      // takes cookie from response, and sets token onto it. 
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    })
```



5. return user:

```react
// 5. return the user
return user;
```





==Final==:

```react
  async signin(parent, { email, password }, ctx, info) {
    // 1. Check if user is registered (ie, does email exist in db)
    const user = await ctx.db.query.user({ where: { email } })
    // passed in the destructured email from {args} in the params.

    if (!user) {
      // if user does not exist throw error:
      throw new Error(`Sorry no user registered for email: ${email}`);
    } // this error can be displayed to the user if needed on the front end. that is why we are handling it here.

    // 2. Validate password
    const valid = await bcrypt.compare(password, user.password);
    // takes entered password -> hashes it -> compares to hash on file from signup.

    if (!valid) {
      throw new Error('Invalid Password')
    }

    // 3. generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // signs the auth token for he user.id with our APP_SECRET attached.

    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      // takes cookie from response, and sets token onto it. 
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    })
    // 5. return the user
    return user;
  },
```





Now we can switch over to the ==FrontEnd== and create a signin from: `src/components/Signin.js` 



`Signin.js` is going to be able to use the logic from `src/components/Signup.js`:

```react
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';
//imported query to to not have to rewrite it here. 

const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    signin(email: $email, password: $password) {
      id
      email
      name
    }
  }
`;

class Signin extends Component {
  state = {
    name: '',
    password: '',
    email: '',
  };
  saveToState = e => {
    this.setState({ [e.target.name]: e.target.value });
  };
  render() {
    return (
      <Mutation
        mutation={SIGNIN_MUTATION}
        variables={this.state}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
        // take an array of queries component will need to refetch
      >
        {(signup, { error, loading }) => (
          <Form
            method="post"
            onSubmit={async e => {
              e.preventDefault();
              await signup();
              this.setState({ name: '', email: '', password: '' });
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Sign into your account</h2>
              <Error error={error} />
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

              <button type="submit">Sign In!</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

export default Signin;
```

> **NOTE**: We've removed all of the references to the name field, both in the mutation and in the form. And that we are using `refetchQueries` this makes the mutation go back and refetch any queries listed when the mutation completes. This will render our signed in users name.

Then import  `src/pages/signin.js` to `src/components/Signup.js`:

```react
import Signin from '../components/Signin';
```

```react
 return (
    <Columns>
      <Signup />
      <Signin />
      <Signup />
    </Columns>
  );
```



Now we'll want to make sure we're handling users that are not signed in and render a signin button for them:

```react
import Link from 'next/link';
import NavStyles from './styles/NavStyles';
import User from './User';

const Nav = () => (
  <User>
    {({ data: { me } }) => (
      <NavStyles>
        {me && <p>{me.name}</p>}
        <Link href="/items">
          <a>Shop</a>
        </Link>
        {me && (
          <>
            <Link href="/sell">
              <a>Sell</a>
            </Link>
            <Link href="/orders">
              <a>Orders</a>
            </Link>
            <Link href="/me">
              <a>Account</a>
            </Link>
          </>
        )}
        {!me && (
          <Link href="/signup">
            <a>Sign In</a>
          </Link>

        )}
      </NavStyles>
    )}
  </User>
);

export default Nav;
```

> **NOTE**: only logged in users can now see menu links for all CRUD related actions that require authtentication.


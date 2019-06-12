## Sign Users Out, (logout)

---------------------------------

let's start on the ==backend== we'll need to create a new mutation to handle the user signout procedure: 

define the signout mutation type in in `src/schema.graphql`

```react
  signout: SuccessMessage
```

> signout, now references a type called `SuccessMessage` it's a custom type we can create to handle any success messages:
>
> ```js
> type SuccessMessage {
>   # custom type, allows us to return a specific shape of an object. 
>   message: String
> }
> ```
>
> this is how we can create custom types that are not defined by the backed (i.e., the generated `prisma.graphql` file.

Now that we have our `signout` mutation setup and referencing our new type `successmessage` we need to handle the resolver for this type: `src/resolvers/Mutation.js`

Start with the basic Mutation boilerplate:   `signout(parent, args, ctx, info) {...}`

```react
signout(parent, args, ctx, info) {
    // handle logout by clearing cookies
  
    ctx.response.clearCookie('token');
    // clearCookie is a method available via 'cookie-parser'

    // return logout message
    return { message: 'Goodbye'}
  }
```

> **NOTE**: logout message is not actually displayed in our use case, but it can be if needed. 



Next we'll need to make a Signout component: ==FrontEnd==: `src/components/Signout.js`

We'll start with our imports and just rendering our signout button:

```react
import React from 'react'
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const Signout = () => <button>Sign Out</button>

export default Signout

```



Then we can import the Signout component into our Nav component: `src/components/Nav.js`:

```react
import Signout from './Signout';
```



And nest the component inside the `(me)` conditional:

```react
 {me && (
          <>
            {/* logged in user links */}
            <Link href="/sell"><a>sell</a></Link>
            <Link href="/signup"><a>Signup</a></Link>
            <Link href="/orders"><a>Orders</a></Link>
            <Link href="/me"><a>Account</a></Link>
            <Signout />
          </>
        )}
```

> this ensures that only when a user is logged in do they see the signout button.



Next we can go back to our signout component and handle the mutation for the signout:

`src/components/Signout.js`:

```react
const SIGN_OUT_MUTATION = gql`
  mutation SIGN_OUT_MUTATION {
    signout {
      #signout mutation returns a message
      message
    }
  }
`;
```



next we can wrap our component in our signout mutation:

```react
const Signout = () => (
  <Mutation mutation={SIGN_OUT_MUTATION}>
    {(signout) => <button onClick={signout}>Sign Out</button>}
  </Mutation>
);
```

> We're able to access the signout method and handle it onclick all within the mutation. 

now this will work, but the button will not re-render (and go away) until we define our `refetchqeuries` prop on the mutation:

```react
<Mutation mutation={SIGN_OUT_MUTATION} refetchQueries={[{ query: CURRENT_USER_QUERY }]}>
```

> refetchQueries will allow us to re-render the button when the user gets signed out successfully, after mutation returns the message. This will trigger the re-render on the nav and anywhere else that relies on the `CURRENT_USER_QUERY`. 
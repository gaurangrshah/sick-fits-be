## Local Queries & Mutations (Apollo)

---------------------------------

Because state can be somewhat difficult to pass around on the frontend, and because, tools like redux may often be too much, and if we're already using Apollo for our data handling, then it make sense to leverage apollo to utilize queries and mutations that interact with local state, and represent client side data in a similar way.

==FrontEnd== `lib/withData.js`:

Here we've already setup apollo to work with our server-side data now we'll also define how apollo should interact with our local data:

```react
// apollo config to handle clientside local data:
clientState: {
  resolvers: {}, //initialized, empty.
    defaults: {
      cartOpen: true, // used to toggle cart state.
    }
    },
```



`components/Cart.js`: import `Query`, `Mutation` & `gql`:

```react
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
```

Create Local State Query:

```react
const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client,
    # @client tells apollo this data from local store --  not in remote/db.
  }
`;
```



Render Query Component and details:

```react
  <Query query={LOCAL_STATE_QUERY}>

      {/* destructures data from query: */}
      {({ data }) => (
        console.log('🛒', data) || (

          <CartStyles open>
            <header>
              <CloseButton title="close">&times;</CloseButton>
              <Supreme>Your Cart</Supreme>
              <p>You have __ items in your cart.</p>

            </header>
            <footer>
              <p>$10.10</p>
              <SickButton>Checkout</SickButton>
            </footer>
          </CartStyles>

        )
      )}
    </Query>
```

> ![image-20190613181654459](http://ww2.sinaimg.cn/large/006tNc79ly1g409wym8xhj30ep01iglk.jpg)



Now that we have access to local state, thru apollo, we can use that to toggle our cart:

```react
<CartStyles
  // accessing the cartOpen property defined in withData.js for clientState
  open={data.cartOpen}
  >
```



 Next we can write a mutation that will handle the toggling of `cartOpen` from apollo:

```react
const TOGGLE_CART_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;
```



In order to use it we'll have to render it as a component and wrap our query w/in it:

```react
<Mutation mutation={TOGGLE_CART_MUTATION}>
  {toggleCart => (

    <Query query={LOCAL_STATE_QUERY}>

      {/* destructures data from query: */}
      {({ data }) => (
        console.log('🛒', data) || (

          <CartStyles
            // accessing the cartOpen property defined in withData.js for clientState
            open={data.cartOpen}
            >
            <header>
              <CloseButton title="close">&times;</CloseButton>
              <Supreme>Your Cart</Supreme>
              <p>You have __ items in your cart.</p>

            </header>
            <footer>
              <p>$10.10</p>
              <SickButton>Checkout</SickButton>
            </footer>
          </CartStyles>

        )
      )}
    </Query>


  )}
</Mutation>
```



Now we can use the `toggleCart` method we just exposed and use it to toggle the cart when the close button is clicked:

```react
<CloseButton title="close" onClick={toggleCart}>&times;</CloseButton>
```



Now even though this is all wired up we still need to add a resolver for this mutation like every other, but this resolver gets defined in: `lib/withData.js`:

We've exported the query and mutation from `components/Cart.js` which we can import into `withData.js`:

```react
import { LOCAL_STATE_QUERY, TOGGLE_CART_MUTATION } from '../components/Cart';
```

> we'll need access to this mutation and query throughout the application to interact wtih the cart.

We can use the query to access our LocalState from cache and then set make changes and set it back to local state.

```react
Mutation: {
  toggleCart(_, variables, { cache }) {
    // toggle the cartOpen value from the cache which was destructured from 'client'
    const { cartOpen } = cache.readQuery({
      // read from local_state_query:
      query: LOCAL_STATE_QUERY,
    });
    console.log(cartOpen)
  }
}
```

Now that we're able to access the cartOpen property off of local state we can toggle the cartOpen property's value to help us open and clsoe the cart. 

```react
Mutation: {
  toggleCart(_, variables, { cache }) { // cache destructured from 'client'
    const { cartOpen } = cache.readQuery({
      // 1. access cartOpen from local state:
      query: LOCAL_STATE_QUERY,
    });
    console.log(cartOpen)
    const data = {
      // toggle cartOpen:
      data: { cartOpen: !cartOpen }
    };
    // 3. Set cartOpen back to local state:
    cache.writeData(data);
    return data;
  }
}
```

now if we default the value of cartOpen to `true` we'll see that we're able to toggle it close from the `close` button available to us.

We'll be able to add the cart toggle to `components/Nav.js` - so that the cart access is always available:

We'll need to import our mutation we created from `components/Cart.js`:

```react
import { Mutation } from 'react-apollo'
import { TOGGLE_CART_MUTATION } from '../components/Cart';
```



Then we can create a button and wrap it in the toggle cart mutation to use our cartOpen toggle:

```react
<Mutation mutation={TOGGLE_CART_MUTATION}>
  {(toggleCart) => (
    // using the toggleCart method from the mutation to toggle cartOpen from local state
    <button onClick={toggleCart}>My Cart</button>
  )}
</Mutation>
```


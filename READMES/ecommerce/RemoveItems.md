# Remove Items from Cart

---------------------------------

==BackEnd==

First step is to define a removeFromCart mutation type in our `src/schema.graphql` that  will handle the removal of items from our cart for us:

```react
removeFromCart(id: ID!): Cartitem
```



Now we can add our reslover for this mutation: `src/resolvers/Mutation.js`:

```react
  async removeFromCart(parent, args, ctx, info) {
    // 1. Find cart item
    const cartItem = await ctx.db.query.cartitem({
      where: {
        id: args.id,
      },
      // normally we'd pass in info, but instead we need who owns this item.
    }, `{id, user {id}}`);
    // 1b. Check if item still exists in cart:
    if (!cartItem) throw new Error('No Cartitem Found!');
    // 2. Make sure user owns item in cart
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('Cheatin huhhhh');
    }
    // 3. Delete that cart item.
    return ctx.db.mutation.deleteCartItem({
      where: { id: args.id },
    }, info);
  }
```





==FrontEnd== `components/RemoveFromCart.js`:

let's first handle the imports we know we'll need:

```react
import React from 'react';
import {Mutation} from 'react-apollo';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import gql from 'graphql-yoga';
import React from 'react';
import {Mutation} from 'react-apollo';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import gql from 'graphql-yoga';
import {CURRENT_USER_QUERY} from './User';
```



And the boilerplate for the component:

```react
class RemoveFromCart extends React.Component {
  render() {

  }
}

export default RemoveFromCart;
```



Create a button:

```react
const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &:hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`;

class RemoveFromCart extends React.Component {



  render() {
    return (
      <BigButton
        disabled={loading}
        title="Delete Item"
      >
        &times;
    </BigButton>
    );
  }
}

export default RemoveFromCart;
```



and we can then get it rendering `components/CartItem.js`:

```react
import RemoveFromCart from './RemoveFromCart';

/* ... */

<RemoveFromCart id={cartItem.id} />

```

> We've passed in an `id` as a `prop` 



back in `components/RemoveFromCart.js` let's setup the prop-type for the id prop we expect to be passed in:

```react
class RemoveFromCart extends React.Component {
static propTypes = {
  id: PropTypes.string.isRequired,
};

	/* ... */

}
```



Next we can create the removeFromCart method we'll need for our mutation:

```react
const REMOVE_FROM_CART_MUTATION = gql`
  mutation removeFromCart($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`;
```



then we can render this method as a child of the mutation using an arrow fn:

```react
<Mutation mutation={REMOVE_FROM_CART_MUTATION} variables={{ id: this.props.id }}>
  {(removeFromCart, { loading, error }) => (

    /* ... */

  )}
</Mutation>
```

> note that we've passed in the id: as the variable for this mutation.

Lastly we can make sure that the method from the mutation gets called onClick:

```react

<Mutation mutation={REMOVE_FROM_CART_MUTATION} variables={{ id: this.props.id }}>
  {/* id for item to be remove gets passed in as a variable to the mutation from props */}
  {(removeFromCart, { loading, error }) => (
    /* destructured removeFromCart(), loading and error from the mutation */
    <BigButton
      title="Delete Item"
      onClick={() => {
        /* call removeFromCart() */
        removeFromCart().catch(err => alert(err.message));
      }}
				
      /* use loading to toggle disabled when removing. */
      disabled={loading}
      >
      &times;
    </BigButton>
  )}
</Mutation>
```



Lastly let's use the `loading` variable to help us toggle the buttons state when we're submitting:

```react
<BigButton
  title="Delete Item"
  onClick={() => {
    removeFromCart().catch(err => alert(err.message));
    // using a catch() to grab any errors and alert the user. 
  }}
  disabled={loading}
  >

  {loading ? '' : '❌'}

</BigButton>
```



Now if we use the button to remove an item from our cart, we'll notice that we're able to remove the item from the db, without any errors, but the product doesn't remove from the cart visually. For that we could use `refetchQueries`, but we already have access to the cache...  


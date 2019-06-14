## Display Cart Items and Totals

---------------------------------

In order to get access to a users cart details, we'll need to query the user, we've already done this in our Nav component where we use this query to handle the logic of a logged in user vs. a guest user. We can re-use this logic to query our users cart.

in `components/Cart.js` import the user component:

```react
import User from './User';
```

We can wrap our cart with the user component:

```react
  return (
    <User>
      <Mutation mutation={TOGGLE_CART_MUTATION}>
        {toggleCart => (
          <Query query={LOCAL_STATE_QUERY}>
            {({ data }) => (
              console.log('🛒', data) || (

                <CartStyles
									
                  /* ... */
                  
                </CartStyles>
              )
            )}
          </Query>
        )}
      </Mutation>
    </User>
  )
```



Now we can fill out our render props for the User component:

```react
<User>
      {({ data: { me } }) => {
        // check if user is logged in before rendering
        if (!me) return null;
    		
        return (
          
          <Mutation mutation={TOGGLE_CART_MUTATION}>
            {toggleCart => (
              <Query query={LOCAL_STATE_QUERY}>
                {({ data }) => (
                  console.log('🛒', data) || (
                    <CartStyles
                      open={data.cartOpen}
                    >
                      
                      {/* ... */}
                      
                    </CartStyles>
                  )
                )}
              </Query>
            )}
          </Mutation>  
        
        )
      }}
    </User>
```



Now we can output the user's name onto the cart:

```react
<Supreme>{me.name}'s Cart</Supreme>
```



We currently have access to the user in our cart component, by we do not have access to the user's cart yet, we'll need to define the items we want the cart to return to us from the `CURRENT_USER_QUERY` which was defined in: `components/User.js` — this is the current query:

```react
const CURRENT_USER_QUERY = gql`
 query {
  me {
    id
    email
    name
    permissions
  }
 }
`;
```



We'll need to modify it to include our cart in the return as well:

```react
const CURRENT_USER_QUERY = gql`
 query {
  me {
    id
    email
    name
    permissions
    cart {
      id
      quantity
    }
  }
 }
`;
```

And now our `CURRENT_USER_QUERY` has access to the cart:

![image-20190614004618422](http://ww4.sinaimg.cn/large/006tNc79ly1g40l62v4z2j30m104lab0.jpg)



As we see from the log above, we already have access to our cart, we can use that to provide the user with a number of items in their cart currently: `components/Cart.js`

```react
<p>You have {me.cart.length} item{me.cart.length === 1 ? '' : 's'} in your cart.</p>
```

> we're using the cart's length to handle some of our feedback logic to the user:
>
> ![image-20190614005059228](http://ww3.sinaimg.cn/large/006tNc79ly1g40layetvyj30dw03jq2y.jpg)





Now that we're able to not only access the user but their cart details as well, we can start rendering out the items in the user's cart, but before we do, first let's import in the `CURRENT_USER_QUERY` from the user component

```react
import { CURRENT_USER_QUERY } from './User';
```

we'll want to be able to handle updates to the cart, and in order to do that we'll need to add the refetchQueries prop to the AddToCart mutation, which will allow it to re-render anytime the cart gets updated:

```react
<Mutation 
  mutation={ADD_TO_CART_MUTATION} 
  variables={{ id }} 
  refetchQueries={[{ query: CURRENT_USER_QUERY }]}
  // refetchQueries takes in an array, and there's one query on that array. 
  >
```



Now we'll notice that when we add another item to the cart, our number of items get's incremented and our cart adds another list item with a product id. 



In order to render each item in the cart, we'll create a new component `components/CartItem.js`

```react
import React from 'react';
import formatMoney from '../lib/formatMoney';
import styled from 'styled-components';



const CartItemStyles = styled.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightgrey};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  img {
    margin-right: 10px;
  }
  h3, p {
    margin: 0;
  }
`;

const CartItem = props => (
  <CartItemStyles>
    Hi
  </CartItemStyles>
)

export default CartItem;
```



Next we can import the CartItem component into the Cart component: `components/Cart.js`:

```react
import CartItem from './CartItem';
```



And then we can make sure it renders out by replacing the hard-code list-items from our <ul>:

```react
<ul>
  {me.cart.map((cartItem) =>
               <CartItem
                 key={cartItem.id}
                 cartItem={cartItem}
                 />
              )}
</ul>
```

> Passed in the entire cartItem as a prop to the CartItem component, as we can use this to query the item's details.



Now we can render out our cart item's id via `components/CartItem.js`:

```react
const CartItem = props => (
  <CartItemStyles>
    {props.CartItem.id}
  </CartItemStyles>
)
```



And since we're relying on a prop, we'll need to import `prop-types`:

```react
import PropTypes from 'prop-types'
```

Then define our propType:

```react
CartItem.propTypes = {
  cartItem: PropTypes.object.isRequired,
}
```



Now we currently have access to some basic information about our cart and our user. We can get some of the fields off of the item, name the id. In order to gain access to the other fields, we'll need to modify our query: `components/User.js`

```react
const CURRENT_USER_QUERY = gql`
 query {
  me {
    id
    email
    name
    permissions
    cart {
      id
      quantity

      item {
        id
        title
        price
        image
        description
      }

    }
  }
 }
`;
```

> We've updated the query to return the item and specified all the fields we need off of item.
>
> **PURELY AS AN EXAMPLE**:
>
> We can also go one step further and use our relatiship betwen item and user to grab the user's email:
>
> ```react
> const CURRENT_USER_QUERY = gql`
>  query {
>   me {
>     id
>     email
>     name
>     permissions
>     cart {
>       id
>       quantity
>       item {
>         id
>         title
>         price
>         image
>         description
> 
> 				user {
>           name
>           email
>         }
> 
>       }
>     }
>   }
>  }
> `;
> ```



`components/CartItem.js`

Since we are no able to access all the information we need to render out each item in our cart and handle the calcuation of totals - well need a utility function to do that:

```react
<CartStyles
  // accessing the cartOpen property defined in withData.js for clientState
  open={data.cartOpen}
  >
  <header>
    <CloseButton title="close" onClick={toggleCart}>&times;</CloseButton>
    <Supreme>{me.name}'s Cart</Supreme>
    <p>You have {me.cart.length} item{me.cart.length === 1 ? '' : 's'} in your cart.</p>

  </header>
  <ul>
    {me.cart.map((cartItem) =>
                 <CartItem
                   key={cartItem.id}
                   cartItem={cartItem}
                   />
                )}
  </ul>
  <footer>
    <p>{calcTotalPrice(me.cart)}</p>
    {/* takes in the entire cart and returns total */}
    <SickButton>Checkout</SickButton>
  </footer>
</CartStyles>
```



This will render our cart totals for each item and update when a new item is added, now we'll need to handle the removing of items from the cart. 
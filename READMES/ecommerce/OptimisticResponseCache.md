## Optimistic Response / Cache Apollo:

---------------------------------

==FrontEnd== `components/RemoveFromCart.js`

Currently, if we use the button to remove an item from our cart, we'll notice that we're able to remove the item from the db, without any errors, but the product doesn't remove from the cart visually. 

For that we could use `refetchQueries`, but we already have access to the cache, once the data comes back, we can leverage the update method on our mutation providing the id of the item that got removed:

```react
<Mutation
  mutation={REMOVE_FROM_CART_MUTATION}
  variables={{ id: this.props.id }}
  update={this.update}
>
```



Now we'll need to define the update method which will interact with the cache and the response from the server as the payload:

```react
update = (cache, payload) => {
  console.log('Running remove from cart update fn')
  // used to un-render cart items when removed:

  // 1. read cache
  const data = cache.readQuery({
    query: CURRENT_USER_QUERY
  });
  console.log(data);

  // 2. remove that item from the cart
  const cartItemId = payload.data.removeFromCart.id;
  // removeFromCart is a mutation available on payalod.data
  data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId);
  // remove item if the cartItem's id doesn't match the id we extractex into cartItemId

  // 3. write it back to the cache
  cache.writeQuery({ query: CURRENT_USER_QUERY, data });
}
```

> `update` fires after the mutation finishes - takes in the (cache, payload). `caches` gives us access to everything in cache, `payload` is the info returned from server, we expect the id of the item from the mutation that gets resolved to get returned back to us, which we can use to check it it matches any item in our cart. Then we filter that item out and write that data of cartitems back to the cache.

Now that this is working we can see there's a slight delay between when we remove an item and when that data gets visually removed from our cart. 



This is where we can use optimistic response to update the UI when we expect a behavior to occur — which is basically updating the UI without waiting for the server response in order to actually render the end effect of the removal to the user. 

```react

<Mutation
  mutation={REMOVE_FROM_CART_MUTATION}
  variables={{ id: this.props.id }}
  update={this.update}
  optimisticResponse={{
    __typename: 'Mutation', 
      // we expect the a mutation type to be returned
      removeFromCart: {   
        // we expect a method called removeFromCart
        __typename: 'CartItem', 
          // expecing an item of type: CartItem
          id: this.props.id,  
          // expect CartItem to have an id
      } // defining optimisticReponse, mimics the behavoir of the data returned from the server.
      }}
  >
```

> optimistic response defines an object of what we expect the server to respond with
>
> `typename` - defines the type of items we expect to have returned. 

This will allow the user to feel as though the removal was instantaneous, while we're handling the actual removal on the backend, and doing some cleanup to make sure everything fires accordingly. 



This same thing can be done for AddToCart as well:
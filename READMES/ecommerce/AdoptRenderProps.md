## React Adopt for Render Props

---------------------------------

==FrontEnd== `components/Cart.js`

---------------------------------

Currently we're dealing with what's known as a `RenderProps nightmare`:

```react
 <User>
      {({ data: { me } }) => {
        if (!me) return null;
        console.log(me);
        return (

          <Mutation mutation={TOGGLE_CART_MUTATION}>
            {toggleCart => (

              <Query query={LOCAL_STATE_QUERY}>

                {({ data }) => (
                  console.log('🛒', data) || (
                    
                    /* ... */
                  
                  )
                )}
              </Query>


            )}
          </Mutation>

```

> this occurs when u have multiple higher order components being used just to give our actual component access to some data. This nesting issue can make debugging a real nightmare

This is where we can use a library called `Adopt` which let's us combine all of our render props into one high level data container, that then exposes all the variables and methods we need exposed to our actual component for us

```react
import adopt from 'react-adopt';
```

```react
const Composed = adopt({
  // takes in everything we want to compose together
  user: ({ render }) => <User>{render}</User>,
  // having u use render to render children, which are expected for each of these components
  toggleCart: ({ render }) => <Mutation mutation={TOGGLE_CART_MUTATION}>{render}</Mutation>,
  localState: ({ render }) => <Query query={LOCAL_STATE_QUERY}>{render}</Query>
})
```



Finally we can replace our nested render props components for the new Composed component:

```react
  return (
    <Composed>
      {/* accessing the items we render from Composed */}
      {({ user, toggleCart, localState }) => {
        const me = user.data.me;
        if (!me) return null;
        return (

          <CartStyles
            // now access data from the localState defined in the Composed component.
            open={localState.data.cartOpen}
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
              <p>{formatMoney(calcTotalPrice(me.cart))}</p>
              {/* takes in the entire cart and returns total */}
              <SickButton>Checkout</SickButton>
            </footer>
          </CartStyles>


      );
    }}
  </Composed>
  )
```

The result is one component that hydrates our component with any of the data and/or functionality it needs.


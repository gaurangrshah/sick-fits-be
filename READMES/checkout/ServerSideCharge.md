# Server-side Charging

---------------------------------

Currently we're able to generate a token when a user clicks the pay button in our stripe modal. We'll can now take that tokent that comes back charge the customer using the token, and covert our products in our cart to order items. To handle this behavoir we'll need to define a new type for our `OrderItems`:

==BACKEND== `datamodel.prisma`:

```json
type OrderItem {
  id: ID!  @id @unique
  title: String!
  description: String!
  image: String!
  largeImage: String!
  price: Int!
  quantity: Int! @default(value: 1)
	#sets minimum quantity to: 1
	user: User
	#sets user that purchased item  -- not used in queries, but useful for reporting purposes.
}
```

> Creating a separte `OrderItem` is not only just to keep with actual logic, where `cartitems` have relationships to the `item` itself, `OrderItems` will be independent of that relationship, this provides a few direct benefits and handles some edge cases: 
>
> - helps maintain purchase history
> - helps ensure any real-time product updates do not affect items that are in customers order history
> - reflects purchase price and not product current price when used in customer history.
> - ensure that if a product is removed from inventory or the store, the purchase history is still maintained accordingly.



Next we'll also add an `Order` type, to help us compile a list of several `OrderItems`:

```json
type Order {
  id: ID! @id  @unique
  items: [OrderItem!]!
  total: Int!
  user: User!
  charge: String!
	# adding the fields below after next lesson:
	createdAt: DateTime! @createdAt
	updatedAt: DateTime! @updatedAt
}

```

> had to add `createdAt` and `updatedAt` because they are a requirement for prisma.

anytime we upate the datamodel, we must re-depoly to prisma to generate our new prisma bindings:

```shell
yarn deploy
```

> ```json
> Deploying service `sick-fits` to stage `dev` to server `prisma-us1` 812ms
> 
> Changes:
> 
>   Order (Type)
>   + Created type `Order`
>   + Created field `id` of type `ID!`
>   + Created field `items` of type `[OrderItem!]!`
>   + Created field `total` of type `Int!`
>   + Created field `user` of type `User!`
>   + Created field `charge` of type `String!`
> 
>   OrderItem (Type)
>   + Created type `OrderItem`
>   + Created field `id` of type `ID!`
>   + Created field `title` of type `String!`
>   + Created field `description` of type `String!`
>   + Created field `image` of type `String!`
>   + Created field `largeImage` of type `String!`
>   + Created field `price` of type `Int!`
>   + Created field `quantity` of type `Int!`
>   + Created field `user` of type `User`
> 
>   OrderItemToUser (Relation)
>   + Created an inline relation between `OrderItem` and `User` in the column `user` of table `OrderItem`
> 
>   OrderToUser (Relation)
>   + Created an inline relation between `Order` and `User` in the column `user` of table `Order`
> 
>   OrderToOrderItem (Relation)
>   + Link Table `_OrderToOrderItem` between `Order` and `OrderItem` has been created
> 
> Applying changes 2.3s
> 
> post-deploy:
> project prisma - Schema file was updated: src/generated/prisma.graphql
> 
> Running graphql get-schema -p prisma ✔
> 
> Your Prisma endpoint is live:
> 
>   HTTP:  https://us1.prisma.sh/gshah2020-4a9e06/sick-fits/dev
>   WS:    wss://us1.prisma.sh/gshah2020-4a9e06/sick-fits/dev
> 
> You can view & edit your data here:
> 
>   Prisma Admin: https://us1.prisma.sh/gshah2020-4a9e06/sick-fits/dev/_admin
> ```
>
> We can see which items changed in the deploy logs, including the item types we've added and lastly the endpoint that gets made availabel when we deploy.



## Create Order

---------------------------------

Next we can update our schema allowing us to add a `createOrder` mutation:

```js
createOrder(token: String!) : Order!
```

> `createOrder` takes in a `token`  which is a non-nullable string and will return and `Order` which is required(`!`)

Now we can setup our resolver for the `createOrder` mutation:

```js
  async createOrder(parent, args, ctx, info) {
    console.log(args);

    //1. Query the current user and make sure they are signed in
    //2. recalculate teh total for the price
    //3. Create the stripe charge
    //4. Convert the CartItems to Orderitems
    //5. Create the Order
    //6. Clearn up - clear the users cart, delete cartItems
    //7. Return the order to the client.

  }
```

```js
 // 1. Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) throw new Error('You must be signed in to complete this order.');
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      name
      email
      cart {
        id
        quantity
        item { title price id description image largeImage }
      }}`
    );

    // 2. recalculate the total for the price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    console.log(`Going to charge for a total of ${amount}`);

```

> We recalculate the price, because we want to ensure that the price was not tampered with on the client side and to ensure accuracy we use a dual layer, if we only relied on client side for the calculating of the price we may see someone try to send a lower price across to the server by just changing the html markup in the browser. To avoid that issue we recalcuate the entire cart order total on the server as well.



==FRONTEND== `components/TakeMyMoney.js`: create the mutation query for `createOrder` mutation:

```js
const CREATE_ORDER_MUTATION = gql`
  mutation createOrder($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`;
```



Now we can render our mutation component: 

```react
<Mutation
  mutation={CREATE_ORDER_MUTATION}
  refetchQueries={[{ query: CURRENT_USER_QUERY }]}
  >
  {createOrder => (
    <StripeCheckout
      // prop amount from react-stripe-checkout
      amount={calcTotalPrice(me.cart)}
      // uses custom calcTotal fn.
      name="Sick Fits"
      description={`Order of ${totalItems(me.cart)} items!`}
      // calls totalItems which returns a count of all items in the cart.
      image={me.cart.length && me.cart[0].item && me.cart[0].item.image}
      stripeKey="pk_test_Vtknn6vSdcZWSG2JWvEiWSqC"
      currency="USD"
      email={me.email}
      token={res => this.onToken(res, createOrder)}
      >
      {this.props.children}
    </StripeCheckout>
  )}
</Mutation>
```

> ❌ we've added a conditional check ot make sure that `me.cart.length` exists before trying to set the image, this was intially an error because there is no image when we clear the cart after an order has completed., so this comes up later on, but can be solved with that simple conditional check.

Now that we have access to our `createOrder` mutation we can now pass that along with our response to `onToken()`:

```react
token={res => this.onToken(res, createOrder)}                
```

which now allows us to access `createOrder` from the onToken method:

```react
  onToken = (res, createOrder) => {
    console.log('On Token Called!');
    console.log(res.id);
    // manually call the mutation once we have the stripe token
    createOrder({
      variables: {
        token: res.id,
      },
    }).catch(err => {
      alert(err.message);
    });
```



==Backend== `src/stripe.js` :

```js
module.exports = require('stripe')(process.env.STRIPE_SECRET);
// requires stripe node module and passes in the secret key
```

> In order for this to work we'll need to make sure our stripe Secret Key is properly listed in `variables.env`
>
> https://dashboard.stripe.com/test/apikeys



We'll need to make stripe available to our `createOrder` mutation: `src/resolvers/Mutation.js`:

```js
const stripe = require('../stripe');
```



then we can go ahead and finish configuring the `createOrder` mutation:

```react
//3. Create the stripe charge (Convert Token into $$$ )
const charge = await stripe.charges.create({
  amount, // pass in the amount to charge
  currency: 'USD', // the currency to charge in
  token: args.token, // tokent that we pass in while processing from stripe.
})
```



Next we can test it and see if the submitted order now shows up with the correct amount in stripe testing:

![image-20190627124305326](http://ww4.sinaimg.cn/large/006tNc79ly1g4g6xyk17yj30o809hwfo.jpg)



Now that we have our website properly configured with stripe we can focus on saving the current order that was just completed to our database as an order. 

## Save Order

---------------------------------

We'll want to make sure we're giving each `OrderItem` the proper arguments, which we've defined in our `datamodel.graphql` file in the ==BACKEND==

![image-20190627125444131](http://ww3.sinaimg.cn/large/006tNc79ly1g4g7a0egj6j30kw07dabv.jpg)



So each `OrderItem`  will be an object with the properties above,  when we continue with our Mutation: `src/resolvers/Mutation.js`:

```js
    //4. Convert the CartItems to Orderitems
    const orderItems = user.cart.map(cartItem => {
      // grab each item from the cart
      const orderItem = {

      }
    })
```

> `orderItems` is an array of `orderItem` objects

```js
const orderItem = {
        quantity: cartItem.quantity, // grabs quantity from the cartItem
        user: {connect: {id: userId}}, //saves current loggedin user with orderItem
        ...cartItem.item // spread out the entire item from cartItem
      }
```

> `cartItem.item`: the rest of the fields we need from the item itself so we can just spread the item from the cartItem right in place. although there is one field we do not need, and that's the Item id, because we do not want our order items and our items to have any relationship to eachother in the database. But we do want our user to have an association to the orderItem, in the same process.
>
> so we can just manually remove the `item.id` from the `orderItem`, before we return the `orderItem` to the `orderitems` array:
>
> ```js
> const orderItems = user.cart.map(cartItem => {
> 	const orderItem = {
>         quantity: cartItem.quantity, 
>         user: {connect: {id: userId}}, // assigns user with orderItem 
>         ...cartItem.item,
>       };
>   delete orderItem.id; // manually removes orderItem.id (explictly)
>   return orderItem; // returns the entire orderItem,
> });
> ```
>
> > `orderItem` -  is an almost exact copy of `cartItem.item` with `user` and `quanitity` added to it for each item in the order. 





## Create Order

---------------------------------

Creating an order which is comprised on an array of `orderItems`, if we refer to our typeDefs from ==backend== `/datamodel.prisma`:

![image-20190627131642305](http://ww4.sinaimg.cn/large/006tNc79ly1g4g7wvfpckj309x046mx7.jpg)

We can clearly see that one of the required arguments is an arry that contains our OrderItem, whic is required(`!`).

```js
//5. Create the Order
const order = await ctx.db.mutation.createOrder({
  // create order creates an object with the following data:
  data: {
    total: charge.amount, // amount we get back after customer is charged
    // retain the id for the charge to associate with order, user, & orderItem
    charge: charge.id,
    items: { create: orderItems }, // creates an "item" for each orderItem
    user: { connect: { id: userId } }, // connects user that mactches id to the order.
  }
});
```



Next we'll want to make sure we clean up after ourselves handling operations like clearing the user's cart by deleting their `cartItems` which we've saved to the db as `orderItems` already. Once we handle the cleanup we can go ahead and return the `order` back to the client side:

```js
    //6. Clean up - clear the users cart, delete cartItems

    // grab all the ids of the items in the cart:
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      // remove all items from the cart whose ids are in `cartItemIds`
      where: {
        id_in: cartItemIds, // delete the ids that match.
      },
    });
    //7. Return the order to the client.
    return order;
```

> `deleteManyCartItems` - is a query available to us from prisma that takes in the id of any items we want deleted, 
>
> `id_in` - literally tells gaphql to find matching ids from a provided list, i.e. `cartItemIds` - which is an array of ids fo items in the cart that we want to remove.



so our completed mutation:

```js
async createOrder(parent, args, ctx, info) {
  // 1. Query the current user and make sure they are signed in
  const { userId } = ctx.request;
  if (!userId) throw new Error('You must be signed in to complete this order.');
  const user = await ctx.db.query.user(
    { where: { id: userId } },
    `{
        id
        name
        email
        cart {
        id
        quantity
        item { title price id description image largeImage }
		}}`			
  );

  // 2. recalculate the total for the price
  const amount = user.cart.reduce(
    (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
    0
  );
  console.log(`Going to charge for a total of ${amount}`);

  // 3. Create the stripe charge (turn token into $$$)
  const charge = await stripe.charges.create({
    amount, // pass in the amount to charge
    currency: 'USD', // the currency to charge in
    source: args.token, // tokent that we pass in while processing from stripe.
  })

  //4. Convert the CartItems to Orderitems
  const orderItems = user.cart.map(cartItem => {
    // grab each item in the cart, and add to orderItems[]
    const orderItem = {
      quantity: cartItem.quantity, // grabs quantity from the cartItem
      user: { connect: { id: userId } }, //assigns current loggedin user with orderItem
      ...cartItem.item // spread out the entire item from cartItem
    };
    delete orderItem.id; // manually removes orderItem.id (explictly)
    return orderItem; // returns the entire orderItem,
  })

  //5. Create the Order
  const order = await ctx.db.mutation.createOrder({
    // create order creates an object with the following data:
    data: {
      total: charge.amount, // amount we get back after customer is charged
      // retain the id for the charge to associate with order, user, & orderItem
      charge: charge.id,
      items: { create: orderItems }, // creates an "item" for each orderItem
      user: { connect: { id: userId } }, // connects user that mactches id to the order.
    }
  });
  //6. Clean up - clear the users cart, delete cartItems

  // grab all the ids of the items in the cart:
  const cartItemIds = user.cart.map(cartItem => cartItem.id);
  await ctx.db.mutation.deleteManyCartItems({
    // remove all items from the cart whose ids are in `cartItemIds`
    where: {
      id_in: cartItemIds, // delete the ids that match.
    },
  });
  //7. Return the order to the client.
  return order;
}
```





From the client-side ==frontend== we can make sure that we are able to log out the order after we've charged the customer, and saved the order. in order to handle this behavoir we're going to make our `onToken` method asynchronous:

```js
  onToken = async (res, createOrder) => {
    console.log('On Token Called!');
    console.log(res.id);
    // manually call the mutation once we have the stripe token
    const order = await createOrder({
      variables: {
        token: res.id,
      },
    }).catch(err => {
      alert(err.message);
    });
    console.log(order); // logging order after charged and saved
  };
```

> we've also made sure to save the result of the `createOrder` mutation to a variable called `order` 

Now if we place an order, not only does the client get charged:![checkout](http://ww3.sinaimg.cn/large/006tNc79ly1g4g92lutqpg30vw0m6he1.gif)

![image-20190627134933058](http://ww4.sinaimg.cn/large/006tNc79ly1g4g8v2n91gj30si0f7jui.jpg)

But we are also able to save that order to the database, which we can verify by visiting: 

https://app.prisma.io/gshah2020-4a9e06/services/prisma-us1/sick-fits/dev/databrowser

![image-20190627135012934](http://ww1.sinaimg.cn/large/006tNc79ly1g4g8vqhoapj30p90fzabn.jpg)

We can also see that we've got our `OrderItems` and all their associated fields  as well:

![image-20190627135049396](http://ww2.sinaimg.cn/large/006tNc79ly1g4g8wd658rj30jt06taah.jpg)



We can do some more quick cleanup in ==frontend==` components/Cart.js`:

We should be disabling the checkout button when the cart is empty as well:

```react
{me.cart.length && ( // removes checkout button if cart is empty
  <TakeMyMoney> 
    <SickButton>Checkout</SickButton>
  </TakeMyMoney>
)}
```


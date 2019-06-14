## Server-side Add To Cart

---------------------------------

We'll start in the ==BackEnd== with `/datamodel.prisma`:

We're going to create a new type called: `cart item` - this allows us to keep different properties on cart items, that we don't necc. need on our items themselves. `.i.e., "quantity"` would be a cart specific field or property - this new type will also be able to establish a relationship between the user and the items in their cart. 

```react
type CartItem {
  id: ID! @id @unique
  quantity: Int! @default(value: 1)
  item: Item! #relationship to item
  user: User! #relationship to user
}
```



In to establish the relationship of the cart item to a user, our `User` type, will also need a field called `cart`:

```react
  cart: [CartItem!]!
```



We also need to add this same cart field to our user type in `schema.graphql`, because we also want the same functionality client-side, and not only server-side:

```react
type User {
  id: ID!
  name: String!
  email: String!
  password: String!
  resetToken: String
  resetTokenExpiry: String
  permissions: [Permission!]!
  cart: [CartItem!]!
}
```



in order to add things to the cart we'll need a mutation to handle that behavior:

```react
addToCart(id: ID!): CartItem
```

> This mutation requires an ID, and returns a CartItem



Once this is done we can run:

```shell
yarn deploy
```



Which will update our schema on prisma and update our generated schema from prisma for us.



We still need to create  resolver for this mutation in: `src/resolvers/Mutation.js`

```react
  async addToCart(parent, args, ctx, info) {
    // 1. Check if user is signed in.
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in');
    }
    // 2. Query the users current cart
    // we're running a query for multiple items because, we need to query user & item ids
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },   // provides the usersId to the query
        item: { id: args.id },  // provides the item's Id to the query.
        // both ids must match, meaning the user has this item in their cart already.
      },
    })
    // 3a. if item already exists in cart increment by 1
    if (existingCartItem) {
      console.log('This item is already in the cart');
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id }, // match items by existing cart item id
        data: { quantity: existingCartItem.quantity + 1 } // when found increment by 1
      }, info)
    } else {
      return console.log('item not already in cart')
    }
    // 3b. if this item does not exist, create a new one with the value of 1
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId }, // establishes the relationship
        },
        item: {
          connect: { id: args.id }, // establishes the relationship
        },
      },
    }, info);

  },
```

> **NOTE**: The key here is that we needed to be able to not only query by both item and user id, but also be able to establish that relationship between the two, when it comes to items being in the cart. Everytime a cart item is created, that relationship is generated for us based on this mutation. 



Now we can create a new component `components/AddToCart.js`

here we can wire up the mutation to our addToCart button on the front end.

```react
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

class AddToCart extends Component {
  render() {
    const { id } = this.props
    return (
      <button>Add To Cart 🛒</button>
    )
  }
}

export default AddToCart;
```



Let's import this into `components/Item.js`:

```react
import AddToCart from './AddToCart';
```



And then we can render it out:

```react
<div className="buttonList">
  <Link href={{
      pathname: 'update',
        query: { id: item.id }
    }}>
    <a>Edit ✏️</a>
  </Link>

  <AddToCart id={item.id} />
  <DeleteItem id={item.id}>❌ Delete This Item</DeleteItem>
</div>
```

> **NOTE**: we've passed in the id prop needed to resolve our `ADD_TO_CART_MUTATION`

Now we can write our mutation that will give our button the functionality we need to add items to cart:

```react
const ADD_TO_CART_MUTATION = gql`
  mutation addToCart($id: ID!) {
    addToCart(id: $id) {
      id
      quantity
    }
  }
`;
```





Now we can render our mutation as a wrapper for our button so we can add items to the cart using this mutation:

```react
class AddToCart extends Component {
  render() {
    const { id } = this.props
    return (
      <Mutation
        mutation={ADD_TO_CART_MUTATION}
        variables={{ id }}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
      // refetchQueries takes in an array, and there's one query on that array.
      >
        {(addToCart, { loading }) => (
          <button onClick={addToCart} disabled={loading}>Add To Cart 🛒</button>
        )}

      </Mutation>
    )
  }
}

export default AddToCart;
```

> passing in the id, of the item, that gets passed down from props



Now if we click the addToCart button it will add our product to the cart, if the item doesn't exist, it will create a new cart item, but if it is already in the cart will will simply update the cart item incrementing its quantity by 1. 




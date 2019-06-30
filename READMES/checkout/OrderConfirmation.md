# Order review

---------------------------------

Currently we're just clearing the cart after the order completes and the customer has been charged successully, but instead we'd like to display the order details from the currently processed order to the customer upon a successful transaction

First thing to do is to create a page we can route the user to after they've completed the checkout process.

`pages/order.js`:

```jsx
import PleaseSignin from '../components/PleaseSignin';
// used to limited access to only users who ard signed in.

const Order = () => {
  return (
    <PleaseSignin>
     <p>This is a single Order!</p>
    </PleaseSignin>
  )
}

export default Order
```

> we've copied the guts of this from `pages/sell.js` and just output a <p> tag to test with



now we can go ahead and make sure we route the user when the transaction is compelted to our order page, to *review* their order details: ==FrontEnd== `components/TakeMyMoney.js`:

```js
  onToken = async (res, createOrder) => {
    NProgress.start() // using NProgress loading indicator
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
    // send customer to review order details after a successful transaction
    Router.push({
      pathname: `/order`, // route user to order page
      query: { id: order.data.createOrder.id },
      // use the id generated by createOrder to query for the rest of the order details
    })
  };
```

> **NOTE**: we've used `NProgress` to help indicate to the user that something is loading in the background.

Now that we're passing in an id via props to the new page, we'll see if we can access that id from the props:

```jsx
<PleaseSignin>
  <p>This is a single Order! {props.query.id}</p>
</PleaseSignin>
```

![image-20190627141501416](http://ww1.sinaimg.cn/large/006tNc79ly1g4g9lkj2v3j30ky03yjre.jpg)

Now we can take this id use it to query the order details and output them onto this page for the user to review their order.

for this we'll create a new component `components/Order.js`

```react
import React, { Component } from 'react'
import PropTypes from 'prop-types'

class Order extends Component {
  static propTypes = {
    id: PropTypes.string.isRequried,
  }

  render() {
    return (
      <div>
        
      </div>
    )
  }
}

export default Order

```

then we'll make sure to import it into the order page: `pages/order.js`:

```js
import Order from '../components/Order';
```

And make sure we're rendering it out passing in the id from props into our `Order` component:

```jsx
<Order id={props.query.id}/>
```



Now we can make sure we're outputting the id ensuring we have access to it from out new `Order`  component:

```jsx
<div>
  <p>Order ID: {this.props.id}</p>
</div>
```



Now that we have access to the `id` we can import and use our Query some of our other tools we're going to need for this component:

```js
import { Query } from 'react-apollo';
import { format } from 'date-fns';
import Head from 'next/head';
import gql from 'graphql-tag';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';
import OrderStyles from './styles/OrderItemStyles';
```



Before we go ahead and render any of these lets make sure we've setup the `Order` Query  in ==BackEnd== `src/schema.graphql`:

```js
order(id: ID!): Order!
```

> takes in an id which is non-nullable & require(`!`), and returns the `Order` which is also required(`!`)



Next we'll need to write the Query Resolver for the `Order` query:

```js
async order(parent, args, ctx, info) {
  //1. Make sure user is logged in
  //2. Query the current order.
  //3. Check if they have the permissiones to see this order.
  //4. Return the order.
}
```

```js
async order(parent, args, ctx, info) {
  //1. Make sure user is logged in
  if (!ctx.request.userId) throw new Error('Please log in');

  //2. Query the current order.
  const order = await ctx.db.query.order({
    where: { id: args.id },
  }, info)
  //3. Check if they have the permissiones to see this order.
  // does user own this order?
  const ownsOrder = order.user.id === ctx.request.userId;
  // does user have permission to view this order?
  const hasPermissionsToSeeOrder = ctx.request.user.permissions.includes('ADMIN');

  if (!ownsOrder || !hasPermissionsToSeeOrder) {
    throw new Error(`Sorry, You cant view this, because this is your order ${ownOrder}||and your permission ${hasPermission})`)
  }

  //4. Return the order.
  return order
}
```



==FRONTEND== `components/Order.js`:

We can now use the query we just wrote here to grab the details from the order to display for review:

```js
const SINGLE_ORDER_QUERY = gql`
  query SINGLE_ORDER_QUERY($id: ID!) {
    order(id: $id) {
      id
      charge
      total
      createdAt
      user {
        id
      }
      items {
        id
        title
        description
        price
        image
        quantity
      }
    }
  }
`;

```



Now we can wrap our returned jsx within our query component:

```jsx
<Query query={SINGLE_ORDER_QUERY} variables={{ id: this.props.id }}>
  {({ data, error, loading }) => {
    if (error) return <Error error={error} />;
    if (loading) return <p>Loading...</p>;
    const order = data.order;
    return (
      <p>Order ID: {this.props.id}</p>
    );
  }}
</Query>
```



And now we then we can make sure the rest of the data from our order gets rendered properly:

```jsx
<Query query={SINGLE_ORDER_QUERY} variables={{ id: this.props.id }}>
  {({ data, error, loading }) => {
    if (error) return <Error error={error} />;
    if (loading) return <p>Loading...</p>;
    console.log(data);
    const order = data.order;
    return (
      <OrderStyles>
        <Head>
          <title>Sick Fits - Order {order.id}</title>
        </Head>
        <p>
          <span>Order ID:</span>
          <span>{this.props.id}</span>
        </p>
        <p>
          <span>Charge</span>
          <span>{order.charge}</span>
        </p>
        <p>
          <span>Date</span>
          <span>{format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}</span>
          {/* using format helper fn to display pretty date. */}
        </p>
        <p>
          <span>Order Total</span>
          <span>{formatMoney(order.total)}</span>
          {/* using format helper fn to display pretty price. */}

        </p>
        <p>
          <span>Item Count</span>
          <span>{order.items.length}</span>
        </p>
        <div className="items">
          {/* loop over all order items and output each property: */}
          {order.items.map(item => (
            <div className="order-item" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div className="item-details">
                <h2>{item.title}</h2>
                <p>Qty: {item.quantity}</p>
                <p>Each: {formatMoney(item.price)}</p>
                <p>SubTotal: {formatMoney(item.price * item.quantity)}</p>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </OrderStyles>
    );
  }}
</Query>
```

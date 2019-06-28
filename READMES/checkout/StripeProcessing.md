# Card Processing with Stripe

---------------------------------

Signup for a stripe account: https://dashboard.stripe.com

React Compnent Docs: https://github.com/azmenak/react-stripe-checkout

> **Note**: will require email verification

then setup your account with an account name, and make sure that viewing test data in on, in development mode.

> This can be toggled off in live production, but should be kept off till then. 

See your API keys by visiting the developer tab from the sidebar:

> ![image-20190621190817038](http://ww2.sinaimg.cn/large/006tNc79ly1g49kcu6aw1j311o0hy77p.jpg)



Create a new component `components/TakeMyMoney.js` and handle all the imports we need:

```react
import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'next/router';
import Router from 'next/router';
import Nprogress from 'nprogress';
import gql from 'graphql-tag';
import calcTotalPrice from '../lib/calcTotalPrice';
import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';
```

```react

class TakeMyMoney extends Component {
  render() {
    return <User>{({ data: { me } }) => <p>{this.props.children}</p>}</User>
  }
}

export default TakeMyMoney;

```



next let's make sure `components/TakeMyMoney.js` is being rendered by `components/Cart.js`:

```react
import TakeMyMoney from './TakeMyMoney';
```

```react
<TakeMyMoney>
  <SickButton>Checkout</SickButton>
</TakeMyMoney>
```



Now instead of rendering out a p tag with our checkout component `components/TakeMyMoney`:

```react
class TakeMyMoney extends Component {
  render() {
    return <User>{({ data: { me } }) => <StripeCheckout>{this.props.children}</StripeCheckout>}</User>
  }
}
```

> At this point the checkout functionality already appears in a popup when we click checkout

Next we can get it to register the total amount from the cart using the props available from `react-stripe-checkout`, including all of the following:

```js
<StripeCheckout
  name="Three Comma Co." // the pop-in header title
  description="Big Data Stuff" // the pop-in header subtitle
  image="https://www.vidhub.co/assets/logos/vidhub-icon-2e5c629f64ced5598a56387d4e3d0c7c.png" // the pop-in header image (default none)
  ComponentClass="div"
  label="Buy the Thing" // text inside the Stripe button
  panelLabel="Give Money" // prepended to the amount in the bottom pay button
  amount={1000000} // cents
  currency="USD"
  stripeKey="..."
  locale="zh"
  email="info@vidhub.co"
  // Note: Enabling either address option will give the user the ability to
  // fill out both. Addresses are sent as a second parameter in the token callback.
  shippingAddress
  billingAddress={false}
  // Note: enabling both zipCode checks and billing or shipping address will
  // cause zipCheck to be pulled from billing address (set to shipping if none provided).
  zipCode={false}
  alipay // accept Alipay (default false)
  bitcoin // accept Bitcoins (default false)
  allowRememberMe // "Remember Me" option (default true)
  token={this.onToken} // submit callback
  opened={this.onOpened} // called when the checkout popin is opened (no IE6/7)
  closed={this.onClosed} // called when the checkout popin is closed (no IE6/7)
  // Note: `reconfigureOnUpdate` should be set to true IFF, for some reason
  // you are using multiple stripe keys
  reconfigureOnUpdate={false}
  // Note: you can change the event to `onTouchTap`, `onClick`, `onTouchStart`
  // useful if you're using React-Tap-Event-Plugin
  triggerEvent="onTouchTap"
  >
  <button className="btn btn-primary">
    Use your own child component, which gets wrapped in whatever
    component you pass into as "ComponentClass" (defaults to span)
  </button>
</StripeCheckout>
```



To actually get the total outputting we're ging to use the prop: `amount` from `react-stripe=checkout`;

```react
render() {
  return <User>{({ data: { me } }) => (
    <StripeCheckout
    // prop amount from react-stripe-checkout
    amount={calcTotalPrice(me.cart)}
  // uses custom calcTotal fn.
    >
      {this.props.children}
</StripeCheckout>
)}</User>
}
```

now that we have the total amount being passed into our stripe checkout component, we can use some of the other props available to pass along and output the data we need to complete the transaction:

```react
<StripeCheckout
// prop amount from react-stripe-checkout
amount={calcTotalPrice(me.cart)}
// uses custom calcTotal fn.
name="Sick Fits"
description={`Order of ${totalItems(me.cart)} items!`}
// calls totalItems which returns a count of all items in the cart.
>
{this.props.children}
</StripeCheckout>
```

> Now were passing along some additional data and logic, in this case, outputtin the count of total amount of records of.

```react
<StripeCheckout
  // prop amount from react-stripe-checkout
  amount={calcTotalPrice(me.cart)}
  // uses custom calcTotal fn.
  name="Sick Fits"
  description={`Order of ${totalItems(me.cart)} items!`}
  // calls totalItems which returns a count of all items in the cart.
  image={me.cart[0].item && me.cart[0].item.image}
  // grabs image from cart if cart item is found
  stripeKey="pk_test_8CFT10jR6SmGglT0nmRmouxm00UHXOR8UV"
  // passed in the stripe publishable key
  currency="USD"
  email={me.email}
  token={res => this.onToken(res)}
  // calls onToken fn
  >
  {this.props.children}
</StripeCheckout>
```

```react
onToken = (res) => {
  console.log('onToken 🔥', res)
}
```



Stripe gives us acess to a ton of test-credit-card numbers: https://stripe.com/docs/testing#cards

```js
4242424242424242	Visa
4000056655665556	Visa (debit)
5555555555554444	Mastercard
2223003122003222	Mastercard (2-series)
5200828282828210	Mastercard (debit)
5105105105105100	Mastercard (prepaid)
378282246310005	American Express
371449635398431	American Express
6011111111111117	Discover
6011000990139424	Discover
30569309025904	Diners Club
38520000023237	Diners Club
3566002020360505	JCB
6200000000000005	UnionPay
```

> see link above for more options.

![image-20190626005503844](http://ww4.sinaimg.cn/large/006tNc79ly1g4eguxlp1kj30bc0ef761.jpg)

![image-20190626010005407](http://ww4.sinaimg.cn/large/006tNc79ly1g4eh04lokuj30830300sy.jpg)

> Clicking pay returns the success response in the console
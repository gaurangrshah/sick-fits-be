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

Next we can get it to register the total amount from the cart:

```js

```


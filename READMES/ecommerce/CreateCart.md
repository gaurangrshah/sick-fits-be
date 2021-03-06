## Create a Cart

---------------------------------

Create a new component `src/components/Cart.js`:

```react
import React from 'react';
import CartStyles from './styles/CartStyles';
import Supreme from './styles/Supreme';
import CloseButton from './styles/CloseButton';
import SickButton from './styles/SickButton';

const Cart = () => {
  return (
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
}

export default Cart
```

> **NOTE**: `open` prop will slide cart on and off-screen when boolean value changes. 

 then render it via `src/components/Header.js`:

```react
import Cart from './Cart';

/* ... */


<div className="sub-bar">
  <p>Search</p>
</div>
<Cart />
```


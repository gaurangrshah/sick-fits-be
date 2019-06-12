## React Meets GraphQL

Now that we have Apollo setup and configured, we can turn our focus towards the applicaiton and handle some of the basic routing we'll need:

create a new file: `pages/items.js`

```react
import Home from './index';

export default Home;
```



Then we need to update our Nav.js file to add our items link for the shop: 

```react
import Link from 'next/link';
import NavStyles from './styles/NavStyles';

const Nav = () => {
  return (
    <div>
      <NavStyles>
        {/* nav links */}
        <Link href="/items"><a>Shop</a></Link>
        <Link href="/sell"><a>sell</a></Link>
        <Link href="/signup"><a>Signup</a></Link>
        <Link href="/orders"><a>Orders</a></Link>
        <Link href="/me"><a>Account</a></Link>
      </NavStyles>
    </div>
  )
}

export default Nav

```



Next we'll need to make a new component: `components/Items.js`

```react
import React, { Component } from 'react'
import { Query } from 'react-apollo'
// query allows us to query from our database. 

export default class Items extends Component {
  render() {
    // return a simple string. 
    return (
      <div>
        <p>items!</p>
      </div>
    )
  }
}

```



Now import & render <Items/> from `components/Items.js` to `index.js`:

```react
import Items from '../components/Items';

const Home = props => {
  return (
    <div>
      <Items />
    </div>
  )
}

export default Home

```



Now that we have our Items component rendering we'll want to setup our first query from react in `components/Items.js`

First import `gql`  - used to run tagged template literal queries: 

```react
import gql from 'graphql-tag';
// allows us to define queries in javascript using tagged template literals.
```

Basic strategy is to define the query into one file where you essentially need it, and the export from that file, to make it avialble to other files if needed. 

So we can define our first query here, and we'll be able to export it from here, if we need to:

```sql
const ALL_ITEMS_QUERY = gql`
  query ALL_ITEMS_QUERY {
    
  }
`
```

> **NOTE**: we've named our query and the query variable with the same name so as to keep them associated, We'll find having to name a query and variable two different things can get out of hand very quickly in more complex projects. 

Now within our query we can define the fields we want to query as we would in the graphql playground:

```sql
const ALL_ITEMS_QUERY = gql`
  query ALL_ITEMS_QUERY {
    items {
      id
      title
      price
      description
      image
      largeImage
    }
  }
`
```



We'll be using `render-props` to export and share this query, apollo also has a high order component we can use but that will not give us error handling or any loading states. 

```react
<Query query={ALL_ITEMS_QUERY}>
  {
    (payload) => {
      console.log(payload);
      return <p>Hey Im the Child from query.</p>
    }
  }
</Query>
```



>  in the render props pattern we use the Query component to render our query, by rendering a function as a child, that handles our payload from the query. 
>
> - the <Query/> takes a prop, which is the query we want to render from: `ALL_ITEMS_QUERY`

We can see the results of the log statement above in the image below:

![image-20190609002403272](http://ww1.sinaimg.cn/large/006tNc79ly1g3usfdzb6ij30ql06tt9w.jpg)



now there are a few items we're interested in off teh payload object, so we'll actually destructure them inline here:

```react
// (payload) => {
({ data, error, loading }) => {
  console.log('payload:', { data, error, loading });
  return <p>found {data.items.length} items</p>
}
```



We can also take advantage of the error/loading handling here as well:

```react
({ data, error, loading }) => {
  console.log('payload:', { data, error, loading });
  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  return <p>found {data.items.length} items</p>
}
```



Next up we'll just handle some styling:

```react
import styled from 'styled-components';

const Center = styled.div`
  text-align: center;
`
```



We'll replace our div tag with the new Center component:

```react
<Center>
  <p>items!</p>
  <Query query={ALL_ITEMS_QUERY}>
    {
      // (payload) => {
      ({ data, error, loading }) => {
        console.log('payload:', { data, error, loading });
        if (loading) return <p>Loading...</p>
        if (error) return <p>Error: {error.message}</p>
        // console.log(data.items.length);
        return (<p>found {data.items.length} items</p>)
      }
    }
  </Query>
</Center>
```



We can also style the <ItemsList/>

```react
const ItemsList = styled.div`
  display: grid;
  grid-auto-columns: 1fr 1fr;
  grid-gap: 60px;
  max-width: ${props => props.theme.maxWidth };
  /* pulls in the max-width fromour global styles defined earlier */
`
```



Lastly we can apply this style and render out our list of items, by mapping over it:

```react
return (
  <ItemsList>
    {data.items.map(item => <p>{item.title}</p>)}
  </ItemsList>
)
```



Now that we have the list rendering, we will turn our focus on to the layout of each individual item - create a new file `components/Item.js`:

```react
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Title from './styles/Title';
import ItemStyles from './styles/ItemStyles';
import PriceTag from './styles/PriceTag';

export default class Item extends Component {
  static propTypes = {
    item: PropTypes.share({
      item: PropTypes.object.isRequired
    })
  }

  render() {
    const {item} = this.props;
    return (
      <ItemStyles>
        <Title>{item.title}</Title>
      </ItemStyles>
    )
  }
}

```



now we can import the new created Item.js component back into Items.js:

```react
  render() {
    const { item } = this.props;
    return (
      <ItemStyles>
        <Title>
          <Link>
            <a>{item.title}</a>
          </Link>
        </Title>
      </ItemStyles>
    )
  }
```

> here we ensure we'll rendering the data we get back from the mapped array. 



Next we can setup our Link component to grab the route path from the query parameters:

```react
<Link href={{
    pathname: '/item',
      query: {id: item.id}
  }}>

  <a>{item.title}</a>

</Link>
```



Next we'll import a formatMoney utitlity function located in `lib/formatMoney.js`

```react
import formatMoney from '../lib/formatMoney';
```



And then we can use this properly render our price as U.S. currency:

```react
<PriceTag>
  {formatMoney(item.price)}
</PriceTag>
<p>{item.description}</p>
<div className="buttonList">
  <Link href={{
      pathname: 'update',
        query: { id: item.id }
    }}>
    <a>Edit ✏️</a>
  </Link>
</div>
```

We've also created another link for our edit button and editor endpoint for this item. 

Let's also add an `Add To Cart` & `delete item`  button

```react
        <div className="buttonList">
          <Link href={{
            pathname: 'update',
            query: { id: item.id }
          }}>
            <a>Edit ✏️</a>
          </Link>
          <button>Add To Cart</button>
          <button>Delete Item</button>
        </div>
```



next we can add a conditional render for our image if we have one for this content:

```react
    return (
      <ItemStyles>
        {item.image && <img src={item.image} alt={item.title} />}
        <Title>
```




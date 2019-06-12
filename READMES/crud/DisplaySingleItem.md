## Displaying Single Items 

in order to setup the single item page, we'll want to make sure we have our single item query ready — we've already defined it in: backend: `src/schema.graphql`

```react
item(where: ItemWhereUniqueInput!): Item
```



Next we can make a new page on the frontend: `src/pages/item.js`

```react
import React, { Component } from 'react'

const item = () => {
  return (
    <div>
      <p>Single Item Page</p>
    </div>
  )
}
export default item
```



Next we can make our SingleItem component: `src/components/SingleItem.js`

```react
import React, { Component } from 'react'

class SingleItem extends Component {
  render() {
    return (
      <div>
        Single Item Component
      </div>
    )
  }
}

export default SingleItem;
```



Next we can import the SingleItem component into `src/pages/item.js`:

```react
import React, { Component } from 'react'
import SingleItem from '../components/SingleItem';

const item = () => {
  return (
    <div>
     
      <SingleItem id={props.query.id} />
     
    </div>
  )
}
export default item
```

> passed in the id that we'll need in order to query for and render the item.  available to us via pageProps



Next let's define that query that handles displaying of the product in the SingleItem component:

```sql
const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    # requires an ID! arg, and returns:
    id
    title
    description
    largeImage
  }
`;

```



Now we can import the Query component from `react-apollo`

```react
import { Query } from 'react-apollo';
```

and then use the Query component to query for and to render our item:

```react
<Query
  query={SINGLE_ITEM_QUERY}
  variables={{
    id: this.props.id,
  }}
  >
  {({ error, loading, data }) => {

    if (error) { return <Error error={error} /> }
    if (loading) { return 'loading...' }
    if (!data.item) { return <p>No Item Found for {this.props.id}</p> }
    console.log(data);

    return <p>Single Item Component {this.props.id}</p>
  }}

</Query>
```

> We've also imported the <Error/> to aid with error handling. 



next we can handle any of the details related to renderin out our item from the data tha we get back & instead of returning just a p tag, we can render out or SingleItem component:

```react
 return (
   <SingleItemStyles>
     <Head>
       <title>Sick Fits | {item.title}</title>
       {/* adds title to document head when this page is loaded.  */}
     </Head>
     {/* handle displaying item properties on to the page: */}
     <img src={item.largeImage} alt={item.title} />
     <div className="details">
       <h2>Viewing {item.title}</h2>
       <p>{item.description}</p>
     </div>
   </SingleItemStyles>
 )
```





We've also defined some styles for this component:

```react
const SingleItemStyles = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  box-shadow: ${props => props.theme.bs};
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  min-height: 800px;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .details {
    margin: 3rem;
    font-size: 2rem;
  }
`;
```


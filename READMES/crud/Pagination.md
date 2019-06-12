## Pagination

In order to handle our pagination, first we'll want to make sure we have a few products in our database. (6-7) 

Curerntly we have two `types` of `Queries` in our database:

- items
- users

When dealing with larger datasets, `prisma` exposes `connections` in the generated `prisma.graphql` file: 

![image-20190611154221114](http://ww2.sinaimg.cn/large/006tNc79ly1g3xu7kbk0cj30ke062408.jpg)

> Prisma auto-generates `usersConnection`  && `itemsConnection` which return aggregate data about the data itself. Things like how many items and of what type, etc. This is where connections shine allowing us to easily filter thru data. 

We'll need to define these connections for our own schema: ==BackEnd== `src/schema.graphql`

```react
  itemsConnection(where: ItemWhereInput): ItemConnection!
```

> we've defined the items connection which takes in one input: `where` and returns: `ItemConnection` - which is required.



Next we'll have to setup the resolver for the itemsConnection query type: 

```react
  itemsConnection: forwardTo('db'),
```



now we can test this in our playground: 

```sql
query dataAboutItems{
  itemsConnection {
    aggregate{
      count
    }
  }
}
```

> **NOTE**: we'll encounter three graphql utilities for data aggregation queries in the playground as we enter the query: 
>
> - `edges`: used to determine the last item show in a list, - used for infinite scroll type of pagination. 
> - `pageInfo`: used in order to display traditional pagination and query information metrics from the page itself. 
> - `aggregate`: allows us to customize the query and the calcuation.

but in the end it will return: 

```sql
{
  "data": {
    "itemsConnection": {
      "aggregate": {
        "count": 6
      }
    }
  }
}
```

> We could also modify this query to find a specific set of items with a keyword:
>
> ```sql
> query dataAboutItems{
>   itemsConnection(where: {title_contains: "as"}) {
>     aggregate{
>       count
>     }
>   }
> }
> ```
>
> here we're able to query for all titles that contain the characters "as"
>
> - 💡this would also be useful when paginating by categories. 



Create a new component ==FrontEnd== `src/components/Pagination.js`:

```react
import React from 'react';
import gql from 'graphql-tag';
import PaginationStyles from './styles/PaginationStyles';

const Pagination = props => (
 <PaginationStyles>
   <p>Hey Pagination</p>
 </PaginationStyles>
);

export default Pagination;

```



Then import pagination into `src/components/Items.js`:

```react
import Pagination from '/Pagination';
```



We'll actually render two instances outside of the Query component, so that we get one on the top and bottom of our pages:

```react
return (
      <Center>
        <Pagination />
    
        <Query query={ALL_ITEMS_QUERY} variables={{
            skip: this.props.page * perPage - perPage || 0,
            first: perPage || 6,
          }}
        >
          
          {/* ... */}
            
        </Query>
    
        <Pagination />
      </Center >
    )
```



Now we can work on the query for the pagination in `src/components/Pagination.js`:

```sql
const PAGINATION_QUERY = gql`
  query PAGINATION_QUERY {
    itemsConnection {
    #pulling the count (# of items) from aggregate:
      aggregate {
        count
      }
    }
  }
`;
```



Now we can use the query to render our Query component:

```react
<PaginationStyles>
  <Query query={PAGINATION_QUERY}>
    {({ data, loading, error }) => {
      if (loading) return <p>Loading...</p>;
      return <p>Hey Pagination-  {data.itemsConnection.aggregate.count}</p>
    }}
  </Query>
</PaginationStyles>
```

> we've rendered the count to the DOM to ensure we're able to access the query. 

Now let's use the count to determine how many pages we have, based on our perPage count:

```react
 {({ data, loading, error }) => {
   
   if (loading) return <p>Loading...</p>;
   
   const count = data.itemsConnection.aggregate.count; 
   // referencing the db's aggregate count
   
   const pages = Math.ceil(count / perPage); 
   // references the variable imported from `config.js`
        
   return <p>Page 1 of {pages}</p> 
        // output pages.
 }}
```



Now we can pass down the page number that we're on, via a prop from `src/pages/index.js` to `src/components/Items.js`

```react
 <Items page={props.query.page} />
```



Now we can pass in the current page value into the Pagination component from : `src/components/Items.js`

```react
<Pagination page={this.props.page} />
// remember to update both instances on the page:
<Pagination page={this.props.page} />
```

> We can immediately see it being passed down:
>
> ![image-20190611162617131](http://ww4.sinaimg.cn/large/006tNc79ly1g3xvh71fktj30ae0a1mxv.jpg)
>
> currently it's being passed down as a string which is an issue - we can fix that in `src/pages/index.js`: 
>
> ```react
> <Items page={parseFloat(props.query.page) || 1} />
> ```
>
> **NOTE**: parse float will convert the value to an integer before passing it down. And we're going to make sure we're always atleast passing down that they're on the first page otherwise might have trouble with url params at times. 



Next up we can render out the links we'll need to navigate via our pagination component:

```react
<Link prefetch href={{
    pathname: 'items',
      query: { page: page - 1 },
        // will subtract  from the current page.
  }}>
  {/* back button label */}
  <a className="Prev" aria-disabled={page <= 1}>⬅ Prev</a>
</Link>

<p>{page} of {pages}</p>
<p>{count} Items Total</p>

<Link prefetch href={{
    pathname: 'items',
      query: { page: page + 1 },
        // will subtract  from the current page.
  }}>
  {/* back button label */}
  <a className="Next" aria-disabled={page >= pages}>Next ➡</a>
</Link>
```

> **NOTE**: links will have the `prefetch` attribute, which will pre-render those links before the user even clicks, to give user more instantaneous loads. 

![image-20190611170152006](http://ww2.sinaimg.cn/large/006tNc79ly1g3xwi8iv0nj30be02lt8m.jpg)



Now we can use the page value from props to help use fill in the statement of which page users are actually on:

```react
return <p>{props.page} of {pages}</p> // output pages.
```



We can also import the Head component and set the title of the window to also display what page we're on:

```react

```







Next we can op

en: ==backend== `src/schema.graphql` — here we'll want to modify the `items` query. 

> ```react
> items: [Item]!
> ```
>
> Currently our `items` query will return all of our items in the database, we have no way to specify any criteria, like which items, or how many, etc. — which is typically done by defining `args` for the query.

We'll modify this query to allow us to handle pagination:

```react
items(where: ItemWhereInput, orderBy: ItemOrderByInput, skip: Int, first: Int): [Item]!

```

> - `where` 	- allows us to search for a specific item.
> - `orderBy`  - used for sorting
> - skip            - takes an `Int` as an arg, and will skip that # of items.
> - first             - grabs the first item in the list. 



Now we can switch over to the ==frontend== `src/components/Items.js`

here we'll want to use the args we just added to the query and make sure we add them to the `ALL_ITEMS_QUERY` declaration:

```react
import {perPage} from '../config'
// perPage is a variable that references the number: 4


const ALL_ITEMS_QUERY = gql`
  query ALL_ITEMS_QUERY($skip: Int=0, $first: Int=${perPage}) {
    items(first: $first, skip: $skip, orderBy: createdAt_DESC) {
      id
      title
      price
      description
      image
      largeImage
    }
  }
`;
```

> We've imported the variable `perPage` which helps us in defining the arg for the variable `first` in the query declaration. 
>
> Each expected variable has it's type defined and a default set. 
>
> Then the args get passed into the actual query parameters, referencing the variables for each one, and lastly we have the same output fields declared.



Now let's use the args that we defined in the query and use those variables to pass in some criteria for our Query component:

```react
<Query query={ALL_ITEMS_QUERY} variables={{ skip: 1, first: 2 }}>
 
  {
    // (payload) => {
    ({ data, error, loading }) => {
      console.log('payload:', { data, error, loading });
      if (loading) return <p>Loading...</p>
      if (error) return <p>Error: {error.message}</p>
      // console.log(data.items.length);
      return (
        <ItemsList>
          {data.items.map(item =>
             <Item item={item} key={item.id} />
           )}
        </ItemsList>
      )
    }
  }
</Query>
```

> We've passed in values for the variables `$skip` and `$first`, based on our current settings above, we'll be skipping the first item, out of the first 2 items returned, and then return the leftover 1 item. 



Next up we'll make these values more extensible by using props to define & initialize them in the Query component:

```react
<Query 
  query={ALL_ITEMS_QUERY} 
  variables={{
    skip: this.props.page * perPage - perPage || 1,
      // first: perPage || 4,
  }}
  >
```

> in the end we've actually removed the `first` variable from getting passed into  the Query, because it is already being set from inside the query definition itself, no reason to set it twice.  



Now this works for us, but we do see an issue, when a new item gets added, it is not immediately being fetched for us. To deal with this problem we'll look at a few ways:

```react
<Query
  query={ALL_ITEMS_QUERY}
  // fetchPolicy="network-only"
  variables={{
    skip: this.props.page * perPage - perPage || 1,
  }}
  >
```

> setting fetchPolicy = 'network-only', works, but this is not an ideal solution, because in this implementation we're not using the cache for this purpose at all, by specifying network only, we're saying don't fetch the data from anywhere else but the db via the network. 



Another method is to use something called `refetchQueries`  as a prop, where we can pass in an array of queries that need to refresh themselves based on the server. 

This can be applied from `src/components/CreateItem.js`

```react
<Mutation 
  // refetchQueries={} 
  mutation={CREATE_ITEM_MUTATION} 
  variables={this.state}
  >

```

> the issue with this approach is that all of our args must be passed into here, so if we want to sort items or skip items we can't change that extensibly as we have it now to be able to set those settings via props. 
>
> **NOTE**: this gets applied on the mutation in `CreateItem.js` not in the query of `Items.js`

Currently this is an issue with Apollo, and the solution would normally be to remove the item that changed from the cache which will immediately trigger a refetch for that data, to see if there are any updates. But this is something that they are still figuring out with apollo. 




## DELETE ITEM FROM DB

create new file: `src/components/DeleteItem.js`

```react
import React, { Component } from 'react'

class DeleteItem extends Component {
  render() {
    return (
      <button>
        {this.props.children}
      </button>
    )
  }
}
export default DeleteItem;

```



And then let's just make sure its being rendered where we need, so let's import it into `Item.js`:

```react
import DeleteItem from './DeleteItem';
```



And let's make sure we're rendering it:

```react
<div className="buttonList">
  <Link href={{
      pathname: 'update',
        query: { id: item.id }
    }}>
    <a>Edit ✏️</a>
  </Link>

  <button>Add To Cart</button>
  <DeleteItem id={item.id}>❌ Delete This Item</DeleteItem>
</div>
```

> **NOTE**: we've passed in the `id` of the item to be removed via props, and will be accessible by the `DeleteItem` component via `props.id`

Now we can switch gears to the backend and take care of our query and resolver for removing an item:

`src/schema.graphql`

```react
  deleteItem(id: ID!): Item
```

> for deleteItem we could've just returned an string as a success message, but we've kept returning back the item to confirm which item got deleted.



Now let's setup the mutation for deleting and item: `src/resolvers/mutation.js`

```react
async deleteItem(parent, args, ctx, info) {
    // defining the where variable, referencing it to args.id (the id that gets passed in as an arg)
    const where = { id: args.id };

    //1. find the item
    const item = await ctx.db.query.item({ where }, `{id title}`)
    // passing in the where variable and  raw graphql template that defines what we want returned to maKe sure we get atleast the id / title back o fthe removed item. -- sometimes there can be issues, so we are making sure to be explicit.

    //2. TODO: check privileges (make sure person is allowed to delete this item)

    //3. delete item.
    return ctx.db.mutation.deleteItem({ where }, info);
    // once again passing in info as the 2nd arg to this mutation as well.
```

> - deleteItem is a `aysnc` function —  
> - we'll need ot define the `where` variable which will get assigned to the `id` that gets passed into args. 
>
> - We assign the `id` & `title` from the item that gets returned back to the `item` variable.
> - TODO: we'll need to come back and check user privileges once users are setup
> - finally we are able to remove the item, by referencing it via ctx.db, passing in the where argument with info as the 2nd arg. 



Now we can go back to `DeleteItem.js` & import the `Mutation` component from apollo, so we can handle our DeleteItem mutation && the `gql` tag from `graphql` to be able to define that mutation in this file:

```react
import {Mutation} from 'react-apollo'
import gql from 'graphql-tag';
```



Next let's define our Mutation here:

```sql
const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    # requires an ID!
    deleteItem(id: $id) {
      #passes in the id referenced by the $id variable defined above.
      id
    }
  }
`
```



Next we can add the mutation logic to our render method:

```react
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    # requires an ID!
    deleteItem(id: $id) {
      #passes in the id referenced by the $id variable defined above.
      id
    }
  }
`;

class DeleteItem extends Component {
  render() {
    return (
      <Mutation mutation={DELETE_ITEM_MUTATION} variables={{ id: this.props.id }}>
        {/* grabbing the 'id' of the item to be removed from props. */}

        {/* function takes in the mutation and any errors: */}
        {(deleteItem, { error }) => (

          <button onClick={() => {
            // ask for confirmation.
            if (confirm('Are you sure?')) {
              deleteItem().catch(err => {
                alert(err.message);
              });
            }
          }}
          >
            {this.props.children}
            {/* this.props.children is just displaying the button label from parent */}
          </button>

        )}
      </Mutation>
    );
  }
}
export default DeleteItem;
```



Now we can go ahead and remove and item, we should get an alert that confirms that we want to delete, and once we accept the item gets removed from the DB, but it does not immediately get taken off the page, as we do not case a refresh when this occurs, and the item will be in our cache. We can manually reload the page to see the updated item, or we can add an update method that will update the cache. 

Let's define an update function so we don't have to manually refresh our page, first we'll setup the update prop on our Mutation component:

```react
<Mutation
  mutation={DELETE_ITEM_MUTATION}
  variables={{ id: this.props.id }}
  update={this.update}
  // triggering update method
 >
```

 

Setup the update method which will require the `ALL_ITEMS_QUERY` we exported from `Items.js` so let's import that first:

```react
import {ALL_ITEMS_QUERY} from './Items'
```



Now let's handle the update method, and ensure that it removes the correct deleted item from the cache, which should remove it from our page:

```react
update = (cache, payload) => {
  // update method has access to the cache and payload -- and allows us to access cache

  // 1. read items for items we want
  const data = cache.readQuery({ query: ALL_ITEMS_QUERY });
  // use the ALL_ITEMS_QUERY to access all the items we have in cache.
  console.log(data);


  // 2. filter deleted item out of cache
  data.items = data.items.filter(item => item.id !== payload.data.deleteItem.id)
  // removes the item that matches the id of the deleted item from the payload

  // 3. return new cache
  cache.writeQuery({query: ALL_ITEMS_QUERY, data});
}
```



Now when we delete an item it will automatically get removed from our database and our cache, which will also remove it from the page. 
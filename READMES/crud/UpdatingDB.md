## UpdatingDB

We going to take a look at how we can edit and update items that are in our database. We'll start off in the backend `src/schema.graphql` 

We'll need to do two things here: 

- a mutation that handles the updating of the item. 

- query for single item - which will allow us to click edit and obtain the current information about that item in our form. 

  

```react
updateItem(id: ID!, title: String, description: String, price: Int): Item!
```

> Our mutation for updating items, **NOTE**: that we do not require any of the fields other than the ID, because we are updating, we may only want to update one field, and requiring the others means we'd have to handle that logic. Instead by leaving them unrequired, we can only pass in the information we need to update. 



Next let's handle our updating query:

````react
item(where: ItemWhereUniqueInput!): Item
````

> **NOTE**: we are not requiring that we get an item back, if we did that would mean that we'd throw an error any time we queried for an item that didn't exist.
>
> `ItemWhereUniqueInput` - refers to any unique input that can be used to reference this item. In our case that is our id, — the above schema is actually defined for us already in `src/generated/prisma.graphql` but if we wanted to diverge and only allow our items to be queried by id we could also do something like:
>
> ```react 
> item(id: ID!): Item
> ```
>
> This would also work, but is not flexible and will not allow for any divergences. 



Next we'll need to write some resolvers for our `item` query and our  `updateItem` mutation we just defined.

`src/resolvers/Query.js`:

```react
  items: forwardTo('db'),
```

> just added the `item` query and forwarded any requests for it to the db.  — we can do this as long as there is no additional logic required. 



We can then test our query in the playground: 

```sql
query SINGLE_ITEM{
  item(where: {id: "cjwo9meup65460b12r8c9k90o"}) {
    title
    description
    id
  }
}
```

> Which should return:
>
> ```sql
> {
>   "data": {
>     "item": {
>       "title": "test",
>       "description": "desc",
>       "id": "cjwo9meup65460b12r8c9k90o"
>     }
>   }
> }
> ```



Next let's write the resolver for `updateItem` mutation `src/resolvers/Mutation.js`:

```react

  updateItem(parent, args, ctx, info) {
    // create copy of any updates:
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
 // ctx - is the context we get back from the request, db is the reference to our prisma db.
    return ctx.db.mutation.updateItem({
      // tack on the updates variable which we created from the copy of ...args
      data: updates,
      where: {
      // referencing the id of the item we want to update.   
        id: args.id
      },
		}, info); 
    // passed in info as the 2nd arg to udpateitem -- tells updateItem what to return.
  },
```

> here we've defined the mutation that we'd like to occur when an item is updated. **NOTE**: we've removed the id field from the submitted data, because we're not updating the id field itself, just any of the other data we've updated - that belongs to that particular id. 



Now we can transition over to the frontend - create a new file: `src/components/UpdateItem.js`

(this file will be a copy of CreateItem.js):

```react
import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
// importing Query which allows us to query for data.

import gql from 'graphql-tag';
import Router from 'next/router';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';
// has built-in error message handling and formatting

const SINGLE_ITEM_QUERY = gql`
# query for single items.
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      #returns:
      id
      title
      description
      price
    }
  }
`;
const UPDATE_ITEM_MUTATION = gql`
# first part is equivalent to a function call
  mutation UPDATE_ITEM_MUTATION($id: ID!, $title: String, $description: String, $price: Int) {
  # set types for each arg. and/or variables for each field

    updateItem(id: $id, title: $title, description: $description, price: $price) {
      # placeholders for content to be returned after submission
      # each assigned to a variable('$' - from template tags) of the same name -
      # '$' represents a variable, and reference the title string passed in in the above argument
      # references the items from the mutation defined in Mutation.js
      id
      title
      description
      price
    }
  }
`;

class UpdateItem extends Component {

  state = {};
  // state is a blank object, and will get any updated fields added.

  handleChange = e => {
    const { name, type, value } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    // corecing any inputs of type number to numerical values before setting state.
    console.log('UpdateItemChange', { name, type, value })
    this.setState({ [name]: val });
  };

  updateItem = async (e, updateItemMutation) => {
    e.preventDefault();
    console.log('UPDATE_ITEM_MUTATION', this.state);
    const res = await updateItemMutation({
      variables: {
        id: this.props.id,
        ...this.state,
      },
    });
    console.log('Updated!!');
  };

  render() {
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id, }}>
        {/* Query component runs the SINGLE_ITEM_QUERY with the id from props */}

        {({ data, loading }) => {
          // destructure data & loading off of the payload from apollo, and return the rest of our component including the mutation:
          console.log('🚧', data);

          (loading) ? <p>Loading...</p> : null;
          // once loaded then:
          (!data.item) ? <p>No Data Found for this item {this.props.id}</p> : null

          return (

            <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
              {(updateItem, { loading, error }) => (
                <Form onSubmit={e => this.updateItem(e, updateItem)}>
                  <Error error={error} />
                  <fieldset disabled={loading} aria-busy={loading}>

                    {/* using the defaultValue prop because we don't want to save all this data to state, only the data for any fields that get changed will get set to state. */}

                    <label htmlFor="title">
                      Title
                      <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Title"
                        required
                        defaultValue={data.item.title}
                        onChange={this.handleChange}
                      />
                    </label>

                    <label htmlFor="price">
                      Price
                      <input
                        type="number"
                        id="price"
                        name="price"
                        placeholder="Price"
                        required
                        defaultValue={data.item.price}
                        onChange={this.handleChange}
                      />
                    </label>

                    <label htmlFor="description">
                      Description
                      <textarea
                        id="description"
                        name="description"
                        placeholder="Enter A Description"
                        required
                        defaultValue={data.item.description}
                        onChange={this.handleChange}
                      />
                    </label>
                    <button type="submit">Sav{loading ? 'ing' : 'e'} Changes</button>
                  </fieldset>
                </Form>
              )}
            </Mutation>
          );
        }}
      </Query>
    );
  }
}

export default UpdateItem;
export { UPDATE_ITEM_MUTATION };
```

> **NOTE**: that the mutation and query components are used to wrap our form and encompass all of it's fields.

then let's create a new file: `src/pages/update.js` & import the <UpdateItem/>

```react
import UpdateItem from '../components/UpdateItem';

const Update = ({ query }) => (
  <div>
    <UpdateItem
      id={query.id}
    />
  </div >
)

export default Update;
```

> **NOTE**: route params are available to us on each from getInitialProps defined in `_app.js`, because we've exposed: `pageProps.query = ctx.query` — this let's us access the query context from the route on each page.

 








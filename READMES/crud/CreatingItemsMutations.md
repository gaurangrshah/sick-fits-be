## CreatingItemsMutations

We'll first need a form, wired up for the fields we weant to submit for our item:

create a new file: `components/CreateItem.js`:

```react
import React, { Component } from 'react'
import { Mutation } from 'react-apollo';
// allows us to run mutations from javascript to interface with graphQL db.

import Form from './styles/Form'
import formatMoney from '../lib/formatMoney';
```

```react
class CreateItem extends Component {

  state = {
    title: '',
    description: '',
    image: '',
    largeImage: '',
    price: 110,
  }

  handleChange = (e) => {
    const { name, type, value } = e.target
    const val = type === 'number' ? parseFloat(value) : value;
    // corecing any inputs of type number to numerical values before setting state.
    console.log('handleChange', { name, type, value })
    this.setState({ [name]: val })
  }

  render() {
    return (
      <Form onSubmit={(e) => {
        e.preventDefault();
        e.persist()
        console.log(e);
      }}>
        <fieldset>
          <label htmlFor="title"> Title
            <input type="text" id="title" name="title" placeholder="title" value={this.state.title} onChange={this.handleChange} required />
          </label>
          <label htmlFor="price"> Price
            <input type="number" id="price" name="price" placeholder="price" value={this.state.price} onChange={this.handleChange} required />
          </label>
          <label htmlFor="description"> Description
            <textarea type="textarea" id="description" name="description" placeholder="Enter a Description" value={this.state.description} onChange={this.handleChange} required />
          </label>
          <button type="submit">Submit</button>
        </fieldset>
      </Form>
    )
  }
}

export default CreateItem;
```





Now that we have our form data submitting and able to log to the console, we'll need to write a query for our mutation, so that we can communicate this data with our graphql db in order to add a new item:

import `gql` to be able to write our graph ql query in this file. 

```react
import gql from 'graphql-tag';
```

```sql
const CREATE_ITEM_MUTATION = gql`

# first part is equivalent to a function call:
  mutation CREATE_ITEM_MUTATION (
      # set types for each arg. and/or variables for each field
    
      $title: String!
      $description: String!
      $price:Int!
      $image:String
      $largeImage:String
  ) {

		createItem(
      # placeholders for content to be returned after submission
      # each assigned to a variable('$' - from template tags) of the same name -
      # '$' represents a variable, and reference the title string passed in in the above argument
      # references the items from the mutation defined in Mutation.js
    
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
    
    ) {
    # value we want returned.
      id
    }
  }
`;
```



Once we have our mutation setup, we can expose it via in our form:

```react
<Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state}>
{/* Mutation get's passed in via the query prop & variables for the mutation are assigned from state. */}
  
  <Form onSubmit={(e) => {
  e.preventDefault();
  e.persist()
  console.log(e);
  }}>
  </Form>
</Mutation>
```

> **NOTE:** Querys and mutations can a function as a child, that function will return back the data handled.

```react
<Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state}>
        {(createItem, payload) => {

        }}
```

The mutation allows us to destructure a function off of which we've named `createItem`, as well as the payload, which we can actually destructure in place and grab the items we need off of it — ==available to us from apollo==

```react
{(createItem, {loading, error, called, data}) => { }}
```

> **NOTE**: `'called'` is a boolean that let's us know whether the mutation has been called or not, and `'data'` is the data we get back. 

Although for our purposes we don't need `called` or `data` here, bause we are able to implictly return form our createItem Mutation:

```react
    return (
      <Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state}>
        {(createItem, { loading, error }) => (

          <Form onSubmit={(e) => {
            e.preventDefault();
            e.persist()
            console.log(e);
          }}>
            <fieldset>
              <label htmlFor="title"> Title
              <input type="text" id="title" name="title" placeholder="title" value={this.state.title} onChange={this.handleChange} required />
              </label>
              <label htmlFor="price"> Price
              <input type="number" id="price" name="price" placeholder="price" value={this.state.price} onChange={this.handleChange} required />
              </label>
              <label htmlFor="description"> Description
              <textarea type="textarea" id="description" name="description" placeholder="Enter a Description" value={this.state.description} onChange={this.handleChange} required />
              </label>
              <button type="submit">Submit</button>
            </fieldset>
          </Form>

        )}
      </Mutation>
    )
```





Now that we have our mutation setup, we can focus on setting up the loading and error states available to us off of it. 

```react
import Error from './ErrorMessage';
// has built-in error message handling and formatting
```

The <Error/> is something provided by Wes for the form's error message handling. It takes in any error messages, formats them and then renders them to the DOM. We simply need to just setup the rendered component:

```react
<Error error={error} />
<fieldset>
```

> placed right above the beginning <fieldset> tag.

Next we can handle the loading state that was given to us off of the payload we get back from our createItem mutation.

We'll be utiizing the `disabled` attribute available to us on a standard <fieldset> to disable our form when the loading variable we pass in is set to true. So anytime our form is submitting, the loading variable will get set to true, and that will disable our form for us. 

```react
<fieldset disabled={loading} aria-busy={loading}>
```

> We've also setup the aria-busy attribute, and set that to loading as well, not only will this work for screen-readers — which means it's accessible, but also we've attach some loading animations to it in our form styles, that let's the user know the form is busy submitting. 

Lastly all we have to do is set the state from — handle the submit action for the form:

```react
  <Form onSubmit={async (e) => {
    e.preventDefault();
    // e.persist()
    const res = await createItem()
    console.log('CREATE_ITEM_MUTATION', { e, res });
  }}>
```

> **NOTE:** we've made the call with `async/await` to handle it asynchronously.

Now if we go ahead and submit we should see a response logged, and we should also see the new item in our prisma database:

![image-20190609114614658](http://ww4.sinaimg.cn/large/006tNc79ly1g3vcdhgjtej30me04rt9b.jpg)

![image-20190609115511866](/Users/bunty/Library/Application Support/typora-user-images/image-20190609115511866.png)



Next up we'll handle the redirect, after the form submits allowing us to redirect the user to the product page that was just created - to do that we'll need to import `Router`:

```react
import Router from 'next/router'
```

Now we can use the router to push the user to the single item page:

```react
<Form onSubmit={async (e) => {
    e.preventDefault();
    const res = await createItem()
    console.log('CREATE_ITEM_MUTATION', { e, res });

    // redirects user using the pathname and id from the query
    Router.push({
      pathname: '/item',
      query: {id: res.data.createItem.id}
    })
  }}>
```


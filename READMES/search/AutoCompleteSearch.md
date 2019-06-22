## Search Dropdown AutoComplete

---------------------------------

==FrontEnd== `components/Search.js`

We'll be relying on a package called Downshift to handle to logic for our search functionality: https://github.com/downshift-js/downshift - for the search functionality we'll eventually need to create a query to be able to handle search, and allow those queries to run on demand, not just on page load as we have been. 

```react
import React from 'react';
import Downshift from 'downshift';
import Router from 'next/router';
import { ApolloConsumer } from 'react-adopt';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown';
```

```react
import React from 'react';
import Downshift from 'downshift';
import Router from 'next/router';
import { ApolloConsumer } from 'react-adopt';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown';

class AutoComplete extends React.Component {
  render() {
    return (
      <SearchStyles>
        <div>
          <input type="search" />
          <DropDown>
            <p>Items Will Go here</p>
          </DropDown>
        </div>
      </SearchStyles>
    )
  }
}

export default AutoComplete;
```





import `Search.js` to `components/Header.js`:

---------------------------------

```react
import Search from './Search';
```

```react
<div className="sub-bar">
  <Search/>
</div>
<Cart />
```



Next we can define our SEARCH_ITEMS_QUERY

```react
const SEARCH_ITEMS_QUERY = gql`
# takes in a single arg: $searchTerm, which is required(!)

  query SEARCH_ITEMS_QUERY($searchTerm: String!) {
  
		# using where to match searchTerm to contents of title or description fields
		# using 'OR' to handle an array of possible matches
    items(where: { OR: [{ title_contains: $searchTerm }, { description_contains: $searchTerm }] }) {
      # returns each result's:
      id
      image
      title
    }
  }
`;

```

> **NOTE**:  we're using the operator: 'OR' which takes an array of possible matches. in our case any items that contain the search term either in the title or the description. 



Next we'll be able to utilize the Apollo Consumer to wrap our search input with allowin us to enter a search term and then query that term on demand by running our `SEARCH_TERMS_QUERY`:

```react
<ApolloConsumer>
  {/* using apollo consumer to allow for on-demand querying of data:  */}
  {client => (
    // client is available via the Consumer.
    <input
      type="search"
      />
  )}
</ApolloConsumer>
```



Next we can wire up the onChange and then handle the change method:

```react
<input
  type="search"
  onChange={e => {
    e.persist();
    this.onChange(e, client); 
    // passing the client from the consumer along with the onChange event
  }}
  />
)}
```



```react
onChange = async(e, client) => {
  console.log('🔎 Searching...');

  const res = await client.query({
    query: SEARCH_ITEMS_QUERY,
    variables: { searchTerm: e.target.value },
    // passes in the input value as the searchTerm
  });
  console.log(res);
}

```



Now that we're able to get data back we'll want to hold the data we get back in state:

```react
state = {
  items: [],
  loading: false,
};
```



Next we can use State to toggle our loading state for the UI as well as update our state with `setState()` from the onChange handler:

```react

    this.setState({ loading: true });
    // Manually query apollo client
    const res = await client.query({
      query: SEARCH_ITEMS_QUERY,
      variables: { searchTerm: e.target.value },
      // passes in the input value as the searchTerm
    });
    this.setState({
      items: res.data.items,
      loading: false,
    });
```



We'll want to use that `debounce` mehod we imported ot help use set brief interval between keypresses, to see if the user continues to type after a pause. if they continue nothing happens, but if they stop for the `350`ms we've set our debounce to, then the rest of the onChange runs as it should once its solidfied that condition.

```react

onChange = debounce(async (e, client) => {
// using debounce to mitigate firing of keydown/ key events. 
  console.log('🔎 Searching...');
  // turn loading on
  this.setState({ loading: true });
  // Manually query apollo client
  const res = await client.query({
    query: SEARCH_ITEMS_QUERY,
    variables: { searchTerm: e.target.value },
    // passes in the input value as the searchTerm
  });
  console.log(res);
  this.setState({
    items: res.data.items,
    loading: false,
  });
}, 350);
```





And now we can render out any search results by mappin over the items array from state:

```react
<DropDown>
  {/* map thru all items in state */}
  {this.state.items.map(item => (
    // render a dropdownitem for each item in the list:
    <DropDownItem key={item.id}>
      <img width="50" src={item.image} alt={item.title} />
      {item.title}
    </DropDownItem>
  ))}
</DropDown>
```


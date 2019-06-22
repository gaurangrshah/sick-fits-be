## Search with Downshift

---------------------------------

We can implement downshift by wrapping our application with it, and using render props to allow us to integrate our app with downshift's search functionality:

```react
<Downshift>
  {({ getInputProps, getItemProps, isOpen, inputValue, highlightedIndex }) => (
 {/* destructure props from render props payload */}

    /* ... */


  )}
</Downshift>
```



- `getInputProps:` adds props needed for search functionality to the input, and allows us to pass in an object with any additional props we need to add along with it:

  ```react
  <input
    // method that spreads out props from downshift
    {...getInputProps({
      // passing along additional props ie: onChange, type
      type: "search",
      placeholder: 'search for an item',
      id: 'search',
      className: this.state.loading ? 'loading' : '',
      onChange: e => {
        e.persist();
        this.onChange(e, client);
      }
    })}
    />
  ```





- `isOpen` - boolean used to toggle the dropdown,

  ```react
  {isOpen && (
  // isOpen prop from downshift used to toggle dropdown
    <DropDown>
      {this.state.items.map(item => (
        <DropDownItem key={item.id}>
          <img width="50" src={item.image} alt={item.title} />
          {item.title}
        </DropDownItem>
      ))}
    </DropDown>
  
  )}
  ```

  > Downshift also handles clearing the input field when someone clicks outside the dropdown, and hiding the search results at the same time. 

  

- `getItemProps`:  allows us to spread out included props from downshift available for handling our results and interacting with them, such as using the arrow keys to navigate:

  ```react
  <DropDown>
    {/* map thru all items in state */}
    {this.state.items.map((item, index) => (
      // render a dropdownitem for each item in the list:
      <DropDownItem
        {...getItemProps({ item })}
        key={item.id}
        highlighted={index === highlightedIndex}
        >
        <img width="50" src={item.image} alt={item.title} />
        {item.title}
      </DropDownItem>
    ))}
  </DropDown>
  ```



Currently we're able to access each item from our results, but we get an object back from downshift, so downshift exposes the prop:

- `itemToString`: which converts the object for each result into a string, from where we can render the `item.title` for the user:

  ```react
  <Downshift itemToString={item => (item === null ? '' : item.title)}>
  ```

  

- `routeToItem`: custom handler we use to route a user to the item that the select from the search results

  ```react
  <Downshift onChange={routeToItem} itemToString={item => (item === null ? '' : item.title)}>
  ```

  ```react
  function routeToItem(item) {
    // fires when a user clicks a result
    Router.push({
      // routes user to the page associated to the item.id
      pathname: '/item',
      query: {
        id: item.id,
      },
    });
  }
  ```



- `inputValue`: contains the current value of the input field

  ```react
  {!this.state.items.length && !this.state.loading && (
    <DropDownItem>
      No items match {inputValue}
    </DropDownItem>
  )}
  ```

  > this outputs a message to the user, if there are no matches to their search, given that we are not currently in a loading state. 



Currently we're getting a simple error in the console related to how downshift handles its tracking for multiple rendered elements:

![image-20190614210812279](http://ww2.sinaimg.cn/large/006tNc79ly1g41khiarmnj30mc00s74b.jpg)

> We can import resetIdCounter` from downshift which allows us to negate this behavior:
>
> ```react
> import Downshift, {resetIdCounter} from 'downshift'; 
> ```
>
> ```react
> // method from downshift that resets its key counter on each downshift element
>     resetIdCounter(); 
>     return ( /* ... */ )
> ```


# User Permissions Backend

---------------------------------

Firs thing we'll do is to add propTypes for our User component in `src/components/Permissions.js`:

import prop-types:

```react
import PropTypes from 'prop-types'
```

define static propTypes:

```react
class UserPermissions extends Component {
  static propTypes = {
    // expects 1 prop: (user)
    user: PropTypes.shape({
      // define items we need from props below:
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permisisons: PropTypes.array,
    })
  }

/* ... */

}
```

> **NOTE**: defining the shope of the prop types allows us to specify the propType for each expected prop



Next thing we need to do is to intialize some state for this component:

We'll want to loop thru the permissions in the Permissions component, then pass the permissions down into the User component:

```react
state = {
  permissions: this.props.user.permissions,
}
```

> **NOTE**: in react its considered a no-no to populate state from props, although in this case we are just using props to seed the data to populate state - this is the one use case in which this is ok. And that is because we'll be handling the updates to the state right here, and will not need to pass back up via props. 

```react
<Table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      {/* map possible permissions from array above */}
      {possiblePermissions.map(permission =>
       <th key={permission}>{permission}</th>
                              )}
      <th>👇</th>
    </tr>
  </thead>
  <tbody>
    {/* map through each user in db */}
    {data.users.map(user => {
      return <UserPermissions key={user.id} user={user} />
    })}
  </tbody>
</Table>
```



We'll also handle the mapping over permisisons for each user, inside the UserPermission component:

```react
return (
  <tr>
    <td>{user.name}</td>
    <td>{user.email}</td>
    {possiblePermissions.map(permission => (
      <td key={permission}>
        <label htmlFor={`${user.id}-permission-${permission}`}>
          <input type="checkbox" />
        </label>
      </td>
    ))}
    <td><SickButton>Update</SickButton></td>
  </tr>
)
```

Now that we have everything in place we can we first toggle on, the checkboxes for any item that is currently active for the user by setting the `checked` attribute on the input:

```react
{possiblePermissions.map(permission => (
          <td key={permission}>
            <label htmlFor={`${user.id}-permission-${permission}`}>
              <input type="checkbox" checked={this.state.permissions.includes(permission)} />
            </label>
          </td>
        ))}
```

> we've set the checked attribute on the input to resolve to true only when the permission is included in the array of this users permissions. 

![image-20190612155045528](http://ww2.sinaimg.cn/large/006tNc79ly1g3z02jdrncj30s408v74z.jpg)

But we will see that now that we're dealing with inputs again, we'll get an error about  using an onChange handler:

![image-20190612155127457](http://ww2.sinaimg.cn/large/006tNc79ly1g3z0396s16j30gv020mxg.jpg)

> If you tie the value of an input to state, then that value must be changed from state - the input is just a proxy for the value in state, that is why we need an `onChange` to trigger a `setState`
>
> ```react
> <input 
>   type="checkbox" 
>   checked={this.state.permissions.includes(permission)} 
>   value={permission} // sets value to whatever permission is
>   onChange={this.handlePermissionChange}
>   // calls handlePermissionChange onChange:
>   />
> ```
>
> > create a separate method `handlePermissionChange:`
> >
> > ```react
> > handlePermissionChange = (e) => {
> >   console.log(e.target.checked, e.target.value)
> > 
> > }
> > ```
>
> Now we can add and/or remove permissions from state, as we have access to both the value and the input



handle the logic for adding and removing items from state using a copy of state to mitigate the updates:

```react
handlePermissionChange = (e) => {
  const checkbox = e.target;
  // create a copy of state -  💡 best practice always spread out arrays to copy them.
  let updatedPermissions = [...this.state.permissions];
  // are we adding or removing permission?
  if (checkbox.checked) {
    // add item to [updatedPermissions] from checkbox.value
    updatedPermissions.push(checkbox.value);
  } else {
    // remove permission from [updatedPermissions] if permission does not match value checked.
    updatedPermissions = updatedPermissions.filter(permission => permission !== checkbox.value);
  }
  // set state from updatedPermissions
  this.setState({ permissions: updatedPermissions });
  console.log('permissionsUpdated', updatedPermissions)
}
```

> **NOTE**: we've passed in `updatedPermissions` as a callback to `this.setState` - since `setState` is an async function, we want to ensure that state has been upated before we run `updatedPermissions` - that is why we pass it in as a callback to `setState`, defined as the 2nd argument to `setState`

now we're able to use the same onchange handler, and handle the logic of which settings to add and/or remove. We do this in the most react way, and ensure that we're setting state from a copy of state which we used to update state. 



We'll notice that we currenly have to click that actually checkbox in order to toggle it on and off, we'd like to be able to click anywhere within the label that the checkbox is contained in and still toggle the checkbox todo this - we have to make sure that label's `htmlfor` attribute matches the input's `id`:

```react
<label htmlFor={`${user.id}-permission-${permission}`}>
  <input
    type="checkbox"
    // if permission is included in array of permissions, then (checked = true)
    checked={this.state.permissions.includes(permission)}
    value={permission}
    onChange={this.handlePermissionChange}
    />
</label>
```

> **NOTE**: the labels `htmlfor` attribute and the input's `id` both now reference the same value: {`${user.id}-permission-${permission}`}
>
> This allows the label to act as a part of the input and we can extend its reach by updating one css property: 
>
> ```react
> label {
>   display: block;
> }
> ```
>
> this ensures the label will take up all the height and width it can around the input.

So far we're able to pull in user permissions from the database, and allow users to change their settings and write back to our local state, but we still need to configure pushing their settings back to the server. 




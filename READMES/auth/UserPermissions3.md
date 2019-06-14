## Update User Permissions on Server

---------------------------------

==BackEnd== `src/schema.graphql`:

add an updatePermissions Mutation type:

```react
updatePermissions(permissions: [Permission], userId: ID!) : User
```

> permissions takes in an array of permission items, also a required userId.



now we can add a resolver for this muatation: `src/resolvers/Mutation.js`

```react
async updatePermissions(parent, args, ctx, info) {
  // 1. Is user logged in?
  if (!ctx.request.userId) {
    throw new Error('You Must Be Logged In');
  }
  // 2. Query current user
  const currentUser = await ctx.db.query.user({
    where: {
      id: ctx.request
    },
  }, info)
  // 3. Check user's permissions
  hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
  // 4. Update Permissions
  return ctx.dub.mutation.updateUser({
    // using the prisma generated updateUser mutation here:
    data: { }, // data to be updated:
    where: { }, // which item to udpate with data.
  }, info)
},
```

We'll still need to pass in the actual data into our updateUser mutation from prisma

```react
return ctx.dub.mutation.updateUser({
  // using the prisma generated updateUser mutation here:
  data: {
    // data to be updated:
    permissions: {
      set: args.permissions
    }, // setting permissions - because enum must use "set:" syntax
  },
  where: {
    id: args.userId
  }, // which item to udpate with data.
}, info)
```



now we can switch over ot ==FrontEnd== 'src/components/Permissions.js':

We can setup our updatedPermissions mutation here:

```react

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation updatePermissions($permissions: [Permission], $userId: ID!) {
    updatePermissions(permissions: $permissions, userid: $userId) {
      id
      permissions
      name
      email
    }
  }
`;
```

Make sure to import the Mutation component from `react-apollo`, which will let us inject this mutation in our UserPermissions component:

```react
import { Query, Mutation } from 'react-apollo';
```



```react
      <Mutation mutation={UPDATE_PERMISSIONS_MUTATION} variables={{
        permissions: this.state.permissions,
        userId: this.props.user.id
      }}>
        {(updatePermissions, { loading, error }) => (

          <tr>
            <td>{user.name}</td>
            <td>{user.email}</td>
            {possiblePermissions.map(permission => (
              <td key={permission}>
                <label htmlFor={`${user.id}-permission-${permission}`}>
                  <input
                    id={`${user.id}-permission-${permission}`}
                    type="checkbox"
                    // if permission is included in array of permissions, then (checked = true)
                    checked={this.state.permissions.includes(permission)}
                    value={permission}
                    onChange={this.handlePermissionChange}
                  />
                </label>
              </td>
            ))}
            <td><SickButton type="button" disabled={loading} onClick={updatePermissions}>Update</SickButton></td>
          </tr>
          
        )}
      </Mutation>
```

> Here we've wired our button to call our updatePermissions mutation onClick which will then update the server with the user's data by running the Update Permissions Mutation

Let's add in our error handling:

```react
{(updatePermissions, { loading, error }) => (
  <>
  {error && <tr><Error error={error} /></tr>}
  <tr>
    <td>{user.name}</td>
    <td>{user.email}</td>
    {possiblePermissions.map(permission => (
      <td key={permission}>
        <label htmlFor={`${user.id}-permission-${permission}`}>
          <input
            id={`${user.id}-permission-${permission}`}
            type="checkbox"
            // if permission is included in array of permissions, then (checked = true)
            checked={this.state.permissions.includes(permission)}
            value={permission}
            onChange={this.handlePermissionChange}
            />
        </label>
      </td>
    ))}
    <td><SickButton type="button" disabled={loading} onClick={updatePermissions}>Update</SickButton></td>
  </tr>
  </>
```

we've wrapped our component into a fragment because our error handling message is a sibling to our rendered component. 














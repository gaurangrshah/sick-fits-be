## User Settings & Permissions FrontEnd

---------------------------------

In this section we'll add functionality that allows users to set their options and setting associated with their account. 

==BackEnd== `src/schema.graphql`:

add a new query type for `users`

```react
users: [User]!
```

> users must return an array of users (`!`)required — the array itself is required, but it may be empty so we just make the array required to be returned and not the actual User. This makes sure that this query will not error out if there are no users in ur database or no results for users in your query. 

Once we've modified our schema we'll need to add a resolver for it: `src/resolvers/Query.js`

```react
const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current userId
    if (!ctx.request.userId) {
      // check the request off context for userId
      return null
      // if no id then return null
    }
    return ctx.db.query.user({
      where: { id: ctx.request.userId },
      // targeting user where the userId matches ctx.request.userId
    }, info) // passes in info as the 2nd arg.
    // allows us to dissect what fields we need from the user when we need them.
  },
  
  
  async users(parent, args, ctx, info) {
    // 1. check if the user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in');
    }
    // 2. Check if the user has the permissions to query all the users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])
    // checks to see user has admin permission and permissionupdate

    // 3. query all users?
		return ctx.db.query.users({}, info)

    // note the first arg, `where` gets provided an empty object.
    // once again the 2nd arg, `info` contains the fields from the query that we are requesting.
  },
  
  
  
};
module.exports = Query;

```

> in `src/utils.js` we have a helper function available to us called hasPermissions that checks to see a users permissions match the permissions required to access whatever feature they're tying to access.
>
> ```react
> function hasPermission(user, permissionsNeeded) {
>   // takes in user and an array of neccessary permissions
>   const matchedPermissions = user.permissions.filter(permissionTheyHave =>
>     // filter users current permissions
>     permissionsNeeded.includes(permissionTheyHave)
>     // see if users permissions match necessary permissions
>   );
>   if (!matchedPermissions.length) {
>     // if no permissions match tell user they don't have the right permissions:
>     throw new Error(`You do not have sufficient permissions
> 
>       : ${permissionsNeeded}
>       
>       You Have:
> 
>       ${user.permissions}
>       `);
>   }
> }
> 
> exports.hasPermission = hasPermission;
> ```
>
> 



Once our query is defined we can switch over to the ==FrontEnd== and create a new page: `src/pages/permissions.js`

```react
import PleaseSignin from '../components/PleaseSignin';

const PermissionsPage = props => (
  <PleaseSignin>
    <p>permissions granted</p>
  </PleaseSignin>
)

export default PermissionsPage;
```

> we can test if this page renders by going to http://localhost:7777/permissions

Now let's create a Permissions component and render it to our permissions page: `src/component/Permissions.js`

```react
import { Query } from 'react-apollo';
import Error from './ErrorMessage';
import gql from 'graphql-tag';

const ALL_USERS_QUERY = gql`
  query {
    users {
      id
      name
      email
      permissions
    }
  }
`;

const Permissions = props => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) => (
      <div>
        <Error error={error} />
        <p>Permissions</p>
      </div>
    )}
  </Query>
)

export default Permissions
```

and then import it into our permissions page:

```react
import PleaseSignin from '../components/PleaseSignin';
import Permissions from '../components/Permissions';

const PermissionsPage = props => (
  <PleaseSignin>
    <Permissions/>
  </PleaseSignin>
)

export default PermissionsPage;
```



In order for us to access our user information, we'll need to add another bit of middleware in ==BackEnd== `src/index.js`:

```react
// Middleware to populate the user on each request when logged in:
server.express.use(async (req, res, next) => {
  // exit if user is not logged in.
  if (!req.userId) return next();
  // find the user where the id matches.
  const user = await db.query.user({
    where: { id: req.userId }
    // return the following info about the user:
  }, '{id, permissions, email name}');
  // console.log(user);

  // put the user onto the request to pass it along:
  req.user = user;
  next();
})

```

> This ensures that we're validating the user with every request, and making sure we have all the pertinent information in regards to the user available to let them access anything they have permissions to. 
>
> we can see the user details now being logged to the node console with each reqeust:
>
> ```react
> [Object: null prototype] {
>   id: 'cjws78wctmg2j0b42xbeqi0hm',
>   permissions: [ 'USER' ],
>   email: 'gaurang.r.shah@gmail.com',
>   name: 'gshah2020' }
> ```
>
> 



Now we can test the permissions page in the browser and how shoud be shown what permissions we have vs. what permissions we need:

![image-20190612134139388](http://ww1.sinaimg.cn/large/006tNc79ly1g3ywc9kpvsj30s804zmxa.jpg)



Now if we go into the prisma database we'll be able to make ourself the admin user, and this sould allow us access:

![image-20190612140311939](http://ww2.sinaimg.cn/large/006tNc79ly1g3ywyo33nmj30mf03qt8m.jpg)



This means can move onto looping over the data object that we get back, and display our users permissions:

```react
import Table from './styles/Table';
// table component to display data with. 
```

```react
const Permissions = props => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) =>
      console.log('permissions:', data) || (
        <div>
          <Error error={error} />
          <p>Permissions Granted</p>
          <div>
            <h2>Manage Permissions:</h2>
            <Table>
              
            </Table>
          </div>
        </div>
      )}
  </Query>
)
```

Now we can go ahed and layout our table data:

```react

<Table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      {/* map possible permissions from array above */}
      	{possiblePermissions.map(permission =>
         <th>{permission}</th>
      )}
      <th>👇</th>
    </tr>
  </thead>
  <tbody>
    {/* map through each user in db */}
    {data.users.map(user => {
      return user.name;
    })}
  </tbody>
</Table>
```



next we'll create a separate component in the same file and refactor the user mapping logic into it:

```react
class UserPermissions extends Component {
  // expects 1 prop: (user)
  render() {
    const user = this.props.user;
    return (
      <tr>
        <td>{user.name}</td>
        <td>{user.email}</td>
      </tr >
    )
  }
}
```

>  which we've refactored out to be used in our table:
>
> ```react
> <tbody>
>   {/* map through each user in db */}
>   {data.users.map(user => {
>     return <User user={user} />
>   })}
> </tbody>
> ```



Now we can use this same component to map over the permissions once again for each user and display the relevant permission for each user using checkboxes as inputs:

```react
<tr>
  <td>{user.name}</td>
  <td>{user.email}</td>
  {possiblePermissions.map(permission => (
    <td>
      <label htmlFor={`${user.id}-permission-${permission}`}>
        <input type="checkbox" />
      </label>
    </td>
  ))}
  <td><SickButton>Update</SickButton></td>
</tr>
```



Next steps will be to allow users to update these permissions from here, an be able to save it to local state from this table as well.. that will require a whole lot of logic and mutaions that we'll write next. 
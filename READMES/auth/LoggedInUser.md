## Currently Logged In User 

with Middleware and Render Props

If we were to check out cookies currently, we'll see that since we've logged in we now have a cookie with our auth in it already:

![image-20190611005926127](http://ww1.sinaimg.cn/large/006tNc79ly1g3x4otqv1nj30hy085t9q.jpg)



We're going to add information, along with our JWT, to get a better understanding of how this works, let's take a look at the debugger at https://jwt.io

![image-20190611010126167](../../../../../../../Library/Application Support/typora-user-images/image-20190611010126167.png)

 What we'll notice is that our JWT contains both a header and a payload, so if we wanted to we can add additional data onto our payload for each user. 



How we'll use this is, when each page renders, we'll make sure the JWT is available, allowing us to stick the user id from the JWT onto every request. So whenever we want to check user permissions, or query the database in regards to the logged in user, we'll retain access to things like `userId`  from the payload. 



Next we can switch to ==backend== and open: `src/index.js`:

We'll finish our last todo in this file by adding middleware to populate current user:

```react
server.express.use((req, res, next) => {
  console.log('hi middle');
  // next();
});
```

> When we log our test statement to the console, we'll see the following in the node console:
>
> ![image-20190611010955862](http://ww3.sinaimg.cn/large/006tNc79ly1g3x4zqekzpj30bn02z3ys.jpg)

Now we can extract the token from the response:

```react
server.express.use((req, res, next) => {
  // pull token out of request:
  const {token} = req.cookies;

  next(); 
  // passes the request down the line allowing each page render to access the response. 
});
```

this allows us to access the token on each page. and pass along data similar to how we've added the sample property here manually from the cookie itself:

![image-20190611011619471](http://ww4.sinaimg.cn/large/006tNc79ly1g3x56ervzqj30qs03v0tt.jpg)



firstly let's import jwt, so we can decode the token:

```react
const jwt = require('jsonwebtoken')
// bring in the jwt library for auth
```



then we can use the token if its available to verify the user, and grab their userId:

```react
if (token) {

  // sending the appsecret along while decoding the token, this ensures no one can tamper with their cookies.
  const { userId } = jwt.verify(token, process.env.APP_SECRET);

  //put the userId ontot the req for future requests to access.
  req.userId = userId;
}
```



Next we'll get into ==backend== `schema.graphql` and add a query for the current user:

```react
  me: User
```



next we should add this qeury to the resolvers:

```react
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
   
  },
```

> passing `info` as the 2nd arg  — allows us to dissect what fields we need from the user when we need them. if we need the email field, it won't give us things like the cart as well. We can be specific about the info what want back. 



Next we'll build a component on the ==frontend== that will query the backend for this data for us:

create new file: `src/components/User.js`: 

First let's handle the imports for this file:

```react
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
```



next define the `CURRENT_USER_QUERY`:

```sql
const CURRENT_USER_QUERY = gql`
 query {
  me {
    id
    email
    name
    permissions
  }
 }
`;
```



Then let's make the User component:

```react
const User = props => (
  <Query
    {...props} // spreading any props out we want to give to the User component
    query={CURRENT_USER_QUERY} // pass in query
  >
    {payload => props.children(payload)}

  </Query>
)

```

> instead of rendering function here as a child, instead we've passed the payload onto the child component to render. This will allow us to pass in this payload without having to rewrite this query every time



Let's also define our propTypes, since we're using render props to render our payload:

```react
User.PropTypes = {
  children: PropTypes.func.isRequired,
}

export default User;
export { CURRENT_USER_QUERY }
```

> we've also listed our exports. 



Now to test let's import the User component into `src/components/User` and wrap our nav with it:

```react
import User from './User';

 <NavStyles>
  {/* nav links */}
  <User></User>
    <Link href="/items"><a>Shop</a></Link>
    <Link href="/sell"><a>sell</a></Link>
    <Link href="/signup"><a>Signup</a></Link>
    <Link href="/orders"><a>Orders</a></Link>
    <Link href="/me"><a>Account</a></Link>
</NavStyles>
```



Let's grab the data from the User components children: 

```react
<User>{(data) => {
    console.log(data);
    return <p>{user}</p>
  }}</User>
```



We'll destructure data, so that we can render out the items from it:

```react
<User>{(data: {me}) => {
```

> sets `me` as a reference of `data`



lastly, let's output the user from the new `me` object:

```react
<User>{({ data: { me } }) => {
    // destructure data off of payload, and set it as 'me'
    if (me) {
      console.log(me);
      return <p>{me.name}</p>
      // return the name of user. 
    }
  }}</User>
```

![image-20190611015528965](http://ww3.sinaimg.cn/large/006tNc79ly1g3x6b4f9ypj3081024jrb.jpg)


## Gated Signin Component

---------------------------------

Create a new component `src/components/PleaseSignin.js`

```react
import { Query } from 'react-apollo';
import { CURRENT_USER_QUERY } from './User';
import Signin from './Signin';

const PleaseSignin = (props) => <p>Sign in please</p>

export default PleaseSignin;
```



Then import the PleaseSIgnin component to `src/pages/sell.js`:

```react
import CreateItem from '../components/CreateItem';
import PleaseSignin from '../components/PleaseSignin';
// used to limited access to only users who ard signed in. 

const Sell = () => {
  return (
{/* wrapping createItem with pleaseSignin, makes created item a gated component */}
    <PleaseSignin>
      <CreateItem />
    </PleaseSignin>
  )
}

export default Sell

```



Now we can setup the `src/components/Signin.js` :

```react
import { Query } from 'react-apollo';
import { CURRENT_USER_QUERY } from './User';
import Signin from './Signin';

const PleaseSignin = (props) => (
  <Query query={CURRENT_USER_QUERY}>
    {({ data, loading }) => {
      if (loading) return <p>Loading...</p>;
      if (!data.me) {
        return (
          <div>
            <p>Please Sign In Before Continuing</p>
            <Signin />
          </div>
        )
      }
      // only renders children when user is signed in.
      return props.children;
    }}
  </Query>
)
export default PleaseSignin;
```





Doing this allows us to wrap any components tha require a user to be signed in to access. Once wrapped we'll only render the component for signed in users, after consulting our `CURRENT_USER_QUERY`, if a user is not signed in they will be shown the signin form via the signin component, otherwise the user will see the actual component rendered. 




## Signup Form

Now that we have the signup process setup in the database, all we need to do is to add a form to our signup page and wire it up with our signup mutation. 

==frontend==

Create a new component: `src/components/Signup.js`

```react
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';

class Signup extends Component {
  render() {
    return (
      <div>
        Signup form.
      </div>
    );
  }
}

export default Signup;
```



Create a new page:  `src/pages/signup.js` & import the component `Signup.js`

```react
import Signup from '../components/Signup';

const SignupPage = (props) => {
  return (
    <div>
      <Signup />
      <Signup />
      <Signup />
    </div>
  );
}

export default SignupPage;
```

> We've used several instances of the signup form, because we'll want a form for signup, login and password reset. 



We can also add a styled component in to wrap our forms in:

```react
import styled from 'styled-components';

const Columns = styled.div`
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
grid-gap: 20px;
`;

const SignupPage = (props) => {
  return (
    <Columns>
      <Signup />
      <Signup />
      <Signup />
    </Columns>
  );
}
```



Now let's goto `src/components/Signup.js` add our form:

```react
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';

class Signup extends Component {
  state = {
    name: '',
    password: '',
    email: '',
  };

  saveToState = () => {
    this.setState({ [e.target.name]: e.target.value })
  }
  render() {
    return (
      <Form>
        <fieldset>
          <h2>Signup for an Account.</h2>

          <label htmlFor="email">
            Email
              <input type="text" name="email" placeholder="email" value={this.state.email} onChange={this.saveToState} />
          </label>
          <label htmlFor="name">
            Name
              <input type="text" name="name" placeholder="name" value={this.state.name} onChange={this.saveToState} />
          </label>
          <label htmlFor="password">
            Password
              <input type="text" name="password" placeholder="password" value={this.state.password} onChange={this.saveToState} />
          </label>
          <button type="submit">Send</button>
        </fieldset>
      </Form>
    );
  }
}

export default Signup;
```





Next we'll have to declare the mutation we need to save to the database, 

```sql
const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION($email: String!, $name: String!, $password: String!){
    signup(email: $email, name: $name, password: $password ) {
      id
      email
      name
    }
  }
`;
```

and wrap our form with the mutation component and pass in it's variables: 

```react
    return (
      <Mutation mutation={SIGNUP_MUTATION} variables={this.state}>
        {(signup, { error, loading }) => (
          <Form>
            <fieldset>
              <h2>Signup for an Account.</h2>

              <label htmlFor="email">
                Email
                <input type="text" name="email" placeholder="email" value={this.state.email} onChange={this.saveToState} />
              </label>
              <label htmlFor="name">
                Name
                <input type="text" name="name" placeholder="name" value={this.state.name} onChange={this.saveToState} />
              </label>
              <label htmlFor="password">
                Password
                <input type="text" name="password" placeholder="password" value={this.state.password} onChange={this.saveToState} />
              </label>
              <button type="submit">Send</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
```





Then we can use the `error` and `loading` states we have access to from apollo:

```react
<Form>
  <fieldset disabled={loading} aria-busy={loading}>

    <h2>Signup for an Account.</h2>

    <Error error={error} />

    <label htmlFor="email">
      Email
      <input type="text" name="email" placeholder="email" value={this.state.email} onChange={this.saveToState} />
    </label>
    <label htmlFor="name">
      Name
      <input type="text" name="name" placeholder="name" value={this.state.name} onChange={this.saveToState} />
    </label>
    <label htmlFor="password">
      Password
      <input type="text" name="password" placeholder="password" value={this.state.password} onChange={this.saveToState} />
    </label>
    <button type="submit">Send</button>
  </fieldset>
</Form>
```



We'll also specify a form submission method of POST: 

```react
<Form method="post" onSubmit={e => {
    e.preventDefault();
    signup();
    console.log('signedup', this.state)
  }}>
```

> **NOTE**: the `post` method is specified as a fallback, in case javascript doesn't load, or there's a slow connection, it will fall back to the browser to handle the form for us, in that case: the post method will kick in.
>
> Another way to avoid this issue, is not to use  a <form> tag at all, and just render the inputs. 

We can also make the `onSubmit` an async method which will allow us to log the response: 

```react
<Form method="post" onSubmit={async e => {
    e.preventDefault();
    const res = await signup();
    console.log('success', res)
  }}>
```



And finally we can clear our form after success response:

```react
<Form method="post" onSubmit={async e => {
    e.preventDefault();

    // handle response:
    const res = await signup();
    console.log('success', res)

    // reset form:
    this.setState({ name: '', email: '', password: '' })
  }}>
```



ADDED:

We'll want to import the `CURRENT_USER_QUERY` so when have context when a user is logged in:

```react
import { CURRENT_USER_QUERY } from './User';
```

```react
<Mutation
  mutation={SIGNUP_MUTATION}
  variables={this.state}
  refetchQueries={[{ query: CURRENT_USER_QUERY }]}
 >
```

> This will make sure the current user query gets refetched after successful signup which will load the user's context, in this case just the user's name in the nav bar.
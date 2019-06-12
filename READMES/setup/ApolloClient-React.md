## Setting up Apollo Client with React

Apollo client allows react to communicate with graphql, allowing it to integrate with our prisma database. Apollo client comes in as a redux replacement, and was actually built on top of redux in version 1. 

Apollo will also provide is with some cache management which once data is pulled, if its requested again it is pulled directly from the cache instead of making the request again. 

Also provides us with Error and Loading UI states, removing the need to setting variables like `isLoading`



Let's start by taking a look at ==frontend== `lib/withData.js` where our apollo client is configured:

```js
import withApollo from 'next-with-apollo';
// HOC that exposes Apollo Client via a prop which configures with Next.js server-side rendering.

import ApolloClient from 'apollo-boost';
// apollo-boost is what handles caching, errors, loading states, etc. 

import { endpoint } from '../config';
// endpoint from config.js - which handles our front-end config.

function createClient({ headers }) {
  // createClient takes in headers
  
  // returns a new client:
  return new ApolloClient({
    uri: process.env.NODE_ENV === 'development' ? endpoint : endpoint,
    // passing in the url of the endpoint
    request: operation => {
      // express middleware - includes credentials with every request using logged in 	
      // cookies from the browser. 
      operation.setContext({
        fetchOptions: {
          credentials: 'include',
        },
        headers,
      });
    },
  });
}

export default withApollo(createClient);

```



Once we have this file setup we can create a client in `pages/_app.js`: we'll need to add two new imports:

```js
import { ApolloProvider } from 'react-apollo'; 
// package that allows react to interact with apollo
import withData from '../lib/withData';  
// the file we configured above
```



Next in order to allow our application to use Apollo we must wrap our application in an `ApolloProvider`:

```js

export default class MyApp extends App {
  render() {
    const { Component, apollo } = this.props;
    // destructure apollo from props. 

    return (
      <Container>
        
        <ApolloProvider client={apollo}> 
      	{/* sets up provider for app.  */}
          <Page>   
            <Component />  
          </Page>
        </ApolloProvider>


      </Container>
    )
  }
}

```



Next we need to do some additional configuration to setup our pagination that will allows us to surface query values from any paginated urls - we do this by tapping into a next.js specific lifecycle method `getInitialProps`:

```js

  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
      // sets up initialProps from ctx.
    }
    // exposes the query to the users.
    pageProps.query = ctx.query
    return pageProps
  }
```

> - `getInitialProps` is a lifecycle method specific to next.js 
> - it gets run before the first initial render on every page. 

```react
    const { Component, apollo, pageProps } = this.props;
		// destructure pageProps from props
		 
			return (
    	  <Container>
       
      	  <ApolloProvider client={apollo}> {/* destructured above from props */}
        	  <Page> 

          	  <Component {...pageProps}/>   
          	</Page>
        	</ApolloProvider>
      	</Container>
    	)

export default withData(MyApp)
// exported as default withData HOC wrapper. 
```

> **NOTE**: Anything exposed from there will then be available from props in the render method. Essentially this will crawl every page that we load for any relevant queries and/or mutations that are available to us. This allows us to ensure that the data is available when the page renders.


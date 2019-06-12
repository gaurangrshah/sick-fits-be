#  PrismaYogaWorkflow

We're going to now configure running queries and mutations for items via the prisma database so we can get our data to persist. 

- update data model for prisma
- deploy data model to Prisma
- update schema.graphql for Yoga
- create resolvers for any mutations and queries (or both.)



Let's start by updating our data model for Prisma: `src/datamodel.prisma`

```js
type Item {
  id: ID! @unique
   // id is required (!) and must be (@unique)
   title: String!
   // title is a String and is required(!)
   description: String!
   // description is a String and is required(!)
   image: String
   // image is a string that contains the url, and is not required
   largeImage: String
   // largeImage is a string that contains the url, and is not required
   price: Int!
   // price is an integer and is requried (!)
   createdAt: DateTime
   // DateTime is available via prisma not graphql and is used as a timestamp
   updatedAt: DateTime
   // DateTime is available via prisma not graphql and is used as a timestamp
  //  user: User! // 🚧 will be used to create a relationship between items and users, 
  // will uncomment in future when we add users.
}
```

**NOTE**: Everytime we update Prisma's datamodel we must re-deploy the new datamodel to Prisma. This will update the database and allow it to know and exect the items we've created/udpated. This will also pull down our new schema for these items from prisma. 

```shell
yarn deploy
```



Errors in the above code may be caused by the fact that Prisma insists on name the datamodal with the `.prisma` suffix, while the tutorial is using `.graphql` in either case. We've incorporated the error fixes:

```js
type User {
  id: ID! @id @unique
  name: String!
  email: String!
}

type Item {
  id: ID! @id @unique
   title: String!
   description: String!
   image: String
   largeImage: String
   price: Int!
   createdAt: DateTime! @createdAt
   updatedAt: DateTime! @updatedAt
}


```

> - DateTime - should be required (`!`), for both fields. 
> - id needs the `@id` "directive" keeping the @unique directie as well.



>  Upon sucess, primsa will update our `src/generated/prisma.graphql` & we'll se the following printed to the console:
>
> ```js
> Deploying service `sick-fits` to stage `dev` to server `prisma-us1` 700ms
> 
> Changes:
> 
>   Item (Type)
>   + Created type `Item`
>   + Created field `id` of type `ID!`
>   + Created field `title` of type `String!`
>   + Created field `description` of type `String!`
>   + Created field `image` of type `String`
>   + Created field `largeImage` of type `String`
>   + Created field `price` of type `Int!`
>   + Created field `createdAt` of type `DateTime!`
>   + Created field `updatedAt` of type `DateTime!`
> 
> Applying changes 1.5s
> 
> post-deploy:
> project prisma - Schema file was updated: src/generated/prisma.graphql
> 
> Running graphql get-schema -p prisma ✔
> ```

>  **NOTE**: 
>
> Since graphQL is not a query language Prisma sits on top and builds out not only the CRUD api for us, but also the querying logic that allows us to filter and sort our data like a query language would. 



Now that we have our type and our datamodel, we can now creat a mutations for this type of `Item` in `src/schema.graphql`

```js
type Mutation {
  createItem(title: String, description: String, Price: Int, Image: String, largeImage: String ): Item! // returns Item which is required(!)
    // defined args and types for createItem mutation,  
}
  
type Query {
  items: [item]!
    // quick query to check if things are working. 
}
```

> The above takes in all the args defined, and will return(`:`) an `Item` which is required(`!`)
>
> **NOTE**: args can also be passed in as an object called {data}, instead of being defined inline as above.
>
> **Also**: when args are the same as the args defined in our `datamodel.prisma` file, we can import them  from the schema we get back via `prisma.graphql`
>
> **ALSO NOTE**: imports are not a standard of graphQL, but is available to us via Prisma.

importing schema type declarations for arguments from `prisma.graphql` defined at the top of the `schema.graphql` file: 

```js
# import * from './generated/prisma.graphql'
```

> The current method of doing imports is to use comments(`#`) to declare the necessary import. 

> ![image-20190608143325096](http://ww2.sinaimg.cn/large/006tNc79ly1g3ubcum274j307k0bgjrn.jpg)
>
> As we can see we'l have the queries & mutations then available to us. 



Next we can define any resolvers we want to apply to our Items: `src/resolvers/Mutation.js`

```js
const Mutations = {
  createItem(parent, args, ctx, info) {
// accessing db via ctx, from our setup in createServer.js
    const item = ctx.db.mutation.createItem({
       data: {
      //   title: args.title,
      //   description: args.desc
       ...args
       }
     
    }, info)
    
  }

};

module.exports = Mutations;

```

> - createItem is the schema defined in the api we get back from prisma in `primsa.graphql` under "Mutations"
>
> > createItem takes two arguments: 
> >
> > - the first is "data" - which we also find defined in `prisma.graphql` and basically contains all the args defined on the item we are creating.
> > - the second is the `info` parameter from the function call, which graphql needs to serve up our data to the frontend, and will ensure that it is tracked accordingly. 
>
> - instead of defining each key value for args inline, we've opted to spread out the args that get returned back to us -



Now the `createItem` method actually returns a promise when its ran, so we'll need to make our call ==asynchronously==:

```js
  async createItem(parent, args, ctx, info) {

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
        // spread all args on item
      }
    })
  },
```



Lastly, we'll want to just return the `item`:

```js
  async createItem(parent, args, ctx, info) {

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      }
    })
    return item;
  },
```



Now this new mutation should be available in our graphql api, and we can test via graphql playground:

We can run a mutation to add an item:

```js
mutation {
  createItem (
    title:"test" 
    description: "desc" 
    image: "dog.png" 
    largeImage: "newdog.png" 
    price: 1000
  ) {
    id
    title
  }
}
```



Which should return: 

```js
{
  "data": {
    "createItem": {
      "id": "cjwo9meup65460b12r8c9k90o",
      "title": "test"
    }
  }
}
```



Now that our Mutation is able to successfully add new items to our database, let's setup our query so that we can see how to pull items from the database.  



We've already setup a query type for items in `schema.graphql`:

```js
type Query {
  items: [Item]!
}
```

> This tells graphql to return an array of items. 

Next we can define our query in the `src/resolvers/query.js`:

```js
const Query = {
  async items(parent, args, ctx, info) {
    const items = await ctx.db.query.items();
    //setup query for items and return items below.
    return items;
  }
};
module.exports = Query;

```

> We can see a list of all items available to use on the query item, by opening the graphql playground on the prisma server:  https://us1.prisma.sh/gshah2020-4a9e06/sick-fits/dev - not to be confused with the playground from localhost server. 



#### Query Alternative for YOGA

There is a caveat when using Yoga, that when your query shape is the exact same for Prisma as it is for Yoga, we can use this syntax to define our query, which should reduce repititon:

```js
const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db')
  };
module.exports = Query;

```

> in this scenario instead of using an async function to grab our data from the backend, we just leverage prisma's abilities and say, any queries for "items" should get forwarded to the ('db') we defined in createServer.js



With this in place we can now query our database for items:

```js
query allItems {
  items{
    id
    title
  }
}
```



Which will return any items in the db:

```js
{
  "data": {
    "items": [
      {
        "id": "cjwo9meup65460b12r8c9k90o",
        "title": "test"
      },
      {
        "id": "cjwoai1xt5s480b42w9psi9pu",
        "title": "Blue"
      }
    ]
  }
}
```



We can also double check that both the data was saved and is available from the prisma db and backend:

![image-20190608224330670](http://ww4.sinaimg.cn/large/006tNc79ly1g3upirze52j30gq0ac74s.jpg)

![image-20190608224403877](http://ww4.sinaimg.cn/large/006tNc79ly1g3upjcs427j30gp0fzabz.jpg)
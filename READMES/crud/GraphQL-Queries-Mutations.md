## GraphQL Queries & Mutations

We'll be defining the queries and schema i the `src/schema.graphql` file:

In order for us to be able to query anything, that item must have a type defined. 

We'll start with an example of how to query a dog from the database

### Custom Type

```js
type Dog {
  name: String!
}
```

> this defines our dog item, and says that it has one required field which is a name and that name is a string.

### Custom Query

```js
type Query {
  dogs: [Dog]!
}
```

> Now we can query from our type of Dog and get back an array of [Dog], which will have all the names of any dogs in our database. 
>
> we can also use the syntax: `dogs: [Dog!]` - this would imply that we cannot return null afterwards for any item - so:
>
> ```js
> type Query {
>   dogs: [Dog!]!
> }
> 
> 
> [{name: 'Snickers'}] //is valid
> [{name: 'Snickers'}, null] //is not valid
> ```



Once we setup a new Query, we need to setup a new resolver for that query: `src/resolvers/Query.js`

```js
const Query = {
  dogs(parent, args, ctx, info) {

  },
};
```

> - <u>parent</u> - 
> - <u>args</u> - contain any arguments past into the query.
> - <u>ctx</u> - allows us to access the db, from the context we created in createServer.js -- context also provides us the access to the request as well, allowin us to handle the incoming response.
> - <u>info</u> - contains info related to the item being queried.



```js
const Query = {
  dogs(parent, args, ctx, info) {
		return [{ name: 'Snickers' }, { name: 'Sunny' }]
  },
};
```

> now we're explictly returing an array of dogs back from the query.

This should now have our new query for the dogs array, listed in our graphql playground schema. And we cn now use it to query our dogs:

> This query for dogs in graphql playground:

```react
# Try to write your query here
query {
  dogs{
    name
  }
}
```

> will now return this array of dogs from our hardcoded list:

```js
{
  "data": {
    "dogs": [
      {
        "name": "Snickers"
      },
      {
        "name": "Sunny"
      }
    ]
  }
}
```





### Custom Mutation

Let's experiment further with our Dog item, and create a Mutation, that creates a dog: `src/schema.graphql`

- first step is to create the schema for the mutation:

```js
type Mutation {
  createDog(name: String!): Dog
}
```

> our `createDog` mutation takes in one argument: `name`, which is required (`!`) and must be a `String` when then when provided should return (`:`) the `Dog` item we requested by it's name property.

**NOTE**: mutations must mirror the type and query from the schema for the item. Or we may see this errror in the node console.

```js
// Error: Mutation.createDog defined in resolvers, but not in schema
```



- Next, we can create the actual mutation: `src/resolvers/Mutation.js`

```js
const Mutations = {
  createDog(parent, args, cxt, info) {
    console.log(args);
  },
};

module.exports = Mutations;

```

> and we can see the output of of `args` in the node console:
>
> ```js
> // { name: 'Snickers' }
> ```
>
> 

We can also name our Mutations and Queries in GraphQL.

![image-20190608123158694](http://ww4.sinaimg.cn/large/006tNc79ly1g3u7ukl4hsj30l009m0tf.jpg)

![image-20190608123316690](http://ww2.sinaimg.cn/large/006tNc79ly1g3u7vvdkoqj30mx0c13ze.jpg)

> We can define a name for each of our querie and mutations to be able to reference them at a later point. 
>
> **NOTE**: <u>This is done from the playground</u>



Lets test our functionality by altering our query for testing purposes only (should never expose variables to the global scope - in actual project.)  

first in `src/Query.js`:

```js
const Query = {
  dogs(parent, args, ctx, info) {
    // parent, args, ctx, info, allow us to access diff parts of the dog item.
    global.dogs = global.dogs || [];
    // using the dog array we create don the global object. 
    console.log('getAllDogs:', global.dogs);
    return global.dogs // returning the entire array off the global object.

  },
};
module.exports = Query;

```

then in `src/Mutation.js`:

```js
const Mutations = {
  createDog(parent, args, cxt, info) {
    global.dogs = global.dogs || [];
    // creates a dog on the global object in node (similar to window object)
    const newDog = { name: args.name };
    // creates a new dog from the name argument that gets passed in.
    global.dogs.push(newDog)
    // pushes the new dog to the global array.

    console.log('createDog:', newDog);
    return newDog
    // returns the new dog.
  },
};

module.exports = Mutations;
```



Now we can run mutations in graphQL playground to create new dogs and add them to the database.

**NOTE**: we are only mocking the saving currently by using the `global` variable. 

```js
mutation createADog {
  createDog(name: "Fido") {
    name
  }
}
mutation createADog {
  createDog(name: "Spud") {
    name
  }
}
```



We can see that the node console will log the results of each of the new mutations as they get run

```js
{ name: 'Snickers' }
{ name: 'Fido' }
{ name: 'Spud' }
```



We can also run the `getAllDogs` query in the playground, and it will return an array of the dogs we entered.

```js
query getAllDogs {
  dogs{
    name
  }
}
```

```js
{
  "data": {
    "dogs": [
      {
        "name": "Snickers"
      },
      {
        "name": "Fido"
      },
      {
        "name": "Spud"
      }
    ]
  }
}
```


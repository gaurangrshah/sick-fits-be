Prisma setup:

https://www.prisma.io/docs/get-started/01-setting-up-prisma-demo-server-TYPESCRIPT-t001/

```shell
npm install -g prisma
```

```shell
yarn global add primsa
```



Must have prisma account setup with link above, then...

```shell
primsa login
```

> will open a browser window to complete login process

```shell
primsa init
```

> initializes primsa in the application.



Make the following selections at the command prompts:

- Demo Serve + MySQL database

- Select server (select the one with the least latency)

  >  gshah2020-4a9e06/demo-us1      Hosted on AWS in us-west-2 using MySQL [192ms latency] 

- Choose a name

- State: dev (pre-selected)

- For programming Language select "Don't Generate"

upon completion we should see a message that looks like this:

```shell
Created 2 new files:                                                                          

  prisma.yml           Prisma service definition
  datamodel.prisma    GraphQL SDL-based datamodel (foundation for database)

Next steps:

  1. Deploy your Prisma service: prisma deploy
  2. Read more about deploying services:
     http://bit.ly/prisma-deploy-services
[06/7/19 4:13] 
```



This process adds two new files to the project:    `datamodel.prisma` ||   `prisma.yml`



from `primsa.yml` we should grab the current endpoint for our graphQL server, and stick that into our .env file"

```react
PRISMA_ENDPOINT="https://endpointurl...."
```



Back in the primsa.yml file, we can now set the endpoint up to reference the environment variable we setup for it. 

```react
endpoint: ${env:PRIMSA_ENDPOINT}
```



Next, we can also setup a variable to reference our primsa secret (already included in ENV as a template.)

```react
endpoint: ${env:PRIMSA_ENDPOINT}
# secret: ${env:PRIMSA_SECRET}
datamodel: datamodel.prisma  // default -- already in file along with endpoint. 
```

currently we've commented the secret out, so as to keep our server open for the initial setup, just makes it easier without having to deal with authentication at first. 



Finally we need to add a "post deploy hook" to the `prisma.yml` file:

```react
hooks:
  post-deploy:
    - graphql get-schema -p prisma
```



Now we can complete setup by deployiing our configured graphQL to prisma:

```shell
primsa deploy
```



upon successful deploy:

```shell
post-deploy:
project prisma - Schema file was updated: src/generated/prisma.graphql

Running graphql get-schema -p prisma ✔

Your Prisma endpoint is live:

  HTTP:  https://us1.prisma.sh/gshah2020-4a9e06/sick-fits/dev
  WS:    wss://us1.prisma.sh/gshah2020-4a9e06/sick-fits/dev

You can view & edit your data here:

  Prisma Admin: https://us1.prisma.sh/gshah2020-4a9e06/sick-fits/dev/_admin
```

> this command generated a new file ` src/generated/prisma.graphql`
>
> wich is the schema that we requested in our post-deploy hook which now gives us all of the basic CRUD functionality and endpoints already built up for us. 

Now this database and its data is accessible from primsa's servers:

https://app.prisma.io/gshah2020-4a9e06/services/prisma-us1/sick-fits/dev/databrowser



Adding items to schema: `datamodel.prisma` our currently generated file looks like:

```react
type User {
  id: ID! @id
  name: String!
}
```



let's add schema to include emails, on our User object:

```react
type User {
  id: ID! @id
  name: String!
  email: String!
}
```

> @ - signifies: "directives"  
>
> ! - indicates requried fields. 



In order for the changes to take effect, we'll need to restart the backend server

```react
yarn deploy
```





When we deploy we can see that graphql lauches our backend in graphql playground for us where we can do things like run queries and or mutations, let's take a look at a mutation used to add a new user.

We can use this to create a new user:

```react
mutation {
  createUser(data: {
    name: "Wes Bos"
    email: "hey@cool.com"
  }) {
    name
    email
  }
}
```

> this mutation creates a new user by the name and email we provide, and then returns that name and email for the new user we created. This is an example of a mutation. 



We can also run queries, this one will return the id and name for each user in our database:

```react
query {
	users{
    id
    name
  }
}
```



We can also run queries that request specific bits of information:

```react
query {
  users(where: {
    name_contains: "wes"
  }) {
    id
    name
  }
}
```

> this query will return back any users with the name: "Wes"



We also have specific types of queries:

```react
query {
  usersConnection {
    pageInfo{
      hasNextPage
      hasPreviousPage
    }
    aggregate{
      count
    }
  }
}
```

this just returns the count of aggregated users. The pageInfo, allows us to create paginations, so if we were to list out users, we can list out 10 per page, rather than all users at one time. 
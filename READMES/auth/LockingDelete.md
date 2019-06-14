# Locking Down Deleting of items

---------------------------------

We want to make sure that only the owner of the item can delete the item. ==BackEnd== `src/resolvers/Mutation.js`:

- We left ourselves a `todo` for this when we were first writing the delete items mutation, at that point we didn't have any users in the database to form the relationship between a user and the content, but now we have the relationship that a user owns each item. So the owner should be the only one who can delete the item



```react
//2. TODO: check privileges (make sure person is allowed to delete this item)
const ownsItem = item.user.id === ctx.request.userId;
const hasPermissions = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission));

```

> ==`.some()` checks to see if at least one of the items in the array== 
>
> **NOTE**: we're using `.some()` to loop through our array, to see if any of the items match (atleast 1 match).  Below is an example of how `.some()` works...
>
> ![image-20190612222402805](http://ww3.sinaimg.cn/large/006tNc79ly1g3zbg0ca3ij30iy02nwfa.jpg)
>
> We'll need some error handling, to ensure we notify users who try to delete an item, if they don't have sufficient permissions. We'll add this conditional into our `deleteItem` mutation that will throw an error if we encounter one:
>
> ```react
> if (!ownsItem || !hasPermissions) {
>   throw new Error('You don\'t have sufficient permission');
> }
> ```



**NOTE**: we also had to update the return from the item query to return the user and the id frm the user back to us:

```react
const item = await ctx.db.query.item({ where }, `{id title user { id }}`)
```

> we were originally only returning id, title - and didn't have access to the user's id. 

We can grab the error we throw in the mutation and output it on the ==frontend==:

We'll modify the deleteItem mutation and where it's called from to output our error `src/components/DeleteItem.js`:

```react
if (confirm('Are you sure?')) {
  deleteItem().catch(err => {
    //output error from deleteItem()
    alert(err.message);
  });
}
```

> because `deleteItem()` is a promise, we can add a catch right onto it to output any errors form our mutation.


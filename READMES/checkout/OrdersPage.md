# Orders page

---------------------------------

Now that we are able to process and display a customers order, we can take a look at how we go about displaying multiple orders. 

1. Make page ==FRONTEND== `/pages/orders.js`:

   ```jsx
   import PleaseSignin from '../components/PleaseSignin';
   // used to limited access to only users who ard signed in.
   import OrderList from '../components/OrderList';
   
   const OrderPage = (props) => {
     return (
       <PleaseSignin>
         <OrderList />
       </PleaseSignin>
     )
   }
   
   export default OrderPage
   
   ```

2. Make Order List Component: `components/OrderList.js`:

   ```jsx
   class OrderList extends Component {
     static propTypes = {
       id: PropTypes.string.isRequried,
     }
     render() {
       return (
         <p>Order List</p>
       )
     }
   }
   
   export default OrderList;
   ```

3. Write Query ==Backend== `src/schema.graphql`: 

   ```js
   orders(orderBy: OrderOrderByInput): [Order]!
   ```

   > **NOTE**: OrderOrderByInput is a binding that prisma exposes for us that allows us to set the order of lists

   

4. Query Resolver `src/resolvers/Query.js`:

   ```js
     async orders(parent, args, ctx, info) {
       const { userId } = ctx.request;
       if (!userId) throw new Error('you must be signed in!');
       return ctx.db.query.orders({
           where: {
             user: { id: userId },
           },
         }, info);
     },
   ```

   

5. Create a query to grab order details for provided id ==FRONTEND== `components/OrderList.js`:

   ```js
   const USER_ORDERS_QUERY = gql`
     query USER_ORDERS_QUERY {
       orders(orderBy: createdAt_DESC) {
         id
         total
         createdAt
         items {
           id
           title
           price
           description
           quantity
           image
         }
       }
     }
   `;
   ```

   

6. Loop thru and display data onto the page.

   ```jsx
   class OrderList extends React.Component {
     render() {
       return (
         <Query query={USER_ORDERS_QUERY}>
           {({ data: { orders }, loading, error }) => {
             if (loading) return <p>loading...</p>;
             if (error) return <Error erorr={error} />;
             console.log(orders);
             return (
               <div>
               <h2>You have {orders.length} orders</h2>
               </div>
             );
           }}
         </Query>
       );
     }
   }
   
   export default OrderList;
   ```

   Now that we're able to query for our orders data, we can template out the UI for our Orders Page:

   ```jsx
   return (
     <div>
       <h2>You have {orders.length} orders</h2>
       <orderUl>
         {orders.map(order => (
           <OrderItemStyles key={order.id}>
             <Link
               href={{
                 pathname: '/order',
                   query: { id: order.id },
               }}
               >
               <a>
                 <div className="order-meta">
                   <p>{order.items.reduce((a, b) => a + b.quantity, 0)} Items</p>
                   <p>{order.items.length} Products</p>
                   <p>{formatDistance(new Date(order.createdAt), new Date())}</p>
                   <p>{formatMoney(order.total)}</p>
                 </div>
                 <div className="images">
                   {order.items.map(item => (
                     <img key={item.id} src={item.image} alt={item.title} />
                   ))}
                 </div>
               </a>
             </Link>
           </OrderItemStyles>
         ))}
       </orderUl>
     </div>
   );
   ```

   

That completes our checkout and card processing implementation.
## Send Password reset Email

---------------------------------

Sign up for a new `Mailtrap` account: www.mailtrap.io

then setup the environment variables based on the mail trap smtp server settings:

```js
MAIL_HOST="smtp.mailtrap.io"
MAIL_PORT=2525
MAIL_USER=""
MAIL_PASS=""
```



Create a new file on the ==BackEnd== `src/mail.js`:

We'll be using a package called `node-mailer` to send our test emails, and can also be used in production

```react
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  // transport is a way of sending emails, we can have multiple transports.
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// email templating:
const makeANiceEmail = text => `
<div className="email" style="
  border: 1px solid black;
  padding: 20px;
  font-family: sans-serif;
  line-height: 2;
  font-size: 20px;
">
<h2> Hello there! </h2>
<p>${text}</p>

<p>thank you.</p>
</div>
`

exports.transport = transport;
exports.makeANiceEmail = makeANiceEmail;
```



Now we can update our mutation resolver for the `resetRequest` where we still have to add in the email sending after the user requests a reset: `src/resolvers/Mutation.js`

first we'll import the `transport` and `makeANiceEmail` from `mail.js`

```react
const { transport, makeANiceEmail } = require('../mail');
// used to capture emails sent from the server
```

then we can use them to setup our smtp service:

```react
// 3. Email the user the token
const mailRes = await transport.sendMail({
  // sendMail takes in the details of our email:
  from: 'gshah@gshahdev.com',
  to: user.email,
  subject: 'Your Password Reset Token',
  html: makeANiceEmail(`Your password reset token is here! \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`)

});
```

> **NOTE**: we could add a try catch to the above mailres function for error handling.



Now if we run the reset, we'll get an email in `mailtrap's` dashboard:

![image-20190612000347236](http://ww1.sinaimg.cn/large/006tNc79ly1g3y8pcf7xbj30hy0cumyb.jpg)


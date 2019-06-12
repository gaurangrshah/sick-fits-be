## UploadImages

# cloudinary

Under cloudinary settings: we'll find some `upload presets` where we can define how we want cloudinary to serve up any images we give it: https://cloudinary.com/console/settings/upload

- Free upto 10GB, we setup an account for sickfits, in "unsigned" mode.

![image-20190609145231176](http://ww1.sinaimg.cn/large/006tNc79ly1g3vhj149ypj30o809rgmq.jpg)



Now let's open up `CreateItem.js` and create a new method that allows us to upload our images to cloudinary:

```react
uploadFile = (e) => {
    // will get triggered when someone selects a file to upload.
    console.log('uploading file');
  }
 
```

Next let's add an upload field at the top of our form:

```react
<label htmlFor="file"> Image
  <input type="file" id="file" name="file" placeholder="upload an image" value={this.state.image} onChange={this.uploadfile} required />
</label>
```



Now that we have our file input element, we can go ahead and test it, it should just log our message to the console, as soon as we select a file to upload. 

```react
  uploadFile = async (e) => {
    // will get triggered when someone selects a file to upload.
    console.log('uploading file');
    const file = e.target.files; // pulling uploaded files off e.target
    const data = new FormData(); // using javascript FormData api to prep form data.
    data.append('file', files[0]); // appends data to the file, targeting the first file it finds.
    data.append('upload_preset', 'sickfits'); // upload is a preset, that cloudinary needs. 

    //fetching from cloudinary, passing the body in with the method as a second argument.
    const res = await fetch('https://api.cloudinary.com/v1_1/dvog5yjvc/image/upload', {
      method: 'POST',
      body: data
    })

    //handle response
    const file = await res.json(); // converts the reponse object to a json object. 
    console.log(file);
    
    // set image from response to state:
    this.setState({
      image: file.secure_url, // sets the standard image
      largeImage: file.eager[0].secure_url // sets the larger image
    })
  }
```

**NOTE**: ==we are handling this method asynchronously==. 



Next we can try and see if an upload works for us if we upload an image we should get back our response:

![image-20190609155137212](http://ww2.sinaimg.cn/large/006tNc79ly1g3vj8imi4fj30o707iwg3.jpg)



Last thing we'll want to do is to display the uploaded image back to the user once it's uploaded:

```react

<label htmlFor="file"> Image
  <input type="file" id="file" name="file" placeholder="upload an image"
    // value={this.state.image}
    onChange={this.uploadFile} required />
  {this.state.mage && <img src={this.state.image} alt="upload preview" />}
</label>
```


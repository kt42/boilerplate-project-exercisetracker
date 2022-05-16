const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");


// init cors and body parser
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// setup mongoose
const mongoose = require("mongoose");
const { application } = require('express');
const { Schema } = mongoose;

// init mongodb connection
mongoose.connect(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// checking connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Database connected");
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Setup mongoose schema and model
const userSchema = new Schema({
  username: String,
});

const userModel = mongoose.model("Users", userSchema);

app.get("/api/users", (req, res) => {
  console.error("not sure");
  userModel.find({}, function (err, docs) {
    return res.json({docs})
  });

});

app.post("/api/users", (req, res) => {
  
  console.error("not xgbsdgwergerf");

  // save the user with this id
  const doc = userModel.findOneAndUpdate(
    { username: req.body.username }, 
    {}, // not needed -- only the username and id are needed for a new record
    {upsert: true, new: true},
    function (err, user) 
    {
      if (err) { console.error(111, err, user);
        res.json({whoops: "no record found mate"});
      }
      else if (user){ console.error(222, err, user)
        res.json({
          "username": user.username,
          "_id": user._id,
        })
      }
      else{ console.error("not sure", err, newUrl)
        res.json({err: "not sure"});
      }
    }
  );
  // Query Parameters (aka fliter): if a record matches them it will ALWAYS be returned, regardless of any other Parameters below.
  // If no record is found and "upsert: true" is set - it will use the query parameters (obviously, as it was not found you want to use these to create it) and also whatever is in the update pasrameters to create a new record. 
  // If no record is found and "upsert: false" is set (this is the deafult) - no error or document will be returned. This is a pain to check for as both err and doc returns are null. There's no error because the db call didnt actually fail, it just returned no records.
 // Update Paramaters: What you want updated/ inserted. If nothing is provided (empty object {}) AND upsert is true it will attempt an insert using just the Query parameters.
  
  // "new: true" - Optional. When true, returns the updated document instead of the original document. Defaults to false. Obvioulsy this is only relevent when updating a found document, not when one isn't found, or when finding one but not updating (i.e. when using $setOnInsert)
  // for MongoDB shell: {returnNewDocument: true} (docs.mongodb.com)
  // for Node.js MongoDB Driver API: { returnDocument: 'after' }

  // $setOnInsert can be used in the Update Paramaters for rows that you only want updated/inserted if a record is NOT found i.e. only insert these rows if a record doesn't already exist. usage: $setOnInsert: { many rows here }
  
  // **Side note**: $setDefaultsOnInsert can also be set to true to ensure mongoose will apply the defaults specified in the model's schema if a new document is being created (ie one was not found)
  
  // So, by setting all the Update Paramaters to $setOnInsert you effectivly prevent findOneAndUpdate() from ever updating anything. So then if a record is found it won't update anything - it will simply return the record. (the query/filter isn't used to update unless nothing is found).
  // And also then if no record is found and "upsert: true"  it will then create an entire record. 
  // So findOneAndUpdate() essentially becomes find one and if nothing is found create one. This is very nice as it only uses 1 db request.


});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port http://localhost:' + listener.address().port)
})

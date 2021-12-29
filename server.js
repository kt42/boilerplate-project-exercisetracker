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

const UserModel = mongoose.model("Users", userSchema);

app.get("/api/users", (req, res) => {
  console.error("not sure");
  UserModel.find({}, function (err, docs) {
    return res.json(docs)
  });

});

// Setup mongoose schema and model
const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: Date,
});

var ExerciseModel = mongoose.model('Exercise', exerciseSchema);

app.post("/api/users/:_id/exercises", (req, res) => {
  
  console.log("1111");
  console.log("777", req.body.description, req.body.duration, req.params._id, req.body._id, req.body.date);

  if(!req.body.description) {
    return res.json("Path `description` is required.")
  }
  if(!req.body.duration) {
    return res.json("Path `duration` is required.")
  }

  if(!req.body.date){ // no date enetered
    console.log("2222");
    var date_formatted = new Date();
  }
  else{ // a date entered
    var date_formatted = new Date(req.body.date);      // returns a Date object if valid, or a string literal "Invalid Date" if invalid
    // console.log(date_formatted);
    if (date_formatted.toString() === "Invalid Date"){   // so if invalid date exit
      console.log("Incorrect date format")
      return res.json({error: "Incorrect date format"})
    } // if vaild date nothing needed to be done
  }


  // check if user id exists
  UserModel.findById(req.params._id, function (err, user)
  {
    if (err) {return res.json({err});}
    else if (user)
    {
      console.log(2345234, user);
      // make the doc (model instance) 
      var exerciseDoc = new ExerciseModel({  
        description: req.body.description, 
        duration: req.body.duration,
        date: date_formatted
      })
      console.log(exerciseDoc);

      // save the doc
      exerciseDoc.save(function (err2, doc) 
      {
        if (err2) {console.log("error saving"); return res.json({err});}
        else if (doc)
        {
          console.log("saved successfully")
          return res.json({"_id": user._id, "username": user.username, "date":doc.date.toDateString(), "duration": doc.duration, "description":doc.description})
        }
        else{console.log("???555")}
      });
    }
    else{console.log("???666")};
  });
  


});

app.post("/api/users", (req, res) => {
  
  console.log("not aaaa");

  // save the user with this id
  const doc = UserModel.findOneAndUpdate(
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

const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");


// init cors and body parser
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// commit checkpoint test

// request logger
app.use(function (req, res, next) {
  var log = req.method + " " + req.path + " - " + req.ip;
  console.log(log);
  next();
});

// commit checkpoint test

// setup mongoose
const mongoose = require("mongoose");
const { application } = require('express');
const { Schema } = mongoose;

// init mongodb connection
mongoose.connect(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// commit checkpoint test 2

// checking connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Database connected");
});


// commit checkpoint test 3

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

// Setup mongoose schema and model
const exerciseSchema = new Schema({
  theUser: { type: mongoose.ObjectId, required: true },
  description: String,
  duration: Number,
  date: Date,
});
var ExerciseModel = mongoose.model('Exercise', exerciseSchema);

app.get("/api/users", (req, res) => {
  console.error("not sure");
  UserModel.find({}, function (err, docs) {
    return res.json(docs)
  });
});

app.get("/api/users/:_id/logs", (req, res) => 
{
  // ** There are "Query Params" or "URL Params"
  // console.error("not sure", req.query.day, req.query.month);
  // console.error("not sure", req.params.from, req.params.to, req.params.limit);

  console.log(req.query.from, req.query.to, req.query.limit);

  
  // if(req.query.from || req.query.to || req.query.limit);{ // if one exists
  //   if(!req.query.from || !req.query.to || !req.query.limit){ // but anouter doesn't exist
  //   } 
  // }

  var fromDateObj;
  var toDatObj;
  var limitNum = 100; // default max 100 records can be returned
  if(req.query.limit){
    limitNum = parseInt(req.query.limit);
  }

  // check if user id exists first
  UserModel.findById(req.params._id, function (err, user)
  {
    if (err) {return res.json({err});}
    else if (user)
    {
      var query = {theUser: user._id} // need at leaset the id in the query

      // check if dates + a limit were entered
      if(req.query.from && req.query.to && req.query.limit)
      { 
        // Grab the dates + limit 
        fromDateObj = new Date(req.query.from);
        toDatObj = new Date(req.query.to);

        //check they are valid
        if (fromDateObj.toString() === "Invalid Date" || toDatObj.toString() === "Invalid Date")
        {
          console.log("Incorrect date format or non integer limit entered")
          // return res.json({error: "Incorrect date format"}) // no need to end the process here, just return the full list
        }
        else{
          // update the query if vaild dates + a valid boolean limit were entered
          query.date = {"$gte": fromDateObj, "$lte": toDatObj};
        }
      }

      

      console.log(123456789, query);

      ExerciseModel.find(query, function (err2, exercises) 
      {
        if (err2) {return res.json({err2});}
        else if (exercises)
        {                          
          //console.log(1111111, exercises)                       //// JUST GOING TO FUCKING LOG THEM AS IS    
          //console.log(2222222, Object.prototype.toString.call(exercises[0]))
          //var ff = new Date();
          //console.log(555555, Object.prototype.toString.call(ff))
          // interesting -- I used new Date when some dates wer'nt stored as Date objects 
          //-- It converted them if not already Dates but caused no effect if already a Date, 
          // perfect for solving, allowed me to continue test - kind of used like validator / convertor.. nice
          const exercisesWithEditedDate = exercises.map(x => ({ ...x, date: x.date.toDateString()})); 
          console.log(3333333, exercisesWithEditedDate);
          return res.json({"_id": user._id, "username": user.username, from: new Date(fromDateObj).toDateString(), to: new Date(toDatObj).toDateString(), "count": exercises.length, "log": exercisesWithEditedDate})
        };
      }).select('-_id description duration date').limit(limitNum).lean(); // confirmed - if I don't use lean() a mongoose object is returned, contains "InternalCache" properties etc.. in each object in the array, with .lean() its a simple object.
    }
  });
});

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
    var enteredDateObj = new Date();
  }
  else{ // a date entered
    var enteredDateObj = new Date(req.body.date);      // returns a Date object if valid, or a string literal "Invalid Date" if invalid
    // console.log(enteredDateObj);
    if (enteredDateObj.toString() === "Invalid Date"){   // so if invalid date exit
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
      console.log(2345234, typeof user._id);
      // make the doc (model instance) 
      var exerciseDoc = new ExerciseModel({  
        theUser: user._id,
        description: req.body.description, 
        duration: req.body.duration,
        date: enteredDateObj
      })
      console.log(999999, exerciseDoc);

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

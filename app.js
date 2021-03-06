var nr = require('newrelic');
var express     = require('express'),
    app         = express(),
    bodyParser  = require('body-parser'),
    mongoose    = require('mongoose'),
    Campground  = require('./models/campground'),
    Comment     = require('./models/comment'),
    seedDB      = require('./seeds'),
    sleep       = require('sleep');


//<!-- Connect MongoDB and set some connection details -->
mongoose.Promise=global.Promise;
mongoose.connect("mongodb://yelpcamp-gc:admin@ds143907.mlab.com:43907/yelpcamp-gc", {useMongoClient: true});
seedDB();

//<!-- define other environment settings -->
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));

//<!--  ***********************  Routes *********************** -->
//<!-- Base route -->
app.get("/", function(req, res){
  sleep.sleep(5);
  res.render("landing");
  nr.addCustomAttribute("kinzuuid", req.headers.referer);
  // NewRelic::Agent.add_custom_attributes({uuid: referrer})
});

//<!-- Campground routes -->
app.get("/campgrounds", function(req, res){
  //Get all campgrounds from DB
  Campground.find({}, function(err, campgrounds){
    if(err){
      console.log(err);
    } else {
      res.render("campgrounds/index", {campgrounds:campgrounds});
    }
  });
});

app.post("/campgrounds", function(req, res){
  //get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var description = req.body.description;
  var newCampground = {name : name, image : image, description: description};
  //Create a new campground and save to DB
  Campground.create(newCampground, function(err, newlyCreated){
    if(err){
      console.log(err);
    }else{
      //if no errors, redirect back to campgrounds page
      res.redirect("/campgrounds");
    }
  });
});

app.get("/campgrounds/new", function(req,res){
  res.render("campgrounds/new");
});

app.get("/campgrounds/:id", function(req, res){
  //find the campground with provided ID
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
      if(err){
        console.log(err);
      } else {
        res.render("campgrounds/show", {campground: foundCampground});
      }
  });
  //render show template with that campground
});

//<!-- Comments routes -->

app.get("/campgrounds/:id/comments/new", function(req, res){
  //find campground by id
  Campground.findById(req.params.id, function(err, campground){
    if(err){
      console.log(err);
    } else {
      res.render("comments/new", {campground: campground});
    }
  });
});

app.post("/campgrounds/:id/comments", function(req, res){
  //lookup campground using ID
  Campground.findById(req.params.id, function(err, campground){
    if(err){
      console.log(err);
      res.redirect("/campgrounds");
    } else {
      //create new comments
      Comment.create(req.body.comment, function(err, comment){
          if(err){
            console.log(err);
          } else {
            //connect new comment to campground
            campground.comments.push(comment);
            campground.save();
            //redirect to campground show page
            res.redirect('/campgrounds/'+ campground._id);
          }
      });
    }
  });
});

//<!-- **********  Final server startup *********** -->
app.listen(8000, function(){
  console.log("YelpCamp server has started on localhost:8000");
});

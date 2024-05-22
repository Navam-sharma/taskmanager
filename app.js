const express = require('express');
const mongoose = require('mongoose');
const Task = require('./models/task');
var passport = require("passport"),
	bodyParser = require("body-parser"),
	LocalStrategy = require("passport-local"),
	passportLocalMongoose =
		require("passport-local-mongoose")
const User = require("./models/User");
// express app
const app = express();
const path = require("path");
app.use(express.static(path.join(__dirname, 'css')));

// connect to mongodb & listen for requests

const dbURI = "mongodb://localhost:27017/taskmanager";

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true }) //this return promise
  .then((result) =>{ console.log("Database-connected"); })
  //after db connected than it will listen to port3000
  .catch(err => console.log(err)); //else errors will be shown  app.listen(8080)

// register view engine
app.set('view engine', 'ejs');
 
// middleware & static files
app.use(express.static('public')); //this will helps to use style.css file
app.use(express.urlencoded({ extended: true })); //this will helps to get submitted data of form in req.body obj
app.use(require("express-session")({
	secret: "Rusty is a dog",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// home routes
app.get('/', (req, res) => {
  res.render('index', { title: 'index page' }); //this will redirect page to /tasks
});

//tasks i.e index route
app.get('/tasks',(req,res)=>{
  console.log("req made on"+req.url);
   Task.find().sort({createdAt:-1})//it will find all data and show it in descending order
    .then(result => { 
      res.render('secret', { tasks: result ,title: 'Home' }); //it will then render index page along with tasks
    })
    .catch(err => {
      console.log(err);
    });
})
//888888888888888888888888888
// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
	res.render("secret", { tasks: result ,title: 'Home' });
});

// Showing register form
app.get("/register", function (req, res) {
	res.render("register", { title: 'register' });
});

// Handling user signup
app.post("/register", async (req, res) => {
	const user = await User.create({
	username: req.body.username,
	password: req.body.password
	});
  return res.render("login", { title: 'login' });

	// return res.status(200).json(user);
});

//Showing login form
app.get("/login", function (req, res) {
	res.render("login", { title: 'login' });
});


//Handling user login
app.post("/login", async function(req, res){
	try {
		// check if the user exists
		const user = await User.findOne({ username: req.body.username });
		if (user) {
		//check if password matches
		const result = req.body.password === user.password;
		if (result) {
      Task.find().sort({createdAt:-1})//it will find all data and show it in descending order
      .then(result => { 
        res.render('secret', { tasks: result ,title: 'Home' }); //it will then render index page along with tasks
      })
      .catch(err => {
        console.log(err);
      });
			
		} else {
			res.status(400).json({ error: "password doesn't match" });
		}
		} else {
		res.status(400).json({ error: "User doesn't exist" });
		}
	} catch (error) {
		res.status(400).json({ error });
	}
});

//Handling user logout
app.get("/logout", function (req, res) {
	req.logout(function(err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});



function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
}
//888888888888888888888

//route for task create
app.get('/task/create',(req,res)=>{
  console.log("GET req made on"+req.url);
  res.render('addtask',{title:'Add-Task'});
})

//route for tasks/withvar
app.get('/tasks/:id', (req, res) => {
  const id = req.params.id;
  Task.findById(id)
    .then(result => {
      res.render('details', { task: result, action:'edit',title: 'Task Details' });
    })
    .catch(err => {
      console.log(err);
    });
});

//route for edit/name/action variable that will display current value to input field
app.get('/edit/:name/:action',(req,res)=>{
  const name = req.params.name;
  console.log("req made on"+req.url);
  Task.findOne({name:name})
    .then(result => {
      res.render('edit', { task: result ,title: 'Edit-Task' });
    })
    .catch(err => {
      console.log(err);
    });
})

//submitting data routes
  app.post('/task/create',(req,res)=>{
  console.log("POST req made on"+req.url);
  console.log("Form submitted to server");


  /*Note: when you are passing form obj directly to collection using model you
          have to give same name in form of that data that is to be passed in database 
          and that name is declared inside schema*/
  const task = new Task(req.body); //passing object of form data directly to collection
  task.save() //then saving this to database and this return promise
    .then(result => {
      res.redirect('/tasks');//is success save this will redirect to home page
    })
    .catch(err => { //if data not saved error showed
      console.log(err);
    });

})

//route for updating tasks data
app.post('/edit/:id',(req,res)=>{
  console.log("POST req made on"+req.url);
  Task.updateOne({_id:req.params.id},req.body) //then updating that task whose id is get from url 
                                               //first passing id which task is to be updated than passing update info
    .then(result => {
      res.redirect('/tasks');//is success save this will redirect to home page
      console.log("tasks profile Updated");
    })
    .catch(err => { //if data not saved error showed
      console.log(err);
    });

})


//routes for deleting tasks by getting tasks name from url then finding that  tasks then doing delete
app.post('/tasks/:name',(req,res)=>{ //form action of details.ejs pass name of task that later is assume as name
  const name = req.params.name;
  console.log(name);
  Task.deleteOne({name:name})
  .then(result => {
    res.redirect('/tasks');
  })
  .catch(err => {
    console.log(err);
  });
})

//404 errors routes
//this will auto run incase no routes
//Note: must put this route at last route list
app.use((req,res)=>{
  console.log("req made on"+req.url);
  res.render('404',{title:'NotFound'});
})



var port = process.env.PORT || 8000;
app.set("port", port);
app.listen(port, () => {
  console.log("Server running at port " + port);
});



if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const ExpressError = require("./utils/expressError.js");


const listingsRouter = require("./routes/listing.js")
const reviewsRouter= require("./routes/review.js");
const userRouter = require("./routes/user.js");

const { register } = require("module");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

main()
   .then(()=>{
       console.log("Connected to DB");
   })
   .catch((err)=>{
        console.log(err);
   })

async function main(){
    await mongoose.connect(MONGO_URL);
}

let port = 8080;

const sessionOptions={
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7,
        httpOnly:true,
    },

};

// app.get("/",(req,res)=>{
//     res.send("Hi, I am root");
// })


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser =req.user;
    next();
})

// app.get("/demouser",async (req,res)=>{
//     let fakeuser = new User({
//         email:"dfhjkd@gmail.com",
//         username: "dkf",
//     })
//     let regisdUser = await User.register(fakeuser,"helloworld");
//     res.send(regisdUser);

// })

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);



app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found!!"));
})
app.use((err,req,res,next)=>{
    let {statuscode=500,message="something went wrong"} = err;
    res.status(statuscode).render("error.ejs",{message});
    // res.status(statuscode).send(message);

})

app.listen(port,()=>{
    console.log(`server is listening to ${port}`);
})


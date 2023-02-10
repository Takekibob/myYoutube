/*Setting*/
require('dotenv').config()
const express = require("express");
const mySQL = require("mysql");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const googleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const mySQLStore = require("express-mysql-session")(session);
const ejs = require("ejs");
const app = express();
const env = process.env.NODE_ENV || 'development';
const db = require('./config/db')[env];
const fileUpload = require('express-fileupload');
const {Sequelize} = require("sequelize");


app.use(fileUpload());

app.use(session({
    key: "session_cookie_name",
    secret: "session_cookie_secret",
    store: new mySQLStore(db.database),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000*60*60*24
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(__dirname + '/public'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

/* Ejs */
app.set('view engine', 'ejs');

/* Database */
const connection = mySQL.createConnection(db.database);
connection.connect((err)=>{
    if(!err){ console.log("connected to mysql!"); }
    else{ console.log("failed to connect to mySQL!"+err.stack); }
})

/*Passport JS*/
const customFields={
    usernameField:'email',
    passwordField:'password',
};

validPassword = (password,hash,salt)=>{
    const hashVerify=crypto.pbkdf2Sync(password,salt,10000,60,'sha512').toString('hex');
    return hash === hashVerify;
}

const verifyCallback=(email,password,done)=>{
    connection.query('SELECT * FROM users WHERE email = ? ', [email], (error, results, fields)=>{
        if (error)return done(error);
        if(results.length==0||results[0].active==0)
        { return done(null,false); }

        const isValid=validPassword(password,results[0].hash,results[0].salt);
        user={id:results[0].id,email:results[0].email,hash:results[0].hash,salt:results[0].salt};
        if(isValid){ return done(null,user); }
        else{ return done(null,false); }
    });
}

const strategy=new LocalStrategy(customFields,verifyCallback);
passport.use(strategy);


passport.serializeUser((user,done)=>{
    console.log("inside serialize");
    done(null,user.id)
});

passport.deserializeUser((userId,done)=>{
    console.log('deserializeUser'+ userId);
    connection.query('SELECT * FROM users where id = ?',[userId], function(error, results) {
            done(null, results[0]);
    });
});

/*Routing*/
const Router = require("./router/Route");
app.use('/',Router);

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'mysql'
});

/*Start*/
app.listen(3000, ()=>{
    console.log("successfully this app was connected!!")
})

require('dotenv').config()
const express = require("express");
const mySQL = require("mysql");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const mySQLStore = require("express-mysql-session")(session);
const ejs = require("ejs");
const app = express();
const env = process.env.NODE_ENV || 'development';
const db = require('./config/db')[env];
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
// const route = require("./router/route");

console.log(db.database);
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

// set the view engine to ejs
app.set('view engine', 'ejs');

const connection = mySQL.createConnection(db.database);
connection.connect((err)=>{
    if(!err){ console.log("connected to mysql!"); }
    else{ console.log("failed to connect to mySQL!"+err.stack); }
})

const customFields={
    usernameField:'email',
    passwordField:'password',
};

/*Passport JS*/
validPassword = (password,hash,salt)=>{
    const hashVerify=crypto.pbkdf2Sync(password,salt,10000,60,'sha512').toString('hex');
    return hash === hashVerify;
}

const verifyCallback=(email,password,done)=>{

    connection.query('SELECT * FROM users WHERE email = ? ', [email], (error, results, fields)=>{
        if (error)return done(error);
        if(results.length==0)
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

let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: process.env.MAIL_SECURE,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

/*routes*/
app.get('/', (req, res, next) => {
    res.render("index");
});


app.get('/register', (req, res, next) => {
    res.render('register', {notExist: false})
});

app.post('/register', async(req,res,next)=>{
    connection.query('Select * from users where email =? ', [req.body.email], function(error, results, fields) {
        if(error){
            console.log(error);
        }
        else{
            console.log(results);
            if(results.length>0){ res.redirect('/userAlreadyExists') }
            else{
                console.log("Inside post");
                console.log(req.body.name);
                console.log(req.body.email);
                console.log(req.body.password);
                const salt= crypto.randomBytes(32).toString('hex');
                const hash= crypto.pbkdf2Sync(req.body.password,salt,10000,60,'sha512').toString('hex');
                console.log(salt);
                console.log(hash);
                connection.query('Insert into users(name,email,hash,salt,isAdmin) values(?,?,?,?,0) ', [req.body.name,req.body.email,hash,salt], function(error, results, fields) {
                if (error){
                    console.log("ERROR");
                    console.log(error);
                }
                else {


                    const mailOptions = {
                        from: process.env.MAIL_USER, // アプリのメールアドレス
                        to: req.body.email, // 相手のメールアドレス
                        subject: 'メールの確認', //タイトル
                        html: '<h2 style="color:#ff6600;">Hello World!,Welcome to NotALone!</h2>',
                    };

                    transport.sendMail(mailOptions, function(err, info) {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log(info);
                        }
                    });

                    if(req.files){
                        connection.query('Insert into pictures(user_id,name,data) values((Select id from users where email = ?),?,?) ', [req.body.email, req.files.img.name, req.files.img.data], function(error, results, fields) {
                            if(error){
                                console.log("IMG_ERROR");
                                console.log(error);
                                res.redirect('/login');
                            }
                            else{
                                res.redirect('/login');
                            }
                        });
                    }
                    console.log("Successfully Entered");
                }
            });
            }
        }
    });
});

app.get('/login', (req, res, next) => {
    res.render('login');
});
app.post('/login',passport.authenticate('local',{failureRedirect:'/login-failure',successRedirect:'/login-success'}));

app.get('/logout', (req, res, next) => {
 req.logout((err)=>{
    if (err) { return next(err);}
    res.redirect('/');
  }); //delets the user from the session
});
app.get('/login-success', (req, res, next) => {
 res.send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
});

app.get('/login-failure', (req, res, next) => {
 res.send('You entered the wrong password.');
});

 app.get('/protected-route', (req, res, next) => {
    if(req.isAuthenticated()){
        res.send('<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>');
    }
    else {
        res.redirect('/notAuthorized');
    }

});

app.get('/admin-route',(req, res, next) => {
    if(req.isAuthenticated() && req.user.isAdmin==1){
        res.send('<h1>You are admin</h1><p><a href="/logout">Logout and reload</a></p>');
    }
    else{res.redirect('/notAuthorizedAdmin');}
});

app.get('/notAuthorized', (req, res, next) => {
    console.log("Inside get");
    res.send('<h1>You are not authorized to view the resource </h1><p><a href="/login">Retry Login</a></p>');
});
app.get('/notAuthorizedAdmin', (req, res, next) => {
    console.log("Inside get");
    res.send('<h1>You are not authorized to view the resource as you are not the admin of the page  </h1><p><a href="/login">Retry to Login as admin</a></p>');

});
app.get('/userAlreadyExists', (req, res, next) => {
    console.log("Inside get");
    res.send('<h1>Sorry This username is taken </h1><p><a href="/register">Register with different username</a></p>');
});


app.listen(3000, ()=>{
    console.log("successfully this app was connected!!")
})
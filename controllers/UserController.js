require('dotenv').config()
const mySQL = require("mysql");
const env = process.env.NODE_ENV || 'development';
const db = require('../config/db')[env];
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const nodemailer = require('nodemailer');
const crypto = require("crypto");




const connection = mySQL.createConnection(db.database);
connection.connect((err)=>{
    if(!err){ console.log("connected to mysql!"); }
    else{ console.log("failed to connect to mySQL!"+err.stack); }
})

module.exports = {
    view_get: (req, res, next) => {
    connection.query('Select * from users where id = ?',[req.params.userId], function(error, user, fields) {
            if(!error){
                console.log(user)
                connection.query('Select * from threads where user_id = ?',[user[0].id], function(error, threads, fields) {
                    if(!error){
                        console.log(threads)
                        res.render("users/view", {user: user, threads: threads });
                    }
                    else{
                        console(error);
                        res.send(error);
                    }
                });;
            }
            else{
                console(error);
                res.send(error);
            }
        });
    },
    register_get: (req, res, next) => {
        res.render('register', {notExist: false})
    },

    register_post: async(req,res,next)=>{
        let transport = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_SECURE,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
        connection.query('Select * from users where email =? ', [req.body.email], function(error, results, fields) {
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
                if(results.length>0){
                    res.send('<h1>このメールアドレスはすでに使用されております</h1><p>パスワードを忘れた方は<a href="/register">こちらから</a></p>');
                }
                else{
                    const salt= crypto.randomBytes(32).toString('hex');
                    const hash= crypto.pbkdf2Sync(req.body.password,salt,10000,60,'sha512').toString('hex');
                    const mailCheckPass= crypto.randomUUID({ disableEntropyCache: true })
                    connection.query('Insert into users(name,email,hash,salt,isAdmin,active, active_token) values(?,?,?,?,0,0,?) ', [req.body.name,req.body.email,hash,salt,mailCheckPass], function(error, results, fields) {
                    if (error){
                        console.log("ERROR");
                        console.log(error);
                        res.redirect('/register');
                    }
                    else {
                        const mailOptions = {
                            from: process.env.MAIL_USER, // アプリのメールアドレス
                            to: req.body.email, // 相手のメールアドレス
                            subject: 'Welcome to NotAlone', //タイトル
                            html: '<p style="color:#ff6600;">メールの確認完了は <a href="http://localhost:3000/mailCheckConfirm/'+mailCheckPass+'">ここから</a></p>'
                        };

                        transport.sendMail(mailOptions, function(err, info) {
                            if (err) {
                                console.log(err)
                                res.redirect('/register');//メール失敗の画面に飛ばす
                            } else {
                                console.log(info);
                            }
                        });
                        if(req.files){
                            connection.query('Insert into user_pictures(user_id,name,data) values((Select id from users where email = ?),?,?) ', [req.body.email, req.files.img.name, req.files.img.data], function(error, results, fields) {
                                if(error){
                                    console.log("IMG_ERROR");
                                    console.log(error);
                                    res.redirect('/post-mail-success');
                                }
                                else{
                                    res.redirect('/post-mail-success');
                                }
                            });
                            }
                        else{
                            res.redirect('/post-mail-success');
                        }
                        console.log("Successfully Entered");
                        }
                    });
                }
            }
        });
    },
    mailCallbackPost: (req, res, next) => {
        console.log(req.params);
        console.log(req.body);
        res.redirect('/login');
    },
    loginGet: (req, res, next) => {

        res.render('login');
    },
    loginPost: passport.authenticate('local',{failureRedirect:'/login-failure',successRedirect:'/'}),

    loginFailureGet: (req, res, next) => {
        res.send('ログインに失敗しました。');
    },

    mailSuccessGet:  (req, res, next) => {
        res.send('確認のメールを送信しました。');
    },

    logoutGet: (req, res, next) => {
        req.logout((err)=>{
            if (err) { return next(err);}
            res.redirect('/');
        }); //delets the user from the session
    },
    notAuthlizedPost: (req, res, next) => {
        console.log("Inside get");
        res.send('<h1>You are not authorized to view the resource </h1><p><a href="/login">Retry Login</a></p>');
    },

    mailCheckConfirmGet: (req, res, next) => {
            console.log(req.params.activateToken);
            const activateToken = req.params.activateToken;
            connection.query('Select * from users where active_token =? ', [activateToken], function(error, results, fields) {

                if(!error){

                    if(results[0].active){
                        // res.send('');
                        res.render("alreadyComfirmEmail");
                    }
                    else{
                        var sql = "UPDATE users SET active = 1 WHERE id = " + results[0].id;
                        connection.query(sql, function (err, result) {
                            if (err) throw err;
                            res.send('<h1>メールの確認ができました。</h1><p><a href="/login">ここから</a>ログインしてください</p>');
                        });
                    }

                }else{
                    console.log(error);
                    res.send(error);
                }
            });
    },

    mypageGet: (req, res, next) => {
        if(req.isAuthenticated()){
            res.render("mypage");
        }
        else {
            res.redirect('/login');
        }
    }
}
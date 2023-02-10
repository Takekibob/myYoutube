require('dotenv').config()
const mySQL = require("mysql");
const env = process.env.NODE_ENV || 'development';
const db = require('../config/db')[env];

const connection = mySQL.createConnection(db.database);
connection.connect((err)=>{
    if(!err){ console.log("connected to mysql!"); }
    else{ console.log("failed to connect to mySQL!"+err.stack); }
})

module.exports = {

    create_post: (req, res, next) => {
        if(req.isAuthenticated()){
            connection.query('Insert into comments(user_id, thread_id, content) values(?,?,?) ', [req.user.id,req.params.threadId,req.body.content], function(error, results, fields) {
                if(!error){
                    console.log("コメントの投稿に成功しました。")
                    res.redirect("/threads/view/" + req.params.threadId);
                }
                else{
                    console.log(error);
                    res.send(error);
                }
            });
        }
        else {
            res.redirect('/login');
        }
    },

    edit_get: (req, res, next) => {
        if(req.isAuthenticated()){
            console.log(req.params.commentId);
            connection.query('Select * from comments where id = ?',[req.params.commentId], function(error, result, fields) {
                if(!error){
                    console.log(req.user.id);
                    console.log(result);
                    res.render("comments/edit", {comment: result});
                }
                else{
                    console(error);
                    res.send(error);
                }
            });
        }
        else {
            res.redirect('/login');
        }
    },
    update_post: (req, res, next) => {
        if(req.isAuthenticated()){
            console.log(req.body.content);
            connection.query('UPDATE comments SET content = ? WHERE id = ? ', [req.body.content, req.params.commentId], function(error, results, fields) {
                if(!error){
                    console.log("コメントの投稿に成功しました。")
                    res.redirect("/threads/view/"+req.params.threadId);
                }
                else{
                    console.log(error);
                    res.send(error);
                }
            });
        }
        else {
            res.redirect('/login');
        }

    }

}


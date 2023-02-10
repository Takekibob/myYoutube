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

  list_get : (req, res, next) => {

    connection.query('Select * from threads', function (error, results, fields) {
      if (!error) {
        // console.log(req.user.id);
        console.log(results);
        if (req.isAuthenticated()) {
          res.render("index", { threads: results, userId: req.user.id });
        }
        else {
          res.render("index", { threads: results, userId: "0" });
        }
      }
      else {
        console.log(error);
        res.send(error);
      }
    });
  },

  add_get : (req, res, next) => {
    console.log(req.isAuthenticated());
    if(req.isAuthenticated()){
        res.render("threads/add");
    }
    else {
        res.redirect('/login');
    }
  },

  create_post : (req, res, next) => {

    if(req.isAuthenticated()){
        connection.query('Insert into threads(user_id, title, content) values(?,?,?) ', [req.user.id,req.body.title,req.body.content], function(error, results, fields) {
            if(!error){
                console.log("投稿に成功しました。")
                res.redirect("/");
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

  edit_get : (req, res, next)=>{
    if(req.isAuthenticated()){
        connection.query('Select * from threads where id = ?',[req.params.threadId], function(error, result, fields) {
            if(!error){
                // console.log(req.user.id);
                console.log(result);
                res.render("threads/edit", {thread: result});
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

  update_post : (req, res, next) => {
    if(req.isAuthenticated()){
        connection.query('UPDATE threads SET title = ?, content = ? WHERE id = ? ', [req.body.title,req.body.content, req.params.threadId], function(error, results, fields) {
            if(!error){
                console.log("投稿の更新に成功しました。")
                res.redirect("/threads/view/"+ req.params.threadId);
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

  view_get : (req, res, next) => {

    let didGood = false
    let commentArray =[];

    if(req.isAuthenticated()){
      connection.query('select id from thread_goods WHERE user_id = ? AND thread_id = ?', [req.user.id, req.params.threadId], function(error, threadGoodResult, fields) {
        if(!error){
          console.log();
          if(threadGoodResult.length){
            didGood=true;
          }
        }else{
          console.log(error);
          res.send(error);
        }
      });
    };

    if(req.isAuthenticated()){
      connection.query("SELECT comment_id FROM comment_goods WHERE user_id=?", [req.user.id], (error,commentResults, fields)=>{
        if(!error){
          JSON.parse(JSON.stringify(commentResults)).forEach(result => {
            commentArray.push(result.comment_id)
          });
          console.log(commentArray);
        }else{
          console.log(error);
          res.send(error);
        }
      })
    }

    connection.query('Select threads.id, threads.title, threads.content, users.name as userName, users.id as userId from threads join  users on threads.user_id =users.id where threads.id = ? ', [req.params.threadId], function(error, result, fields) {
        if(!error){
                connection.query('Select users.name as userName, users.id as userID, comments.id, comments.user_id, comments.content  from comments join users on comments.user_id = users.id where comments.thread_id = ? ', [req.params.threadId], function(error, commentResults, fields) {

                    console.log(result);
                    console.log(commentResults);

                    if(req.isAuthenticated()){
                        res.render("threads/view",{thread: result, comments: commentResults, userId: req.user.id, didGood: didGood, commentArray: commentArray});
                    }
                    else{
                        res.render("threads/view",{thread: result, comments: commentResults, userId: "0", didGood: false, commentArray:"0"})
                    }
                });
        }
        else{
            console.log(error);
            res.send(error);
        }
    });
  }

}

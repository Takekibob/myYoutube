require('dotenv').config()
const mySQL = require("mysql");
const env = process.env.NODE_ENV || 'development';
const db = require('../config/db')[env];

const connection = mySQL.createConnection(db.database);
connection.connect((err)=>{
    if(!err){ console.log("connected to mysql!"); }
    else{ console.log("failed to connect to mySQL!"+err.stack); }
})

module.exports ={
  post_threadCreate:(req,res,next)=>{
    if(req.isAuthenticated()){

      console.log(req.user.id);
      console.log(req.params.threadId);
      connection.query("INSERT INTO thread_goods (user_id, thread_id) VALUES(?,?)",[req.user.id, Number(req.params.threadId)])
      res.redirect('/threads/view/'+ req.params.threadId);

    }
    else {
        res.redirect('/login');
    }
  },
  post_threadDestroy:(req,res,next)=>{
    if(req.isAuthenticated()){

      console.log(req.user.id);
      console.log(req.params.threadId);
      connection.query("DELETE FROM thread_goods where user_id=? and thread_id=?",[req.user.id, Number(req.params.threadId)])
      res.redirect('/threads/view/'+ req.params.threadId);

      }
      else {
          res.redirect('/login');
      }
  },
  post_commentCreate:(req,res,next)=>{
    if(req.isAuthenticated()){

      connection.query("SELECT id FROM comment_goods WHERE user_id =? AND comment_id =?",[req.user.id, Number(req.params.commentId)], (error, commentGoodResult, fields)=>{
        if(!error){
          console.log(commentGoodResult.length);
          if(commentGoodResult.length){
            res.redirect('/threads/view/'+ req.params.threadId);

          }else{
            console.log(req.user.id);
            console.log(req.params.commentId);
            connection.query("REPLACE INTO comment_goods (user_id, comment_id) VALUES(?,?)",[req.user.id, Number(req.params.commentId)])
            res.redirect('/threads/view/'+ req.params.threadId);
          }
        }else{
          console.log(error);
          res.send(error)
        }
      })
    }
    else {
        res.redirect('/login');
    }


  },
  post_commentDestroy:(req,res,next)=>{
    if(req.isAuthenticated()){

      console.log(req.user.id);
      connection.query("DELETE FROM comment_goods where user_id=? and comment_id=?",[req.user.id, Number(req.params.commentId)])
      res.redirect('/threads/view/'+ req.params.threadId);

      }
      else {
          res.redirect('/login');
      }
  },
}
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
    followGet: (req, res, next) => {
        console.log(req.params.targetId)
        if(req.isAuthenticated()){
            if(req.user.id !== Number(req.params.targetId)){
                connection.query('Insert into follows(user_id, follow_id) values(?,?) ', [req.user.id, Number(req.params.targetId)], function(error, results, fields) {
                    if(!error){
                        console.log(results);
                    }else{
                        console.log(error);
                    }
                });
            }
            res.redirect('/users/view/' + req.params.targetId);
        }
        else {
            res.redirect('/login');
        }
    },

}

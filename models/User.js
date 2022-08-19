import mysql from 'mysql';
const env = process.env.NODE_ENV || 'development';
import db from './config/db'
const dbEnv = db[env];
const table = 'users';

module.exports = {

  getUser: function () {
    return new Promise ((resolve, reject) => {
      const con = mysql.createConnection(dbEnv);
      con.query(
        `select id, name, date_format(birthdate,"%Y/%m/%d") as birthdate from ${table}`,  (err, result, fields) => {
          if ( err ) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      con.end();
    });
  },
}
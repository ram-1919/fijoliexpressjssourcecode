    var Pool = require('pg').Pool

    const pool = new Pool({
        user: 'fijoliadmin',
        host: 'localhost',
        database: 'fijoli',
        password: 'fijoli',
        port: 5432,
    })

    ///<summary>
    // returns select statement result
    ///</summary>
    async function Select(fetchQuery){
        //executes query to get list of sys configuration
        return new Promise((resolve, reject)=>{
            pool.query(fetchQuery, (err, result) =>{
                if(err){
                    reject({"status": 400})
                }
                return resolve({"status": 200, "result" : result.rows});
            });
        });
    }

    ///<summary>
    // returns insert statement result
    ///</summary>
    async function Insert(insertQuery){
        //post the user info into user info table
        return new Promise((resolve, reject)=>{
                pool.query(insertQuery,(err, result) =>{
                    if(err){
                        reject({"status": 400});
                    }else{
                        resolve({"status": 200});
                    }
                });
            });
    }

    ///<summary>
    // returns update statement result
    ///</summary>
    async function Update(updateQuery){
        return new Promise((resolve, reject)=>{
            pool.query(updateQuery,(err, result) =>{
                if(err){
                    reject({"status": 400});
                }else{
                    resolve({"status": 200});
                }
            });
        });
    }

    ///<summary>
    // returns delete statement result
    ///</summary>
    async function Delete(insertQuery){

    }

module.exports = {Insert, Select, Update, Delete}
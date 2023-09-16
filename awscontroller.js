
    const AWS = require('aws-sdk');
    require('dotenv').config();

    AWS.config.update({
        accessKeyId: process.env.accessKey,
        secretAccessKey: process.env.secretKey,
    });

    const s3 = new AWS.S3();
    const bucketName = process.env.bucketName;

    ///<summary>
    // upload file 
    ///</summary>
    async function uploadfile(fileData){
        return new Promise((resolve, reject)=>{
            const params = {
                Bucket: bucketName,
                Key: fileData.originalname,
                Body: fileData.buffer,
            };
        
            s3.upload(params, (err, data) => {
                if (err) {
                   return reject({"status": 400});
                }
                // File uploaded successfully, you can do something with the S3 URL here
                const s3Url = data.Location;
                return resolve({"status": 200, "result" : s3Url});
          });
        });
    }

    ///<summary>
    // create folder
    ///</summary>
    async function createfolder(fileData){

    }

    ///<summary>
    // create folder
    ///</summary>
    async function deletefolder(fileData){

    }

    module.exports = {uploadfile, createfolder, deletefolder}
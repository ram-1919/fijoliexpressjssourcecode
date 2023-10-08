
    const AWS = require('aws-sdk');
    require('dotenv').config();

    AWS.config.update({
        accessKeyId: process.env.accessKey,
        secretAccessKey: process.env.secretKey,
    });

    const s3 = new AWS.S3();

    ///<summary>
    // upload file 
    ///</summary>
    async function uploadfile(fileData, foldername, doccategory){
        return new Promise((resolve, reject)=>{
            const timestamp = new Date().getTime();
            const filename  = doccategory + "_" + timestamp + "_" + fileData.originalname
            const params = {
                Bucket: process.env.bucketName,
                Key: foldername + filename,
                Body: fileData.buffer,
            };
        
            s3.upload(params, (err, data) => {
                if (err) {
                   return reject({"status": 400});
                }
                // File uploaded successfully, you can do something with the S3 URL here
                return resolve({"status": 200, "filename" : filename});
          });
        });
    }

    ///<summary>
    // create folder
    ///</summary>
    async function createfolder(folderinfo){
        return new Promise(async(resolve, reject)=>{

            const params = {
                Key: folderinfo.foldername,
                Bucket: process.env.bucketName
            }

            s3.putObject(params, (err,data) => {
                if(err) {
                    return reject({"status": 400});
                }
                const result = data;
                return resolve({"status": 200, "result" : result});
            });
        });
    }

    ///<summary>
    // create folder
    ///</summary>
    async function deletefolder(fileData){

    }

    async function isFolderExists(folderinfo){
        return new Promise((resolve, reject)=>{

            const params = {
                Prefix : folderinfo.foldername,
                Bucket:  process.env.bucketName,
                MaxKeys : 1
            }

            s3.listObjects(params, (err,data) => {
                if(err) {
                    return reject({"status": 400});
                }
                const result = data.Contents.length > 0;
                return resolve({"status": 200, "result" : result});
            });
        });
    }

    module.exports = {uploadfile, createfolder, deletefolder, isFolderExists}
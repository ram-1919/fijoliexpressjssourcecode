
    const awsctrl = require('./awscontroller.js');

    ///<summary>
    // create folder
    ///</summary>
    async function createfolder(folderInfo, whatsapp_number){

        let responseData = {"status":400};
        let lstofS3folders = {};

        const keyfoldernames = Object.keys(folderInfo);
        for (let index = 0; index < keyfoldernames.length; index++) {

            let foldername = folderInfo[keyfoldernames[index]];
            const result = await awsctrl.createfolder({
                foldername: whatsapp_number + "/" + foldername + "/"
            });    

            if(400 == result.status){
                responseData = {"status":400};
                break;
            }

            lstofS3folders[keyfoldernames[index]] = whatsapp_number+"/"+foldername+"/";
            // lstofS3folders.push(whatsapp_number+"/"+foldername+"/");
        }

        responseData = {"status":200, S3folderNames: lstofS3folders};            
        return responseData;
    }

    ///<summary>
    // create folder
    ///</summary>
    async function uploadfile(lstoffiles, uploadfilesInfo, lstofS3foldernames){

        return new Promise(async (resolve, reject)=>{
            let responseData = {"status": 400, s3location:{}};
            try {

                let currentfileIndex        = 0;
                let categoryfilescount      = 0;
                let lstoffolders            = Object.keys(uploadfilesInfo);

                for (let index = 0; index < lstoffolders.length; index++) {
                    categoryfilescount  = categoryfilescount + uploadfilesInfo[lstoffolders[index]];
                    for (let fileIndex = currentfileIndex; fileIndex < categoryfilescount; fileIndex++) {
                        const result = await awsctrl.uploadfile(lstoffiles[fileIndex], lstofS3foldernames[lstoffolders[index]], lstoffolders[index]);
                        if(200 != result.status){
                            throw "failed to upload"
                        }
                        responseData.s3location[fileIndex] = result.filename;
                    }
                    currentfileIndex = currentfileIndex + uploadfilesInfo[lstoffolders[index]];
                }
            } catch (error) {
                responseData = {"status": 400, s3location:{}}
                return reject(responseData);                          
            }

            responseData["status"] = 200;
            return resolve(responseData);                          
        })
    }

    ///<summary>
    // create folder
    ///</summary>
    async function createpostfolder(folderInfo){

        let responseData = {"status":400};
        let lstofS3folders = [];
        for (let index = 0; index < folderInfo.length; index++) {
            let foldername = folderInfo[index];
            const result = await awsctrl.createfolder({
                foldername: foldername + "/"
            });    

            if(400 == result.status){
                responseData = {"status":400};
                break;
            }
            lstofS3folders.push(foldername+"/");
        }

        responseData = {"status":200, S3folderNames: lstofS3folders};            
        return responseData;
    }

    ///<summary>
    // create folder
    ///</summary>
    async function uploadpostfile(lstoffiles, lstofS3foldernames){

        return new Promise(async (resolve, reject)=>{
            let responseData = {"status":400};
            try {
    
                for (let fileIndex = 0; fileIndex < lstoffiles.length; fileIndex++) {
                    const result = await awsctrl.uploadfile(lstoffiles[fileIndex], lstofS3foldernames[0]);
                    if(200 != result.status){
                        throw "failed to upload"
                    }
                }
                
            } catch (error) {
                responseData = {"status":400 };
                return reject(responseData);                          
            }

            responseData = {"status":200 };
            return resolve(responseData);                          

        })
    }

    module.exports = {createfolder, uploadfile, createpostfolder, uploadpostfile}

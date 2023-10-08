
    const express   = require('express');
    const app       = express();
    const multer = require('multer');

    const dbinterface   = require('./dbInterface.js');
    const whatsapp  = require('./whatsappController.js');
    const awsintrface = require('./awsinterface.js');
    const utilities   = require('./utilities.js');

    const allowedOrigins = ["http://localhost:3000"];
    app.use(express.json());
    app.use(function (req, res, next) {

        if (allowedOrigins.includes(req.headers.origin)) {
            res.header("Access-Control-Allow-Origin", req.headers.origin);
        }
        res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    });

    //multer storage variables to store the files in memory and upload to s3
    const storage   = multer.memoryStorage(); // Store files in memory
    const upload    = multer({ storage: storage });

    ///<summary>
    // confirmation api which uploads the certifications and product info
    // to s3 and updates database with user confirmation details
    ///</summary>
    app.post('/confirmregistrationfiles', upload.array('images', 12), async(req, res) => {

        //initialize response data 
        let responseData    = {"status":400};

        try {

            //get user info data from the req object
            const userInfo = JSON.parse(req.body.userInfo) ;
            
            //check file count 
            //if files exists upload files into aws and store in database
            if(0 < req.files.length){
                //get folderlist info based on the userinfo data
                const fldrnamesresult       = await dbinterface.getuploadfolderlstinfo(userInfo.uploadfolderInfo);

                //create folders in aws before uploading the files into aws
                const fldrcreateres  = await awsintrface.createfolder(fldrnamesresult.folderlst, userInfo.whatsapp_number);

                //upload files in the respective created folders in aws
                const uploadres = await awsintrface.uploadfile(req.files, userInfo.uploadfolderInfo, fldrcreateres.S3folderNames);

                //store the uploaded file info of aws in database
                const storeresult = await dbinterface.storefileinfo(userInfo, fldrcreateres.S3folderNames, uploadres.s3location);
            }

            //update the confirmation info into database
            const userInfoResult   = await dbinterface.updateProfile(userInfo);
            responseData    = {"status":200, msg: req.files.length + " uploaded successfully"};

        } catch (error) {
            responseData    = {"status":400};
        }

        res.send(responseData)
    });

    ///<summary>
    //
    ///</summary>
    app.post('/deactivateuser', async(req, res) =>{

        let responseData = {"status": 400};
        try {
            let userinfo  = JSON.parse(JSON.stringify(req.body));
            responseData  = await dbinterface.deactivateUser(userinfo);
        } catch (error) {
            responseData = {"status": 400};
        }
        res.send(responseData);
    })

    ///<summary>
    // confirmation api which uploads the certifications and product info
    // to s3 and updates database with user confirmation details
    ///</summary>
    app.post('/postdata', upload.array('images', 2), async(req, res) => {

        let responseData    = {"status":400};

        try {

            const postInfo   = JSON.parse(req.body.postInfo) ;
            let postfileres   = {"s3location": {}};
            let fldrcreateres = {"S3folderNames":{}};
            
            if(0 < req.files.length){
                
                //get folder info
                const fldrnamesresult       = await dbinterface.getpostfolderlstinfo(postInfo.uploadfolderInfo);

                //create folders before uploading the files
                fldrcreateres  = await awsintrface.createfolder(fldrnamesresult, postInfo.whatsapp_number);

                //upload files in the respective created folders
                postfileres = await awsintrface.uploadfile(req.files, postInfo.uploadfolderInfo, fldrcreateres.S3folderNames);
            }

            //update the confirmation info into database
            const postInfoResult   = await dbinterface.storepostfileinfo(postInfo, fldrcreateres.S3folderNames, postfileres.s3location);
            responseData    = {"status":200, msg: req.files.length + " uploaded successfully"};

        } catch (error) {
            responseData    = {"status":400};
        }

        res.send(responseData)
    });

    ///<summary>
    // register the profile data 
    ///</summary>
    app.post("/register", async(req, res)=>{

        //default response data
        let responseData    =   {"status": 400};

        try {      

            //get initial registrant info
            const signUpData    = JSON.parse(JSON.stringify(req.body));
            
            //validates if registrant number is already registered or not
            await dbinterface.IsUserExists(signUpData);

            //if registrant is not registered then
            //validate for the whatsapp number whether it is registered or not
            signUpData["whatsapp_user_name"]    = await whatsapp.validateWhatsappNumber(signUpData.user_name,signUpData.whatsapp_number);

            //if whatsapp number is valid insert registrant info into database
            responseData    = await dbinterface.registerProfile(signUpData);

        } catch (error) {
            responseData =  {"status": 400};
        }

        //send reponse to the client application
        res.send(responseData);
    });

    app.get("/forgetpwd", async(req, res)=>{

        //default response data
        let responseData = {"status":400};
        try {

            let forgetpwdData = JSON.parse(JSON.stringify(req.query));
            const userinfo    = await dbinterface.getProfileData(forgetpwdData);
            utilities.validateforgetpasswordData(forgetpwdData, userinfo);
            responseData = {"status":200};
        } catch (error) {
            //default response data
            responseData = {"status":400};
        }

        res.send(responseData);
    });

    ///<summary>
    // returns profile data along with sys configuration
    ///</summary>
    app.get("/getregisteredInfo", async(req, res)=>{

        //default response data
        let responseData = {"status":400,"profileData": [], "sysconfigData":[]};

        try {

            //get parameters
            const queryData     = JSON.parse(JSON.stringify(req.query));

            if(null == queryData.whatsapp_number || '' == queryData.whatsapp_number){
                throw "whatsapp number is not valid";
            }
            //get profile data
            const profileData   = await dbinterface.getProfileData(queryData);

            //get sys configuration data
            const sysconfigData = await dbinterface.getsysconfiguration();
        
            //profile and sysconfigData result comparision to send 
            // if(profileData.status == 200 && sysconfigData.status == 200){
                responseData.status                     = 200;
                responseData.profileData                = profileData;
                responseData.sysconfigData              = sysconfigData;
            // }
                
        } catch (error) {
            //do nothing        
            responseData = {"status":400};
        }

        return res.send(responseData);
    })

    ///<summary>
    // updates profile data of a particular person
    ///</summary>
    app.post("/setProfileData", async(req, res)=>{

        let responseData = {"status":400};

        try {
            const profileData   = JSON.parse(JSON.stringify(req.body));
            //get profile data
            responseData   = await dbinterface.updateProfile(profileData);

        } catch (error) {
            //do nothing
            responseData = {"status":400};
        }

        res.send(responseData);
    });

    app.post("/setnewpassword", async(req, res)=>{
        let responseData        = {"status":400};
        try {
            let passwrdData = JSON.parse(JSON.stringify(req.body.pwdData));
            responseData    = await dbinterface.setnewpassword(passwrdData);
        } catch (error) {
            responseData    = {"status":400};
        }

        res.send(responseData);
    });

    ///<summary>
    // returns login credentials state
    ///</summary>
    app.post("/login", async (req, res)=>{
        let responseData        = {"status":400};

        try {

            const inputparams = JSON.parse(JSON.stringify(req.body));

            //get profile data
            const userInfores      = await dbinterface.getProfileData(inputparams);

            //encrypt the password before comparing
            const encryptpassword    = await dbinterface.encryptpassword(inputparams.encrypted_password)
            inputparams["encrypted_password"] = encryptpassword;

            //validates login credentials
            utilities.validateLoginCredentials(inputparams, userInfores);

            //get sys configuration data
            const sysconfigres = await dbinterface.getsysconfiguration();
        
            //profile and sysconfigData result comparision to send 
            responseData.status                     = 200;
            responseData["profileData"]             = userInfores;
            responseData["sysconfigData"]           = sysconfigres;
    
        } catch (error) {
            responseData        = {"status":400};
        }
        res.send(responseData);
    });

    app.listen(3030, ()=>{
        console.log("listening on port 3030");
    });



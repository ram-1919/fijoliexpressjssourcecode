
    const express   = require('express');
    const app       = express();
    const multer = require('multer');
    const path = require('path');
    

    const apiData   = require('./apidata.js');
    const whatsapp  = require('./whatsappController.js');
    const awsctrl   = require('./awscontroller.js');


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
    app.post('/confirmregistration', upload.single('file'), async(req, res) => {

        //set default response data
        let responseData    = {"status": 400};

        try {
                //get file info
                const file = req.file;
                if(file){
                    //upload file to s3
                    responseData     = await awsctrl.uploadfile(file);
                    //if upload fails throws an error
                    if(responseData.status == 400){
                        throw responseData;
                    }
                }

                //get confirmation user info
                const profileData   = JSON.parse(req.body.userInfo);

                //update the confirmation info into database
                responseData   = await apiData.updateProfile(profileData);

            } catch (error) {
                responseData    = {"status": 400};
            }
            //send response 
            res.send(responseData);
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
            responseData        = await apiData.getProfileData(signUpData);

            //if registrant is registered then throw an error message
            if(0 < responseData.result.length){
                throw "data already exists";
            }

            //if registrant is not registered then
            //validate for the whatsapp number whether it is registered or not
            signUpData["whatsapp_user_name"]    = await whatsapp.validateWhatsappNumber(signUpData.user_name,signUpData.whatsapp_number);

            //if whatsapp number is valid insert registrant info into database
            responseData    = await apiData.registerProfile(signUpData);

        } catch (error) {
            responseData =  {"status": 400};
        }

        //send reponse to the client application
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
            const profileData   = await apiData.getProfileData(queryData);

            //get sys configuration data
            const sysconfigData = await apiData.getsysconfiguration();
        
            //profile and sysconfigData result comparision to send 
            if(profileData.status == 200 && sysconfigData.status == 200){
                responseData.status                     = 200;
                responseData.profileData                = profileData;
                responseData.sysconfigData              = sysconfigData;
            }
                
        } catch (error) {
            //do nothing        
            responseData = {"status":400,"profileData": [], "lstoftrainingtypes":[]};
        }

        res.send(responseData);
    })

    ///<summary>
    // updates profile data of a particular person
    ///</summary>
    app.post("/setProfileData", async(req, res)=>{

        let responseData = {};

        try {
            const profileData   = JSON.parse(JSON.stringify(req.body));
            //get profile data
            responseData   = await apiData.updateProfile(profileData);

        } catch (error) {
            //do nothing
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
            const result      = await apiData.getProfileData(inputparams);

            if(result.status == 200){
                const isValid      = (result.result[0].whatsapp_number == inputparams.whatsapp_number) && (result.result[0].encrypted_password == inputparams.password);
                if(isValid){
                    responseData.status = 200;
                }
            }

        } catch (error) {
            
        }
        res.send(responseData);
    });

    ///<summary>
    // returns list of items of each trainer type
    ///</summary>
    app.get("/getItems", (req, res)=>{
        let responseData = {"status":400,"Items": []};

        // if(lstofItems.length > 0){
        //     responseData.status               = 200;
        //     responseData.Items                = lstofItems;
        // }

        res.send(responseData);
    })

    ///<summary>
    // returns list of items of each trainer type
    ///</summary>
    app.get("/user_profile", (req, res)=>{

    })


    app.listen(3030, ()=>{
        console.log("listening on port 3030");
    });



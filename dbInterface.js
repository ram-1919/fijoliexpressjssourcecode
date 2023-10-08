
    const db    = require('./dbcontroller.js');

    ///<summary>
    // returns list of sys configuration
    ///</summary>
    async function getsysconfiguration() {
        //build query to sys configuration from table
        //const fetchQuery = "select * from public.sys_configuration";
        const fetchQuery = "SELECT category_name, json_agg(attribute_value) AS values FROM public.sys_configuration WHERE category_name = 'user_category' and is_active = True GROUP BY category_name  union all SELECT category_name, json_agg(attribute_value) AS values FROM public.sys_configuration WHERE category_name = 'Language' and is_active = True GROUP BY category_name union all  SELECT category_name, json_agg(attribute_value) AS values FROM public.sys_configuration WHERE category_name = 'Currency' and is_active = True GROUP BY category_name union all  SELECT category_name, json_agg(attribute_value) AS values FROM public.sys_configuration WHERE category_name = 'Post' and is_active = True GROUP BY category_name";
        const fetchState     = await db.Select(fetchQuery);
        if(0 === fetchState.result.length){
            throw "login data doesnt exists"
        }
        return(fetchState.result);
    }

    ///<summary>
    // returns profile data
    ///</summary>
    async function getProfileData(inputparams) {

        //build query to get the profile data of particular user info
        const fetchQuery    = "select * from public.md_user_table where whatsapp_number = '" + inputparams.whatsapp_number + "'";
        const fetchstate   = await db.Select(fetchQuery);
        if(0 === fetchstate.result.length){
            throw "login data doesnt exists"
        }
        return(fetchstate.result[0]);
    }   
    
    ///<summary>
    // returns profile data
    ///</summary>
    async function registerProfile(signUpData) {

        //build query to insert register info of user
        const insertQuery   = "insert into public.md_user_table(user_email, whatsapp_number, user_name, gender,is_active, whatsapp_user_name, created_date, updated_date) values ('" + signUpData.user_email +"',"+ signUpData.whatsapp_number + ",'" + signUpData.user_name + "', 'male', 1, '" + signUpData.whatsapp_user_name +"', current_Date, current_timestamp)";
        const result        = await db.Insert(insertQuery);
        return(result);
    }   
    
    ///<summary>
    // returns profile data
    ///</summary>
    async function updateProfile(profileData) {

        //build query to insert register info of user
        profileData.encrypted_password   = await encryptpassword(profileData.encrypted_password);
        const updateQuery   = "update public.md_user_table set location = '" + profileData.location + "', dob ='" + profileData.dob +"', user_category=" + profileData.user_category + ", encrypted_password='" + profileData.encrypted_password +"',user_description= '" + profileData.user_description +"',languages_known= '" + profileData.languages_known +"', location_address='" + profileData.location_address +"',studio_name = '" + profileData.studio_name + "', updated_date = current_timestamp  where user_id = " + profileData.user_id;
        const result        = await db.Update(updateQuery);
        return result;
    }

    ///<summary>
    // returns profile data
    ///</summary>
    async function insertpostData(postdata, s3foldernames) {

        //build query to insert register info of user
        const insertQuery   = "insert into public.md_user_post(user_id, post_category, post_desc, currency_category, currency, post_pic_1, post_pic_2, is_active, created_date, updated_date) values ('" + postdata.user_id +"','"+ postdata.post_category + "','" + postdata.post_desc + "','" + postdata.currency_category + "','" + postdata.currency + "','" + s3foldernames[0] + "','',1,current_Date, current_timestamp)";
        const result        = await db.Insert(insertQuery);
        return(result);
    }   

    //returns category list
    async function getcategorylist(categorytype){
        //query to get list of attribute values based on category type
        const regselectfldrQuery    = "SELECT category_name, json_agg(attribute_value) AS values FROM public.sys_configuration WHERE category_name = '" + categorytype + "' and is_active = True GROUP BY category_name";
        //execute query to fetch list of attribute values
        const dbresult              = await db.Select(regselectfldrQuery);
        //throw an error if fails to fetch list of attribute values
        if(200 != dbresult.status){
            throw "failed to execute query";
        }
        return dbresult.result[0].values; //if success return list of attribute values
    }

    ///<summary>
    // returns profile data
    ///</summary>
    async function getuploadfolderlstinfo(regfoldersinfo){
        //set default response
        const result        = {"status":400,"folderlst":{}};

        //get lst of folders type from table
        let lstoffolders    = await getcategorylist("registration_type") ;
        //initialize upload folder type list 
        Object.keys(regfoldersinfo).map((item)=>{
            if(lstoffolders.includes(item))
                result.folderlst[item] = "document";
            else
                result.folderlst[item] = item;
        })

        //update result info
        if(0 === Object.keys(result.folderlst).length)
            throw "failed to create folder info"

        return result; //return result 
    }
  
    ///<summary>
    // returns status of store file info
    ///</summary>
    async function storepostfileinfo(postinfo, s3lstoffoldernames, s3lstoffilenames){

        //initialize default values
        let ctgryfilecount     = 0;
        let currentfileindex   = 0;
        let keyindex           = 1;
        //get lst of folders to store in database
        const lstoffoldernames = Object.keys(postinfo.uploadfolderInfo);

        //loop each folder to store in database
        for (let index = 0; index < lstoffoldernames.length; index++) {
            keyindex = 1;   //set default index
            //get no.of files count based on category 
            ctgryfilecount = ctgryfilecount + postinfo.uploadfolderInfo[lstoffoldernames[index]];
            //loop inserts file info based on category
            for (let fileindex = currentfileindex; fileindex < ctgryfilecount; fileindex++) {
                let keyItem = lstoffoldernames[index] + "_" + (keyindex++) + "_path";
                postinfo[keyItem] = s3lstoffoldernames[lstoffoldernames[index]] + "/" + s3lstoffilenames[fileindex];
            }
            //initialize next index based on category
            currentfileindex = currentfileindex + ctgryfilecount;
        }

        //get category details
        let doc_category =  await getcategoryid(lstoffoldernames[0]);

        //inserts record uploaded file info in table 
        await insertpostfileInfo(postinfo, doc_category.id);

        return({"status" : 200}); //returns result
    }

    ///<summary>
    // returns status of store file info
    ///</summary>
    async function storefileinfo(userinfo, s3lstoffoldernames, s3lstoffilenames){

        //initialize default values
        let ctgryfilecount     = 0;
        let currentfileindex   = 0;

        //get lst of folders to store in database
        const lstoffoldernames = Object.keys(userinfo.uploadfolderInfo).filter(item => item != 'profilepic');

        //loop each folder to store in database
        for (let index = 0; index < lstoffoldernames.length; index++) {
            //get no.of files count based on category 
            ctgryfilecount = ctgryfilecount + userinfo.uploadfolderInfo[lstoffoldernames[index]];
            //loop inserts file info based on category
            for (let fileindex = currentfileindex; fileindex < ctgryfilecount; fileindex++) {
                //get category details
                let doc_category =  await getcategoryid(lstoffoldernames[index]);
                //inserts record uploaded file info in table 
                await insertuploadfileInfo(userinfo.user_id, doc_category.id, 
                        s3lstoffilenames[fileindex], s3lstoffoldernames[lstoffoldernames[index]]);
            }
            //initialize next index based on category
            currentfileindex = currentfileindex + ctgryfilecount;
        }

        return({"status" : 200}); //returns result
    }

    //returns category id based on attribute value type
    async function getcategoryid(attributetype){

        const docctgryQuery = "SELECT id FROM public.sys_configuration where attribute_value = '" + attributetype + "'";
        const categoryres   = await db.Select(docctgryQuery);
        if(200 != categoryres.status){
            throw "failed to execute query";
        }

        return categoryres.result[0];
    }

    //insert uploaded file info into database
    async function insertuploadfileInfo(user_id, doc_category_id, documentname, uploadpath){

        let docinsertQuery = "INSERT INTO public.md_user_documents(user_id, document_category, document_name, upload_path, is_active, created_date, updated_date) VALUES (" + user_id + "," + doc_category_id + ",'" + documentname + "','" + uploadpath +"',1,current_Date, current_timestamp)";
        let docinsertres   = await db.Insert(docinsertQuery);
        if(200 != docinsertres.status){
            throw "failed to execute query";
        }
    }

    //insert uploaded file info into database
    async function insertpostfileInfo(postinfo, post_category_id){

        let postinsertQuery = "INSERT INTO public.md_user_post(user_id, post_category, post_desc, currency_category, currency, post_pic_1_path, post_video_1_path, is_active, created_date, updated_date)VALUES (" + postinfo.user_id + "," + post_category_id + ",'" + postinfo.post_desc + "'," + postinfo.currency_category + "," + postinfo.currency + ",'" + postinfo.post_pic_1_path + "','" +  postinfo.post_video_1_path + "', 1 , current_Date, current_timestamp)";
        let postinsertres   = await db.Insert(postinsertQuery);
        if(200 != postinsertres.status){
            throw "failed to execute query";
        }
    }
 

    ///<summary>
    // returns profile data
    ///</summary>
    async function getpostfolderlstinfo(postfoldersinfo){
        //set default response
        const folderlst        = {};

        //initialize upload folder type list 
        Object.keys(postfoldersinfo).map((item)=>{
            folderlst[item] = "Postfiles";
        })

        //update result info
        if(0 == Object.keys(folderlst).length){
            throw "folder info doesnot exists";
        }

        return folderlst; //return result 
    }

    async function deactivateUser(userinfo){
        const deactivateusrQry = "update public.md_user_table set is_active = 0 where user_id = " + userinfo.user_id;
        const deactivateusrres = await db.Update(deactivateusrQry);
        return deactivateusrres;
    }

    async function encryptpassword(password){
        const encryptpwdqry  = "select password_encryption('"+ password +"')";
        const encryptpwdres  = await db.Select(encryptpwdqry);
        if(0 == encryptpwdres.result.length){
            throw "error occurred while encrypting password"
        }
        return encryptpwdres.result[0].password_encryption;
    }

    async function setnewpassword(userinfo){
        const encryptpwdres     =   await encryptpassword(userinfo.createpwd)
        const pwdQuery  = "update public.md_user_table set encrypted_password = '"+ encryptpwdres.result[0].password_encryption +"' where whatsapp_number = '" + userinfo.whatsapp_number + "'";
        const pwdres    = await db.Update(pwdQuery);
        if(200 !== pwdres.status){
            throw "failed to update";
        }
        return true;
    }

    ///<summary>
    // returns profile data
    ///</summary>
    async function IsUserExists(inputparams) {

        //build query to get the profile data of particular user info
        const fetchQuery    = "select * from public.md_user_table where whatsapp_number = '" + inputparams.whatsapp_number + "'";
        const fetchstate   = await db.Select(fetchQuery);
        if(1 === fetchstate.result.length){
            throw "Please use different credentials"
        }
        return(fetchstate.result[0]);
    }   

    module.exports = {getsysconfiguration,insertuploadfileInfo, 
        getProfileData, registerProfile, updateProfile, insertpostData, 
        getuploadfolderlstinfo, storefileinfo, getcategoryid, getpostfolderlstinfo, 
        insertpostfileInfo, storepostfileinfo, deactivateUser, setnewpassword, 
        encryptpassword, IsUserExists}

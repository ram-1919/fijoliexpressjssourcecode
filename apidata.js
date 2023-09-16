
    const db    = require('./databasecontroller.js');

    ///<summary>
    // returns list of sys configuration
    ///</summary>
    async function getsysconfiguration() {

        //build query to sys configuration from table
        const fetchQuery = "select * from public.sys_configuration";
        const result     = await db.Select(fetchQuery);
        return(result);
    }

    ///<summary>
    // returns profile data
    ///</summary>
    async function getProfileData(inputparams) {

        //build query to get the profile data of particular user info
        const fetchQuery = "select * from public.md_user_table where whatsapp_number = '" + inputparams.whatsapp_number + "'";
        const result     = await db.Select(fetchQuery);
        return(result);
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
        const updateQuery   = "update public.md_user_table set location = '" + profileData.location + "', dob ='" + profileData.dob +"', user_category=" + profileData.user_category + ", encrypted_password='" + profileData.encrypted_password +"',user_description= '" + profileData.user_description +"',languages_known= '" + profileData.languages_known +"', updated_date = current_timestamp  where user_id = " + profileData.user_id;
        const result        = await db.Update(updateQuery);
        return result;
    }
    
    module.exports = {getsysconfiguration, getProfileData, registerProfile, updateProfile}

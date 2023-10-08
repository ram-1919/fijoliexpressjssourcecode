
const {format} = require('date-fns');

//validates user logged in credentials
//loginData holds the user entered data
//userdbData holds the db data
function validateLoginCredentials (loginData, userdbData) {

    if((loginData.whatsapp_number !== userdbData.whatsapp_number) || 
        (loginData.encrypted_password !== userdbData.encrypted_password)){
        throw "Invalid credentials";
    }

    return true;
}

function validateforgetpasswordData(forgetpwdData, userdbData){

    const converted_date = format(userdbData.dob, 'yyyy-MM-dd');
    if((forgetpwdData.whatsapp_number !== userdbData.whatsapp_number) || 
        (forgetpwdData.user_email !== userdbData.user_email)          ||
        (forgetpwdData.dob        !== converted_date)){
        throw "Invalid credentials";
    }

    return true;


}

module.exports = {validateLoginCredentials, validateforgetpasswordData}
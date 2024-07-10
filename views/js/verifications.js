$(document).ready(()=>{
    //alert(); test connection

    var usernameValidate = false;
    var passwordValidate = false;
    var repeatPasswordValidate = false;

    $('#signupButton').prop('disabled', true); //disable button

    //for username verification
    $('#username').on('input', function() {
        var username = $(this).val(); //get username value
        //display errors
        if(username.length == 0){
            $('.usernameError').text(''); // error set to nothing 
            $('#username').removeClass('valid').removeClass('invalid'); // remove everything
            usernameValidate = false;
        }else if(username.length < 3){
            $('.usernameError').text('Username must be at least 3 characters long.');
            $('#username').addClass('invalid').removeClass('valid');
            usernameValidate = false;
        } else if(username.length > 10){
            $('.usernameError').text('Username cannot exceed 10 characters.');
            $('#username').addClass('invalid').removeClass('valid');
            usernameValidate = false;
        } else {
            $('.usernameError').text(''); // error set to nothing
            $('#username').addClass('valid').removeClass('invalid');
            usernameValidate = true;
        }
        checkIfValid(usernameValidate, passwordValidate, repeatPasswordValidate)
    });

    //for password verifications
    $('#password').on('input', function() {
        var password = $(this).val(); //get password value
        var len = false;
        var upper = false;
        var number = false;

        if(password.length == 0){
            //reset colors for every req for clean look
            $('.passLenght').removeClass('error').removeClass('correct');
            $('.passUpper').removeClass('error').removeClass('correct');
            $('.passNumbers').removeClass('error').removeClass('correct');
            len = false;
        } else if(password.length < 8) {
            $('.passLenght').addClass('error').removeClass('correct');
            len = false;
        } else {
            $('.passLenght').addClass('correct').removeClass('error');
            len = true;
        }


        //check for uppercase
        for(var x in password){
            var getUpper = password[x].toUpperCase()
            //if we found the bool break and set to green
            if(getUpper == password[x] && isNaN(getUpper)) {
                $('.passUpper').addClass('correct').removeClass('error');
                upper = true;
                break;
            }
            //not finding the upper set to error
            $('.passUpper').addClass('error').removeClass('correct');
            upper = false;
        }

        //check for numbers
        for(var x in password){
            var checkNumber = password[x];
            //if we found the number break and set to green
            if(!isNaN(checkNumber)) {
                $('.passNumbers').addClass('correct').removeClass('error');
                number = true;
                break;
            }
            //not finding the number set to error
            $('.passNumbers').addClass('error').removeClass('correct');
            number = false;
        }

        if(len && upper && number) {
            passwordValidate = true;
        }
        checkIfValid(usernameValidate, passwordValidate, repeatPasswordValidate)
    });

    //for repeat password
    $('#repeatpassword').on('input', function() {
        var repeatpassword = $(this).val(); //get repeat password value
        if(repeatpassword.length == 0){
            //reset color
            $('.passMatch').removeClass('error').removeClass('correct');
            repeatPasswordValidate = false;
        }
        if(repeatpassword == $('#password').val()){
            $('.passMatch').addClass('correct').removeClass('error');
            repeatPasswordValidate = true;
        } else {
            $('.passMatch').addClass('error').removeClass('correct');
            repeatPasswordValidate = false;
        }
        checkIfValid(usernameValidate, passwordValidate, repeatPasswordValidate)
    })

})

function checkIfValid(username, password, repeatPassword){
    if(username && password && repeatPassword){
        $('#signupButton').prop('disabled', false); //enable button
    }
}
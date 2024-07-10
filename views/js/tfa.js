$(document).ready(()=>{
    //we want to put the input from that box to hidden
    $('#emailSingIn').on('input', function() {
        var getInput = $(this).val();
        console.log(getInput);
        $("#emailTFa").val(getInput);
    });
})
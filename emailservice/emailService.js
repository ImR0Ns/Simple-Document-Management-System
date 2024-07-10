//for email handling
const nodemailer = require('nodemailer');

//
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: '', //your email (example@gmail.com)
            pass: '', // your password
        },
    });
}

//send registration email
async function sendRegistrationEmail(userEmail, title, name, verificationLink) {
    const transporter = createTransporter();

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: userEmail,
        subject: title,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        width: 80%;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .header {
                        text-align: center;
                        padding: 10px 0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #4CAF50;
                    }
                    .content {
                        padding: 20px;
                    }
                    .content p {
                        margin: 0;
                        padding: 5px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to DocuTrack!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${name},</p>
                        <p>Thank you for registering with DocuTrack. We are thrilled to have you on board.</p>
                        <p>Your account has been successfully created, and you can now access all the features and benefits we offer.</p>
                        <p>To get started, please verify your email address by clicking the link below:</p>
                        <p><a href="${verificationLink}" style="color: #4CAF50;">Verify Email</a></p>
                        <p>If the link doesn't work, please copy and paste the following URL into your browser:</p>
                        <p>${verificationLink}</p>
                        <p>If you have any questions, feel free to contact our support team at support@DocuTrack.com.</p>
                        <p>Best regards,<br>DocuTrack Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 DocuTrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    await transporter.sendMail(mailOptions);
}

//send Two Factor Auth code
async function send2FAEmail(userEmail, token) {
    const transporter = createTransporter();
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: userEmail,
        subject: 'Your 2FA Code',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        width: 80%;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .header {
                        text-align: center;
                        padding: 10px 0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #4CAF50;
                    }
                    .content {
                        padding: 20px;
                    }
                    .content p {
                        margin: 0;
                        padding: 5px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Your 2FA Code</h1>
                    </div>
                    <div class="content">
                        <p>Dear User,</p>
                        <p>Your 2FA code is: <strong>${token}</strong></p>
                        <p>Please enter this code in the application to proceed.</p>
                        <p>If you did not request this code, please ignore this email.</p>
                        <p>Best regards,<br>DocuTrack Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 DocuTrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    await transporter.sendMail(mailOptions);
}

// Send password reset email
async function sendPasswordResetEmail(userEmail, name, resetLink) {
    const transporter = createTransporter();
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: userEmail,
        subject: 'Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        width: 80%;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .header {
                        text-align: center;
                        padding: 10px 0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #4CAF50;
                    }
                    .content {
                        padding: 20px;
                    }
                    .content p {
                        margin: 0;
                        padding: 5px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${name},</p>
                        <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                        <p><a href="${resetLink}" style="color: #4CAF50;">Reset Password</a></p>
                        <p>If the link doesn't work, please copy and paste the following URL into your browser:</p>
                        <p>${resetLink}</p>
                        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                        <p>Best regards,<br>DocuTrack Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 DocuTrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    await transporter.sendMail(mailOptions);
}
// Send document share email
async function sendShareDocumentEmail(userEmail, senderName, documentTitle, documentLink, message) {
    const transporter = createTransporter();
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: userEmail,
        subject: 'Document Shared With You',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        width: 80%;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .header {
                        text-align: center;
                        padding: 10px 0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #4CAF50;
                    }
                    .content {
                        padding: 20px;
                    }
                    .content p {
                        margin: 0;
                        padding: 5px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #888;
                    }
                    .button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 10px;
                        background-color: #4CAF50;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Document Shared With You</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${userEmail},</p>
                        <p><strong>${senderName}</strong> has shared a document with you.</p>
                        <p><strong>Document Title:</strong> ${documentTitle}</p>
                        <p><strong>Message:</strong> ${message}</p>
                        <p>You can view or download the document by clicking the button below:</p>
                        <p style="text-align: center;">
                            <a href="${documentLink}" class="button">View Document</a>
                        </p>
                        <p>If the link doesn't work, please copy and paste the following URL into your browser:</p>
                        <p>${documentLink}</p>
                        <p>Best regards,<br>DocuTrack Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 DocuTrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    await transporter.sendMail(mailOptions);
}

async function sendDocumentEditedEmail(userEmail, senderName, documentTitle, documentLink) {
    const transporter = createTransporter();
    const mailOptions = {
        from: 'your-email@gmail.com', // Replace with your email
        to: userEmail,
        subject: 'Document Edited Notification',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        width: 80%;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .header {
                        text-align: center;
                        padding: 10px 0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #4CAF50;
                    }
                    .content {
                        padding: 20px;
                    }
                    .content p {
                        margin: 0;
                        padding: 5px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #888;
                    }
                    .button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 10px;
                        background-color: #4CAF50;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Document Edited Notification</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${userEmail},</p>
                        <p><strong>${senderName}</strong> has edited a document that was shared with you.</p>
                        <p><strong>Document Title:</strong> ${documentTitle}</p>
                        <p>You can view or download the updated document by clicking the button below:</p>
                        <p style="text-align: center;">
                            <a href="${documentLink}" class="button">View Document</a>
                        </p>
                        <p>If the link doesn't work, please copy and paste the following URL into your browser:</p>
                        <p>${documentLink}</p>
                        <p>Best regards,<br>DocuTrack Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 DocuTrack. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendRegistrationEmail,
    send2FAEmail,
    sendPasswordResetEmail,
    sendShareDocumentEmail,
    sendDocumentEditedEmail
};
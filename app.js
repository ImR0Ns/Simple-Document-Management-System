//server init
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express()
const port = 3000


const multer = require('multer');
const { PDFDocument, appendBezierCurve } = require('pdf-lib');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));
app.get('/pdfeditor', (req, res) => {
    res.sendFile(path.join(__dirname, 'pdfeditor.html'));
});

// Set up the storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage });

//body-parser to get the post data
var bodyParser = require('body-parser'); 

//database connection
const db = require('./mongodb/db');
//user schema
const UserSchema = require('./mongodb/userSchema');
//verification email
const VerificationToken = require('./mongodb/verificationEmail');
//two factor auth sender
const TwoFAToken = require('./mongodb/twoFAToken');
//url parse
const urls = require('url');
// email handling
const { sendRegistrationEmail, send2FAEmail, sendPasswordResetEmail, sendShareDocumentEmail, sendDocumentEditedEmail } = require('./emailservice/emailService');
//crypto for tokens
const crypto = require('crypto');
//To save PDF
const PDFSave = require('./mongodb/pdf');
//to reset password
const PasswordResetToken = require('./mongodb/passwordReset');
//for folder
const Folder = require('./mongodb/document');


//set the view to ejs
app.set('view engine', 'ejs');

//allow using css and js external files
app.use(express.static(__dirname + '/views'));

//be able to read the submit from post
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Configure session middleware
app.use(session({
    secret: 'secretkeybyme', //you can modify this key 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient(),
        dbName: 'test',
        collectionName: 'sessions',
        mongoOptions: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

//homepage 
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.render('index');
    }
});

//login page
app.get('/signin', (req, res)=>{
    var q = urls.parse(req.url, true).query;
    var errorMessage = q.error;
    res.render('signin', { errorMessage });
})
app.post('/signin', async  (req, res)=>{
    const { email, password, tfa } = req.body;
    try {
        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.redirect('/signin?error=The account does not exist');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.redirect('/signin?error=Invalid password');
        }

        const validToken = await TwoFAToken.findOne({ userId: user._id, token: tfa });
        if (!validToken) {
            return res.redirect('/signin?error=Invalid 2FA code');
        }


        // Attempt to delete the token
        await TwoFAToken.deleteOne({ _id: validToken._id });

        // save user session
        req.session.userId = user._id;
        req.session.email = user.email;

        // redirect to dashboard
        res.redirect('/dashboard?message=success');

        
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('An error occurred during login.');
    }
})

//send two factor auth
app.post('/sendtfa', async (req, res)=>{
    const { emailTFA } = req.body;

    try {
        const user = await UserSchema.findOne({ email: emailTFA });
        if (!user) {
            return res.redirect('/signin?error=The account does not exist');
        }

        const token = crypto.randomBytes(3).toString('hex'); 
        const twoFAToken = new TwoFAToken({
            userId: user._id,
            token: token,
        });
        
        await twoFAToken.save();

        console.log(token);

        await send2FAEmail(emailTFA, token);
        
    } catch (error) {
        console.error('Error sending 2FA code:', error);
        res.status(500).send('An error occurred while sending the 2FA code.');
    }
})

//register page
app.get('/signup', (req, res)=>{
    var q = urls.parse(req.url, true).query;
    var errorMessage = q.error;
    var successMessage = q.success;
    res.render('signup', { errorMessage, successMessage });
})

app.post('/signup', async (req, res) => {
    const { username, email, password, repeatpassword } = req.body;
    try {
        // check if user already exists
        let user = await UserSchema.findOne({ email });
        if (user) {
            return res.redirect('/signup?error=Email already in use');
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user
        user = new UserSchema({ email, password: hashedPassword, name: username });
        await user.save();

        // create verification token
        const token = crypto.randomBytes(32).toString('hex');

        const verificationToken = new VerificationToken({
             userId: user._id,
             token: token,
        });
        await verificationToken.save();

        // Create verification link
        const verificationLink = `http://localhost:3000/verify?token=${token}`;

        //send email
        await sendRegistrationEmail(email, 'Welcome to MagiContract', username, verificationLink);
        
        res.redirect('/signup?success=Account created successfully');
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// sign out code
app.get('/signout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('An error occurred while signing out.');
        }

        res.redirect('/signin?error=You sign out successfully!');
    });
});

//verify the email verification token
app.get('/verify', async (req, res)=>{
    var q = urls.parse(req.url, true).query;
    var token = q.token;

    try {
        // find the verification token
        const verificationToken = await VerificationToken.findOne({ token: token });

        if (!verificationToken) {
            res.status(400).send('Invalid or expired verification token.');
        }

        // find the user associated with the token
        const user = await UserSchema.findById(verificationToken.userId);

        if (!user) {
            res.status(400).send('User not found.');
        }

        // verify the user's email
        user.isEmailVerified = true;
        await user.save();

        // delete the verification token
        await VerificationToken.deleteOne({ token: token });

        res.status(200).send('Email verified successfully.');
    } catch (error) {
        res.status(500).send('An error occurred during email verification.');
    }
})

//dashboard after log in
app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const user = await UserSchema.findById(req.session.userId);
        if (!user) {
            return res.redirect('/signin?error=User not found');
        }

        // Fetch documents from PDFSave collection for the logged-in user
        const documents = await PDFSave.find({ userId: req.session.userId });
        const documentCount = documents.length; // count data documents

        res.render('dashboard', { user, documents, documentCount });
    } catch (error) {
        console.error('Error fetching user or documents:', error);
        res.status(500).send('An error occurred while fetching user data.');
    }
});




app.get('/mydocuments', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Retrieve all documents for the user
        const allDocuments = await PDFSave.find({ userId });

        // Retrieve all folders for the user and populate documents within each folder
        const folders = await Folder.find({ userId }).populate('documents');

        const totalDocuments = allDocuments.length;

        // Create a Set of document IDs that are in folders
        const documentsInFolders = new Set();
        folders.forEach(folder => {
            folder.documents.forEach(doc => {
                documentsInFolders.add(doc._id.toString());
            });
        });

        // Filter out documents that are already in folders
        const documents = allDocuments.filter(doc => !documentsInFolders.has(doc._id.toString()));
        res.render('myDocuments', { totalDocuments, documents, folders });
    } catch (error) {
        console.error('Error fetching documents or folders:', error);
        res.status(500).json({ message: 'Failed to fetch documents or folders' });
    }
});



app.post('/delete/:id', async (req, res) => {
    try {
      await PDFSave.findByIdAndDelete(req.params.id);
      res.redirect('/myDocuments?m=Deleted Successfully'); // Redirect to your documents page or handle success appropriately
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).send('Error deleting document');
    }
  });

// download the pdf from database
app.get('/download/:id', isAuthenticated, async (req, res) => {
    try {
        const pdf = await PDFSave.findById(req.params.id); //search for pdf in database

        if (!pdf) {
            return res.status(404).send('PDF not found'); // if not found send error code
        }

        // Set headers for PDF file
        res.setHeader('Content-Type', pdf.contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${pdf.fileName}`);

        // send pdf as a buffer
        res.send(pdf.pdfData);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        res.status(500).send('Error downloading PDF');
    }
});


// view document from database
app.get('/view/:id', isAuthenticated, async (req, res) => {
    try {
        const pdf = await PDFSave.findById(req.params.id); // look for document in database

        if (!pdf) {
            return res.status(404).send('PDF not found'); //if not found send error code
        }

        // Set headers for PDF file to display inline
        res.setHeader('Content-Type', pdf.contentType);
        res.setHeader('Content-Disposition', `inline; filename=${pdf.fileName}`);

        // send pdf as a buffer
        res.send(pdf.pdfData);
    } catch (error) {
        console.error('Error viewing PDF:', error);
        res.status(500).send('Error viewing PDF');
    }
});

app.get('/pdfs/view/:id', async (req, res) => {
    try {
        const document = await PDFSave.findById(req.params.id);

        if (!document) {
            return res.status(404).send('Document not found');
        }

        res.contentType(document.contentType);
        res.send(document.pdfData);
    } catch (error) {
        console.error('Error fetching PDF:', error);
        res.status(500).send('Error fetching PDF');
    }
});

// Render upload form
app.get('/upload', isAuthenticated, (req, res) => {
    res.render('upload', { error: null });
});


app.post('/upload', isAuthenticated, upload.single('pdf'), async (req, res) => {
    const { documentType, documentTitle } = req.body;

    if (!req.file) {
        return res.render('upload', { error: 'Please select a PDF file to upload.' });
    }

    try {
        const newPDF = new PDFSave({
            userId: req.session.userId, // Save the user ID
            fileName: req.file.originalname,
            pdfData: req.file.buffer,
            contentType: req.file.mimetype,
            documentType,
            documentTitle
        });

        await newPDF.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).send('Error uploading PDF');
    }
});

app.post('/uploadtwo', isAuthenticated, upload.single('pdf'), async (req, res) => {
    const { documentType, documentTitle } = req.body;

    if (!req.file) {
        return res.render('upload', { error: 'Please select a PDF file to upload.' });
    }

    try {
        const newPDF = new PDFSave({
            userId: req.session.userId, // Save the user ID
            fileName: req.file.originalname,
            pdfData: req.file.buffer,
            contentType: req.file.mimetype,
            documentType,
            documentTitle
        });

        await newPDF.save();
        res.redirect('/myDocuments');
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).send('Error uploading PDF');
    }
});

app.get('/pdfeditor',  (req, res) => {
    res.render('pdfeditor');
});
  

app.post('/share/:documentId', async (req, res) => {
    try {
        const { recipientEmails, message } = req.body;
        const documentId = req.params.documentId;
        const userId = req.session.userId; // Assuming userId is retrieved from session

        // Find the document by ID
        const document = await PDFSave.findById(documentId);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Split the recipientEmails string into an array
        const recipients = recipientEmails.split(',').map(email => email.trim());

        // Sender's name and email (assuming they are stored in session)
        const senderEmail = req.session.email;

        // Document details for the email
        const documentTitle = document.documentTitle;
        const documentLink = `http://localhost:3000/sharedWithMe`; // Adjust the URL as needed


        // Iterate over the recipients and add share entries
        recipients.forEach(recipientEmail => {
            document.shares.push({
                sharedBy: {
                    _id: userId,
                    email: req.session.email // Assuming email is stored in session
                },
                sharedWith: recipientEmail,
                sharedWithEmail: recipientEmail, // Store recipient's email for display
                message: message || ''
            });
        });

        // Save the updated document
        await document.save();

        // Send the email to each recipient
        const emailPromises = recipients.map(email => 
            sendShareDocumentEmail(email, senderEmail, documentTitle, documentLink, message)
        );

        await Promise.all(emailPromises);

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});



// Route to display documents shared by the user
app.get('/sharedByMe', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const sharedByMe = await PDFSave.find({ 'shares.sharedBy._id': userId });
        const totalSharedByMe = sharedByMe.length;

        res.render('sharedByMe', { sharedByMe, totalSharedByMe  });
    } catch (error) {
        console.error('Error fetching documents shared by the user:', error);
        res.status(500).send('Error fetching documents');
    }
});

// Route to display documents shared with the user
app.get('/sharedWithMe', isAuthenticated, async (req, res) => {
    try {
        const userEmail = req.session.email; // Assuming user's email is stored in session
        const sharedWithMe = await PDFSave.find({ 'shares.sharedWith': userEmail });
        const totalSharedWithMe = sharedWithMe.length;

        res.render('sharedWithMe', { sharedWithMe, totalSharedWithMe, currentUserEmail: userEmail });
    } catch (error) {
        console.error('Error fetching documents shared with the user:', error);
        res.status(500).send('Error fetching documents');
    }
});



app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await UserSchema.findById(userId).exec();

        // Get total documents
        const totalDocuments = await PDFSave.countDocuments({ userId });

        // Get total documents shared by the user
        const sharedByMe = await PDFSave.countDocuments({ userId, 'shares.sharedBy._id': userId });

        // Get total documents shared with the user
        const sharedWithMe = await PDFSave.countDocuments({ 'shares.sharedWith': user.email });

        res.render('profile', { user, totalDocuments, sharedByMe, sharedWithMe });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Error fetching user profile');
    }
});

app.get('/search', isAuthenticated, async (req, res) => {
    try {
        const query = req.query.query;
        const userId = req.session.userId;

        // Search for documents by title, type, or other relevant fields
        const searchResults = await PDFSave.find({
            userId: userId,
            $or: [
                { documentTitle: { $regex: query, $options: 'i' } },
                { documentType: { $regex: query, $options: 'i' } },
                { fileName: { $regex: query, $options: 'i' } }
            ]
        });

        res.render('searchResults', { documents: searchResults, query: query });
    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).send('Error searching documents');
    }
});

app.get('/forgotpassword', (req, res)=>{
    var q = urls.parse(req.url, true).query;
    var errorMessage = q.error;
    res.render('forgotpassword', { errorMessage });
})

// Request password reset
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.redirect('/forgotpassword?error=The account does not exist');
        }
        const userId = user._id;


        const token = crypto.randomBytes(20).toString('hex');
        const resetToken = new PasswordResetToken({ userId, token });
        await resetToken.save();
        const resetLink = `http://localhost:3000/reset-password/${token}`;

        await sendPasswordResetEmail(user.email, user.name, resetLink);

        return res.redirect('/forgotpassword?error=Email was send');
    } catch (error) {
        res.status(500).send('Error requesting password reset');
    }
});

app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const resetToken = await PasswordResetToken.findOne({ token });
        if (!resetToken) {
            return res.redirect('/forgotpassword?error=Invalid token');
        }
        var q = urls.parse(req.url, true).query;
        var errorMessage = q.error;
        res.render('newpassword', { token, errorMessage });
    } catch (error) {
        console.error('Error validating password reset token:', error);
        res.status(500).send('Error validating password reset token');
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('newpassword', { token, errorMessage: 'Passwords do not match' });
    }

    try {
        const resetToken = await PasswordResetToken.findOne({ token });
        if (!resetToken) {
            return res.redirect('/forgotpassword?error=Invalid token');
        }

        const user = await UserSchema.findById(resetToken.userId);
        if (!user) {
            return res.status(400).send('User not found');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        // Remove the token from the database
        await PasswordResetToken.deleteOne({ token });

        return res.redirect('/signin');
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send('Error resetting password');
    }
});

// Route to create a new folder
app.post('/folders/create', isAuthenticated, async (req, res) => {
    try {
        const { folderName } = req.body;
        const userId = req.session.userId; // Assuming you're using sessions to track user login

        const newFolder = new Folder({
            folderName,
            userId
        });

        await newFolder.save();
        res.redirect('/mydocuments'); // Redirect to the appropriate page after creation
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'Failed to create folder' });
    }
});

// Route to view a specific folder
app.get('/folders/:folderId', async (req, res) => {
    try {
        const folderId = req.params.folderId;
        const userId = req.session.userId; // Assuming userId is stored in the session

        // Find the current folder and populate its documents
        const folder = await Folder.findById(folderId).populate('documents');
        const totalDocumentsInFolder = folder.documents.length;

        if (!folder) {
            return res.status(404).send('Folder not found');
        }

        // Find all folders for the user, excluding the current folder
        const folders = await Folder.find({ _id: { $ne: folderId }, userId });

        // Render the template with folder data and list of other folders
        res.render('folder', { totalDocumentsInFolder, folder, folders });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Merge folders route
app.post('/folders/:currentFolderId/merge', async (req, res) => {
    const { currentFolderId } = req.params;
    const { mergeFolderId } = req.body;

    try {
        // Find both folders
        const currentFolder = await Folder.findById(currentFolderId);
        const mergeFolder = await Folder.findById(mergeFolderId);

        if (!currentFolder || !mergeFolder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Move all documents from mergeFolder to currentFolder
        const documentsToMerge = mergeFolder.documents;
        documentsToMerge.forEach(docId => {
            currentFolder.documents.push(docId);
        });

        // Rename the current folder to include both folder names
        currentFolder.folderName = `${currentFolder.folderName} + ${mergeFolder.folderName}`;
        await currentFolder.save();

        // Delete the empty mergeFolder
        await Folder.findByIdAndDelete(mergeFolderId);

        // Redirect back to the current folder page
        res.redirect(`/folders/${currentFolderId}`);
    } catch (error) {
        console.error('Error merging folders:', error);
        res.status(500).json({ message: 'Error merging folders' });
    }
});




app.post('/folders/assign', async (req, res) => {
    try {
        const { pdfId, folderId } = req.body;

        // Find the folder and add the document to it
        const folder = await Folder.findById(folderId);
        folder.documents.push(pdfId);
        await folder.save();

        res.redirect('/myDocuments'); // Redirect to the appropriate page after assignment
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route to handle removing a document from a folder
app.post('/folders/remove', isAuthenticated, async (req, res) => {
    const { folderId, documentId } = req.body;

    try {
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).send('Folder not found');
        }

        // Remove documentId from folder.documents array
        folder.documents.pull(documentId);
        await folder.save();

        // Redirect or send a success response
        res.redirect('/folders/' + folderId); // Redirect to the folder page or another appropriate page
    } catch (error) {
        console.error('Error removing document from folder:', error);
        res.status(500).send('Error removing document from folder');
    }
});

app.post('/folders/:folderId/rename', async (req, res) => {
    const folderId = req.params.folderId;
    const { newFolderName } = req.body;

    try {
        // Find the folder by ID and update its name
        const folder = await Folder.findByIdAndUpdate(folderId, { folderName: newFolderName }, { new: true });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Redirect back to the folder page
        res.redirect(`/folders/${folderId}`); // Redirect to the same folder page

    } catch (error) {
        console.error('Error renaming folder:', error);
        res.status(500).json({ message: 'Error renaming folder' });
    }
});

app.post('/folders/:folderId/delete', async (req, res) => {
    const folderId = req.params.folderId;

    try {
        // Find the folder by ID and delete it
        const folder = await Folder.findByIdAndDelete(folderId);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Optionally, delete related documents or perform additional actions

        // Redirect or send a JSON response
        res.redirect('/myDocuments'); // Example redirect to dashboard or other relevant page

    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ message: 'Error deleting folder' });
    }
});
app.post('/save-pdf', upload.single('pdf'), async (req, res) => {
    try {
      const { userId, documentTitle, documentType } = req.body;
      const pdfData = req.file.buffer; // Access the Buffer containing the PDF data
  
      const newPDF = new PDFSave({
        userId,
        fileName: req.file.originalname, // Example: 'document.pdf'
        pdfData,
        contentType: req.file.mimetype, // Example: 'application/pdf'
        documentType,
        documentTitle,
      });
  
      await newPDF.save();
      res.sendStatus(200); // Sending success response
    } catch (error) {
      console.error('Error saving PDF:', error);
      res.status(500).send('Failed to save PDF');
    }
  });

  // Save PDF route
app.post('/resave-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const { docId } = req.body;
        const pdfData = req.file.buffer; // Access the Buffer containing the PDF data

        // Find the document by ID and update its PDF data
        const document = await PDFSave.findById(docId).populate('userId', 'email name');
        if (document) {
            document.pdfData = pdfData;
            document.contentType = req.file.mimetype; // Example: 'application/pdf'
            document.updatedAt = new Date(); // Update the updatedAt field
            await document.save();

            // Gather emails to notify
            const sharedWithEmails = document.shares.map(share => share.sharedWith);
            const documentLink = `${req.protocol}://${req.get('host')}/view/${docId}`;

            // Include the owner's email
            const ownerEmail = document.userId.email;
            const ownerName = document.userId.name;
            const allEmails = [...new Set([...sharedWithEmails, ownerEmail])];

            // Send emails to all recipients
            allEmails.forEach(async (email) => {
                try {
                    await sendDocumentEditedEmail(email, ownerName, document.documentTitle, documentLink);
                } catch (emailError) {
                    console.error('Error sending email:', emailError);
                }
            });

            res.sendStatus(200); // Sending success response
        } else {
            res.status(404).send('Document not found');
        }
    } catch (error) {
        console.error('Error saving PDF:', error);
        res.status(500).send('Failed to save PDF');
    }
});


  app.get('/pdfedit', async (req, res) => {
    const docId = req.query.docId;

    // Fetch the document from the database using the docId
    const document = await PDFSave.findById(docId);

    if (document) {
        res.render('pdfeditortwo', { document });
    } else {
        res.status(404).send('Document not found');
    }
});  
  
//check if user is logged
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/signin?error=You need to login to access this page');
    }
}


app.listen(port, () => {
    console.log(`App listening on port localhost:${port}`)
})
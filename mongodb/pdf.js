const mongoose = require('mongoose');

const pdfSaveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    pdfData: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    documentType: { type: String, required: true },
    documentTitle: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    shares: [{
        sharedBy: {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            email: { type: String, required: true }
        },
        sharedWith: { type: String, required: true },
        sharedWithEmail: { type: String }, // Add this field to store email for display purpose
        message: { type: String, default: '' }
    }]
});

module.exports = mongoose.model('PDFSave', pdfSaveSchema);

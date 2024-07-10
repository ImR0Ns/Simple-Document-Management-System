const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    folderName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PDFSave' }]
});

module.exports = mongoose.model('Folder', folderSchema);

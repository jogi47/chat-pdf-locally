const path = require('path');
const fs = require('fs');
const PdfChunk = require('../models/pdf.model');
const { processPdf, getAllPdfNames } = require('../utils/pdf.utils');

// Upload and process PDF
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { pdfName } = req.body;
    if (!pdfName) {
      return res.status(400).json({ error: 'PDF name is required' });
    }

    // Check if PDF with the same name already exists
    const existingPdf = await PdfChunk.findOne({ pdfName });
    if (existingPdf) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'A PDF with this name already exists' });
    }

    // Process the PDF file
    const result = await processPdf(req.file.path, pdfName);

    return res.status(200).json({
      message: 'PDF uploaded and processed successfully',
      result
    });
  } catch (error) {
    console.error('Error in PDF upload:', error);
    return res.status(500).json({ error: 'Error processing PDF' });
  }
};

// Get all PDF names
exports.getPdfNames = async (req, res) => {
  try {
    const pdfNames = await getAllPdfNames();
    return res.status(200).json({ pdfNames });
  } catch (error) {
    console.error('Error fetching PDF names:', error);
    return res.status(500).json({ error: 'Error fetching PDF names' });
  }
}; 
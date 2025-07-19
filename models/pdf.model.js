const mongoose = require('mongoose');

const pdfChunkSchema = new mongoose.Schema({
  pdfName: {
    type: String,
    required: true,
    index: true
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    fileName: String,
    pageNumbers: [Number],
    totalPages: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }
});

// Create compound index for pdfName and chunkIndex
pdfChunkSchema.index({ pdfName: 1, chunkIndex: 1 }, { unique: true });

const PdfChunk = mongoose.model('PdfChunk', pdfChunkSchema, 'pdf_collector');

module.exports = PdfChunk; 
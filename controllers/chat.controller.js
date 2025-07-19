const { queryPdfChunks, getAnswerFromOllama } = require('../utils/pdf.utils');
const PdfChunk = require('../models/pdf.model');

// Get answer from PDF using RAG approach
exports.getAnswer = async (req, res) => {
  try {
    const { question, pdfName } = req.body;
    
    if (!question || !pdfName) {
      return res.status(400).json({ error: 'Question and PDF name are required' });
    }
    
    // Check if PDF exists
    const pdfExists = await PdfChunk.findOne({ pdfName });
    if (!pdfExists) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Query PDF chunks for relevant information
    const relevantChunks = await queryPdfChunks(question, pdfName);
    
    if (relevantChunks.length === 0) {
      return res.status(200).json({ 
        answer: "I couldn't find any relevant information in this PDF to answer your question." 
      });
    }
    
    // Combine the text from the chunks to create context
    const context = relevantChunks.map(chunk => chunk.text).join('\n\n');
    
    // Get answer from Ollama
    const answer = await getAnswerFromOllama(question, context);
    
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in chat:', error);
    return res.status(500).json({ error: 'Error processing your question' });
  }
}; 
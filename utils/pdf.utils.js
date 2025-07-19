const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('llamaindex');
const axios = require('axios');
const PdfChunk = require('../models/pdf.model');

// Function to get embeddings from Ollama
async function getEmbeddings(text) {
  try {
    const response = await axios.post(process.env.OLLAMA_API_URL + '/embeddings', {
      model: process.env.OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    });
    
    return response.data.embedding;
  } catch (error) {
    console.error('Error getting embeddings from Ollama:', error);
    throw error;
  }
}

// Function to process and store PDF
async function processPdf(filePath, pdfName) {
  try {
    // Load and parse PDF
    const loader = new PDFLoader(filePath);
    const documents = await loader.load();
    
    // Process each document (page or section)
    const chunkSize = 1000; // Characters per chunk
    let chunkIndex = 0;
    
    // Store metadata about the PDF
    const metadata = {
      fileName: path.basename(filePath),
      totalPages: documents.length,
      uploadDate: new Date()
    };

    // Process each document and split into chunks
    for (let i = 0; i < documents.length; i++) {
      const pageText = documents[i].text;
      const pageNum = i + 1;
      
      // Split text into chunks
      for (let j = 0; j < pageText.length; j += chunkSize) {
        const chunk = pageText.substring(j, j + chunkSize);
        
        if (chunk.trim().length > 0) {
          // Get embedding for chunk
          const embedding = await getEmbeddings(chunk);
          
          // Create document in MongoDB
          await PdfChunk.create({
            pdfName,
            chunkIndex,
            text: chunk,
            embedding,
            metadata: {
              ...metadata,
              pageNumbers: [pageNum]
            }
          });
          
          chunkIndex++;
        }
      }
    }
    
    return {
      success: true,
      totalChunks: chunkIndex,
      totalPages: documents.length
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

// Function to query PDF chunks using vector search
async function queryPdfChunks(question, pdfName) {
  try {
    // Get embedding for question
    const questionEmbedding = await getEmbeddings(question);
    
    // Query MongoDB for similar chunks using vector search
    const pipeline = [
      {
        $search: {
          index: "pdf_vector_index", // Make sure this index is created in MongoDB
          knnBeta: {
            vector: questionEmbedding,
            path: "embedding",
            k: 5
          }
        }
      },
      {
        $match: { pdfName: pdfName } // Filter by PDF name
      },
      {
        $project: {
          text: 1,
          metadata: 1,
          score: { $meta: "searchScore" }
        }
      }
    ];
    
    const results = await PdfChunk.aggregate(pipeline);
    return results;
  } catch (error) {
    console.error('Error querying PDF chunks:', error);
    throw error;
  }
}

// Function to get answer from Ollama
async function getAnswerFromOllama(question, context) {
  try {
    const prompt = `
      You are a helpful assistant that answers questions based on the provided context.
      
      Context:
      ${context}
      
      Question: ${question}
      
      Answer the question based only on the provided context. If the answer cannot be determined from the context, say "I don't have enough information to answer this question."
    `;
    
    const response = await axios.post(process.env.OLLAMA_API_URL + '/generate', {
      model: process.env.OLLAMA_COMPLETION_MODEL,
      prompt: prompt,
      stream: false
    });
    
    return response.data.response;
  } catch (error) {
    console.error('Error getting answer from Ollama:', error);
    throw error;
  }
}

// Get all unique PDF names
async function getAllPdfNames() {
  try {
    const uniquePdfNames = await PdfChunk.distinct('pdfName');
    return uniquePdfNames;
  } catch (error) {
    console.error('Error fetching PDF names:', error);
    throw error;
  }
}

module.exports = {
  processPdf,
  queryPdfChunks,
  getAnswerFromOllama,
  getAllPdfNames
}; 
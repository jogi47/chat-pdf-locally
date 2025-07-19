const fs = require('fs');
const path = require('path');
const { PDFReader } = require('@llamaindex/readers/pdf');
const axios = require('axios');
const PdfChunk = require('../models/pdf.model');

// Function to get embeddings from Ollama
async function getEmbeddings(text) {
  try {
    const response = await axios.post(process.env.OLLAMA_API_URL + '/api/embeddings', {
      model: process.env.OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    });
    
    return response.data.embedding;
  } catch (error) {
    console.error('Error getting embeddings from Ollama:', error);
    throw error;
  }
}

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

// Function to process and store PDF
async function processPdf(filePath, pdfName) {
  try {
    // Load and parse PDF
    const reader = new PDFReader();
    const documents = await reader.loadData(filePath);
    
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

// Function to query PDF chunks using manual similarity calculation
async function queryPdfChunks(question, pdfName) {
  try {
    // Get embedding for question
    const questionEmbedding = await getEmbeddings(question);
    
    // Get all chunks for the specified PDF
    const chunks = await PdfChunk.find({ pdfName: pdfName });
    
    if (!chunks || chunks.length === 0) {
      return [];
    }
    
    // Calculate similarity for each chunk
    const chunksWithSimilarity = chunks.map(chunk => {
      const similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
      return {
        _id: chunk._id,
        text: chunk.text,
        metadata: chunk.metadata,
        score: similarity
      };
    });
    
    // Sort by similarity score (descending) and return top 5
    const topChunks = chunksWithSimilarity
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    return topChunks;
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
    
    const response = await axios.post(process.env.OLLAMA_API_URL + '/api/generate', {
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
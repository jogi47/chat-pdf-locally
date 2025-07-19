# PDF Chat Local

A Node.js application that allows you to chat with your PDFs using local models via Ollama. This application uses MongoDB for vector storage and LlamaIndex for RAG implementation.

## Features

- Upload PDFs and give them meaningful names
- Store PDF text chunks and embeddings in MongoDB
- Chat with PDFs by asking questions about their content
- Uses local AI models via Ollama for embeddings and text generation
- Clean and responsive user interface

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (installed via Docker or locally)
- Ollama running locally with embedding and completion models

## Setup

1. Clone the repository:
```
git clone <repository-url>
cd pdf-chat-local
```

2. Install dependencies:
```
npm install
```

3. Create a .env file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pdf_chat
OLLAMA_API_URL=http://localhost:11434/api
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_COMPLETION_MODEL=llama2
UPLOAD_DIR=public/uploads
```

Note: Adjust the Ollama model names according to the models you have pulled.

4. Make sure MongoDB is running and create the vector search index:

In MongoDB, create a vector search index for the `pdf_collector` collection with the following configuration:
```json
{
  "name": "pdf_vector_index",
  "definition": {
    "mappings": {
      "dynamic": true,
      "fields": {
        "embedding": {
          "dimensions": 384,
          "similarity": "cosine",
          "type": "knnVector"
        }
      }
    }
  }
}
```

Note: Adjust the dimensions to match your Ollama embedding model output dimensions.

5. Start the application:
```
npm start
```

For development with automatic restart:
```
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload a PDF**:
   - Click on the "Upload PDF" link in the navigation bar
   - Give your PDF a unique name
   - Select a PDF file to upload (max size: 10MB)
   - Click "Upload and Process"
   - Wait for the processing to complete (this may take some time for large PDFs)

2. **Chat with a PDF**:
   - Go to the main page
   - Select a PDF from the dropdown menu
   - Type your question in the input field
   - Press Enter or click the send button
   - View the AI-generated answer based on the PDF content

## Technology Stack

- **Backend**: Node.js, Express
- **Frontend**: EJS templates, Bootstrap 5, JavaScript
- **Database**: MongoDB
- **AI**: LlamaIndex, Ollama (local LLMs)
- **PDF Processing**: pdf-parse

## Notes

- The application chunks PDFs by character count for better context management
- Vector search is used to find relevant chunks when answering questions
- All processing is done locally, no data is sent to external APIs 
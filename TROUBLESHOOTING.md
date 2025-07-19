# Troubleshooting Guide

## MongoDB Connection Issues

If you see an error like:
```
MongoDB connection error: MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

This means your MongoDB server is not running or not accessible. Here are some steps to fix this:

1. If you're using Docker, make sure your MongoDB container is running:
   ```
   docker ps
   ```
   
   If you don't see a MongoDB container, start it with:
   ```
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

2. If you're running MongoDB locally, make sure the service is started:
   - On Linux: `sudo systemctl start mongod`
   - On macOS (with Homebrew): `brew services start mongodb-community`
   - On Windows: Check if the MongoDB service is running in Services

3. Check if your MongoDB URI in the `.env` file is correct. The default is:
   ```
   MONGODB_URI=mongodb://localhost:27017/pdf_chat
   ```

## Vector Search Index

For the RAG functionality to work correctly, you need to create a vector search index in MongoDB. Follow these steps:

1. Connect to your MongoDB instance:
   ```
   mongosh
   ```

2. Switch to the pdf_chat database:
   ```
   use pdf_chat
   ```

3. Create the vector search index on the pdf_collector collection:
   ```javascript
   db.pdf_collector.createIndex(
     { "embedding": "vector" },
     {
       name: "pdf_vector_index",
       vectorSearchOptions: {
         dimensions: 384, // Adjust based on your embedding model
         similarity: "cosine"
       }
     }
   )
   ```

   Note: The dimensions parameter should match the output dimensions of your Ollama embedding model. For example:
   - nomic-embed-text: 384 dimensions
   - all-MiniLM-L6-v2: 384 dimensions
   - Adjust as needed for your specific model

## Ollama Connection Issues

If you see errors related to Ollama API connections, make sure:

1. Ollama is running on your machine
2. You've pulled the necessary models:
   ```
   ollama pull nomic-embed-text
   ollama pull llama2
   ```
   (Adjust model names according to your .env configuration)

3. The Ollama API URL in your .env file is correct (usually http://localhost:11434/api)

## PDF Processing Issues

If you encounter problems with PDF uploads or processing:

1. Check if the uploads directory exists and is writable
2. Ensure the PDF files are valid and not corrupted
3. Try with smaller PDFs first (less than 10 pages) to test the system
4. Check server logs for specific error messages related to PDF processing 
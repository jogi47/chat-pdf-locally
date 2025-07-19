// Global variables
let selectedPdf = '';
const chatContainer = document.getElementById('chatContainer');
const questionInput = document.getElementById('questionInput');
const sendButton = document.getElementById('sendButton');
const pdfSelect = document.getElementById('pdfSelect');

// Load PDF names for dropdown
async function loadPdfNames() {
  try {
    const response = await axios.get('/api/pdfs/names');
    const pdfNames = response.data.pdfNames;
    
    // Clear current options (except the placeholder)
    while (pdfSelect.options.length > 1) {
      pdfSelect.remove(1);
    }
    
    // Add PDF names to dropdown
    if (pdfNames && pdfNames.length > 0) {
      pdfNames.forEach(pdfName => {
        const option = document.createElement('option');
        option.value = pdfName;
        option.text = pdfName;
        pdfSelect.appendChild(option);
      });
    } else {
      // If no PDFs, show message in dropdown
      const option = document.createElement('option');
      option.value = '';
      option.text = 'No PDFs uploaded yet';
      option.disabled = true;
      pdfSelect.appendChild(option);
    }
  } catch (error) {
    console.error('Error loading PDF names:', error);
    showError('Error loading PDF names. Please try again later.');
  }
}

// Handle PDF selection
if (pdfSelect) {
  pdfSelect.addEventListener('change', function() {
    selectedPdf = this.value;
    
    // Enable/disable chat input based on selection
    if (selectedPdf) {
      questionInput.disabled = false;
      sendButton.disabled = false;
      questionInput.focus();
    } else {
      questionInput.disabled = true;
      sendButton.disabled = true;
    }
  });
}

// Handle chat form submission
const chatForm = document.getElementById('chatForm');
if (chatForm) {
  chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const question = questionInput.value.trim();
    if (!question || !selectedPdf) return;
    
    // Add user message to chat
    addMessage(question, 'user');
    
    // Clear input
    questionInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
      // Send question to server
      const response = await axios.post('/api/chat/answer', {
        question,
        pdfName: selectedPdf
      });
      
      // Remove typing indicator
      removeTypingIndicator();
      
      // Add bot response to chat
      addMessage(response.data.answer, 'bot');
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error('Error getting answer:', error);
      removeTypingIndicator();
      addMessage('Sorry, there was an error processing your question. Please try again.', 'bot');
    }
  });
}

// Add message to chat container
function addMessage(text, sender) {
  // Remove welcome message if present
  const welcomeMessage = document.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
  
  // Process markdown in bot messages
  if (sender === 'bot') {
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
  } else {
    messageDiv.textContent = text;
  }
  
  // Add timestamp
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeDiv = document.createElement('div');
  timeDiv.classList.add('message-time');
  timeDiv.textContent = timestamp;
  messageDiv.appendChild(timeDiv);
  
  chatContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.classList.add('typing-indicator');
  typingDiv.id = 'typingIndicator';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.classList.add('typing-dot');
    typingDiv.appendChild(dot);
  }
  
  chatContainer.appendChild(typingDiv);
  scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Scroll chat to bottom
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.classList.add('alert', 'alert-danger', 'mt-3');
  errorDiv.textContent = message;
  
  const container = document.querySelector('.container');
  container.insertBefore(errorDiv, container.firstChild);
  
  // Remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Handle PDF upload form
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  uploadForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const pdfName = document.getElementById('pdfName').value.trim();
    const pdfFile = document.getElementById('pdfFile').files[0];
    
    if (!pdfName || !pdfFile) {
      showError('Please provide both a name and a PDF file.');
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('pdfName', pdfName);
    formData.append('pdfFile', pdfFile);
    
    // Show loading indicator
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadResult = document.getElementById('uploadResult');
    const uploadButton = document.getElementById('uploadButton');
    
    uploadStatus.style.display = 'block';
    uploadResult.style.display = 'none';
    uploadButton.disabled = true;
    
    try {
      // Send upload request
      const response = await axios.post('/api/pdfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Hide loading indicator
      uploadStatus.style.display = 'none';
      
      // Show success message
      uploadResult.innerHTML = `
        <div class="alert alert-success">
          <h5 class="alert-heading">PDF Uploaded Successfully!</h5>
          <p>PDF Name: ${pdfName}</p>
          <p>Processed ${response.data.result.totalChunks} chunks from ${response.data.result.totalPages} pages.</p>
          <hr>
          <p class="mb-0">You can now <a href="/">chat with this PDF</a>.</p>
        </div>
      `;
      uploadResult.style.display = 'block';
      
      // Reset form
      uploadForm.reset();
    } catch (error) {
      // Hide loading indicator
      uploadStatus.style.display = 'none';
      
      // Show error message
      let errorMessage = 'Error uploading PDF. Please try again.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      
      uploadResult.innerHTML = `
        <div class="alert alert-danger">
          <h5 class="alert-heading">Upload Failed</h5>
          <p>${errorMessage}</p>
        </div>
      `;
      uploadResult.style.display = 'block';
    } finally {
      // Re-enable button
      uploadButton.disabled = false;
    }
  });
} 
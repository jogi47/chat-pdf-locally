const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Route for getting answers from PDF
router.post('/answer', chatController.getAnswer);

module.exports = router; 
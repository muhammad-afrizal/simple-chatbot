/**
 * Complete Chatbot Frontend Implementation
 *
 * This script handles the complete chatbot workflow according to the API specification:
 * - Adds user's message to the chat box
 * - Shows a temporary "Thinking..." bot message
 * - Sends POST request to /api/chat with the correct JSON format
 * - Replaces "Thinking..." message with AI's reply from the `result` property
 * - Handles errors appropriately
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get the DOM elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    // Store conversation history to maintain context
    let conversationHistory = [];

    // Handle form submission
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // Add user message to chat box
        appendMessage('user', userMessage);

        // Clear input field
        userInput.value = '';

        // Add temporary "Thinking..." message
        const thinkingElement = appendMessage('bot', 'Thinking...');

        try {
            // Prepare the request payload according to the API spec
            const requestBody = {
                conversation: [
                    ...conversationHistory,
                    { role: 'user', text: userMessage }
                ]
            };

            // Send POST request to the backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const data = await response.json();

            // Remove the "Thinking..." message
            if (thinkingElement && thinkingElement.parentNode) {
                thinkingElement.parentNode.removeChild(thinkingElement);
            }

            if (data && data.result) {
                // Add the AI response to chat box
                appendMessage('bot', data.result);

                // Update conversation history
                conversationHistory.push({ role: 'user', text: userMessage });
                conversationHistory.push({ role: 'bot', text: data.result });
            } else {
                // Handle case where response doesn't have expected format
                appendMessage('bot', 'Sorry, no response received.');
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Remove the "Thinking..." message
            if (thinkingElement && thinkingElement.parentNode) {
                thinkingElement.parentNode.removeChild(thinkingElement);
            }

            // Show error message
            appendMessage('bot', 'Failed to get response from server.');
        }
    });

    /**
     * Adds a message to the chat box
     * @param {string} sender - Either 'user' or 'bot'
     * @param {string} text - The message content
     */
    function appendMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        
        // Format the message with role indicator
        const roleText = sender === 'user' ? 'You:' : 'Bot:';
        messageElement.innerHTML = `<strong>${roleText}</strong> ${text}`;

        chatBox.appendChild(messageElement);

        // Scroll to bottom of chat box
        chatBox.scrollTop = chatBox.scrollHeight;

        return messageElement;
    }
});
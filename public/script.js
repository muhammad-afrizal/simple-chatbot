/**
 * Complete Chatbot Frontend Implementation with Ducky Character Integration
 *
 * This script handles the complete chatbot workflow according to the API specification:
 * - Adds user's message to the chat box
 * - Shows a temporary "Thinking..." bot message
 * - Sends POST request to /api/chat with the correct JSON format
 * - Replaces "Thinking..." message with AI's reply from the `result` property
 * - Handles errors appropriately
 * - Manages Ducky character animations and states based on conversation context
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get the DOM elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const styleSelect = document.getElementById('style-select');
    const duckyAnimation = document.getElementById('ducky-animation');
    const duckyStatus = document.getElementById('ducky-status');

    // Store conversation history to maintain context
    let conversationHistory = [];

    // Ducky state management
    const DuckyState = {
        IDLE: 'idle',
        LISTENING: 'listening',
        PROCESSING: 'processing',
        RESPONDING: 'responding',
        ERROR: 'error'
    };

    // State priority system (higher number = higher priority)
    const statePriority = {
        [DuckyState.IDLE]: 1,
        [DuckyState.LISTENING]: 4,
        [DuckyState.PROCESSING]: 2,
        [DuckyState.RESPONDING]: 3,
        [DuckyState.ERROR]: 5
    };

    let currentState = DuckyState.IDLE;
    let currentStateStartTime = Date.now();
    let currentAnimation = 'idle.gif';
    let animationTimeout = null;

    // Animation mapping based on state and context
    const animationMap = {
        // State-based animations
        [DuckyState.IDLE]: 'idle.gif',
        [DuckyState.LISTENING]: 'inhaling.gif',
        [DuckyState.PROCESSING]: 'floating_flap.gif',
        [DuckyState.RESPONDING]: 'walk.gif',
        [DuckyState.ERROR]: 'duckee_death.gif',

        // Context-based animations
        positive: 'right_left_combo.gif',
        negative: 'hit.gif',
        question: 'jump.gif',
        help: 'ledge_grab.gif',
        longMessage: 'crouch.gif',
        fastMessage: 'multi_jump.gif',
        emptyMessage: 'wall_slide.gif',
        sending: 'f_tilt.gif',
        receiving: 'land.gif',
        easterEgg: 'right_hook.gif'
    };

    // Initialize Ducky
    function initializeDucky() {
        updateDuckyAnimation(animationMap[DuckyState.IDLE]);
        updateDuckyStatus('Listening...');
        currentState = DuckyState.IDLE;
        currentStateStartTime = Date.now();
    }

    // Update Ducky animation with fade transition
    function updateDuckyAnimation(animationName) {
        if (!animationName) return;

        // Add fade out class
        duckyAnimation.classList.add('ducky-fade-out');
        duckyAnimation.classList.remove('ducky-fade-in');

        // Update the animation after a short delay to allow fade out
        setTimeout(() => {
            duckyAnimation.src = `assets/Ducky/Gifs/${animationName}`;
            duckyAnimation.alt = `Ducky ${animationName.split('.')[0]}`;

            // Add fade in class
            duckyAnimation.classList.remove('ducky-fade-out');
            duckyAnimation.classList.add('ducky-fade-in');
        }, 150);
    }

    // Update Ducky status text
    function updateDuckyStatus(statusText) {
        if (duckyStatus) {
            duckyStatus.textContent = statusText;
        }
    }

    // Set Ducky state with priority checking
    function setDuckyState(newState, statusText = null) {
        // Check if new state has higher or equal priority
        if (statePriority[newState] >= statePriority[currentState]) {
            // Update state
            currentState = newState;
            currentStateStartTime = Date.now();

            // Update animation and status
            const animationName = animationMap[newState];
            if (animationName) {
                updateDuckyAnimation(animationName);
            }

            if (statusText) {
                updateDuckyStatus(statusText);
            } else {
                // Default status messages based on state
                const defaultStatus = {
                    [DuckyState.IDLE]: 'Listening...',
                    [DuckyState.LISTENING]: 'Typing...',
                    [DuckyState.PROCESSING]: 'Thinking...',
                    [DuckyState.RESPONDING]: 'Responding...',
                    [DuckyState.ERROR]: 'Error occurred'
                };
                updateDuckyStatus(defaultStatus[newState] || '...');
            }
        }
    }

    // Determine animation based on message content
    function determineAnimationFromMessage(message, sender) {
        // Normalize message for analysis
        const normalizedMessage = message.toLowerCase().trim();

        // Check for error keywords (highest priority)
        if (normalizedMessage.includes('error') ||
            normalizedMessage.includes('gagal') ||
            normalizedMessage.includes('kesalahan') ||
            normalizedMessage.includes('failed')) {
            return animationMap[DuckyState.ERROR];
        }

        // Check for positive keywords
        const positiveKeywords = ['terima kasih', 'makasih', 'bagus', 'keren', 'hebat', 'luar biasa', 'mantap', 'good', 'great', 'awesome', 'thank', 'love', 'amazing'];
        if (positiveKeywords.some(keyword => normalizedMessage.includes(keyword))) {
            return animationMap.positive;
        }

        // Check for negative keywords
        const negativeKeywords = ['marah', 'kesal', 'tidak', 'buruk', 'jelek', 'benci', 'tidak suka', 'hate', 'bad', 'wrong', 'angry'];
        if (negativeKeywords.some(keyword => normalizedMessage.includes(keyword))) {
            return animationMap.negative;
        }

        // Check for question keywords
        const questionKeywords = ['apa', 'bagaimana', 'kapan', 'siapa', 'mengapa', 'berapa', 'how', 'what', 'when', 'who', 'why', 'which', 'where', 'question'];
        if (normalizedMessage.endsWith('?') || questionKeywords.some(keyword => normalizedMessage.includes(keyword))) {
            return animationMap.question;
        }

        // Check for help keywords
        const helpKeywords = ['bantu', 'tolong', 'jelaskan', 'cara', 'bagaimana caranya', 'help', 'assist', 'support'];
        if (helpKeywords.some(keyword => normalizedMessage.includes(keyword))) {
            return animationMap.help;
        }

        // Check for easter egg keywords
        const easterEggKeywords = ['ducky', 'hello ducky', 'hai bebek', 'bebek', 'duck'];
        if (easterEggKeywords.some(keyword => normalizedMessage.includes(keyword))) {
            return animationMap.easterEgg;
        }

        // Check for long message
        if (message.length > 100) {
            return animationMap.longMessage;
        }

        // Default animation based on sender
        return sender === 'user' ? animationMap.sending : animationMap.receiving;
    }

    // Handle user typing event
    userInput.addEventListener('input', () => {
        // Only change to listening state if current state is idle or lower priority
        if (statePriority[currentState] <= statePriority[DuckyState.LISTENING]) {
            setDuckyState(DuckyState.LISTENING, 'Typing...');
        }
    });

    // Handle form submission
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userMessage = userInput.value.trim();
        const selectedStyle = styleSelect.value; // Ambil nilai style dari dropdown
        if (!userMessage) return;

        // Add user message to chat box
        appendMessage('user', userMessage);

        // Clear input field
        userInput.value = '';

        // Set Ducky to responding state for sending animation
        const sendingAnimation = determineAnimationFromMessage(userMessage, 'user');
        updateDuckyAnimation(sendingAnimation);
        updateDuckyStatus('Sending...');

        // Add temporary "Thinking..." message
        const thinkingElement = appendMessage('bot', 'Thinking...');

        // Set Ducky to processing state
        setDuckyState(DuckyState.PROCESSING, 'Thinking...');

        try {
            // Prepare the request payload according to the API spec
            const requestBody = {
                conversation: [
                    ...conversationHistory,
                    { role: 'user', text: userMessage }
                ],
                style: selectedStyle // Tambahkan parameter style
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

                // Determine animation based on bot response
                const botAnimation = determineAnimationFromMessage(data.result, 'bot');

                // Set Ducky to responding state with appropriate animation
                setDuckyState(DuckyState.RESPONDING, 'Responding...');

                // Update animation based on response content
                updateDuckyAnimation(botAnimation);

                // After a short delay, return to listening state
                setTimeout(() => {
                    if (currentState === DuckyState.RESPONDING) {
                        setDuckyState(DuckyState.IDLE, 'Listening...');
                    }
                }, 2000);

                // Update conversation history
                conversationHistory.push({ role: 'user', text: userMessage });
                conversationHistory.push({ role: 'bot', text: data.result });
            } else {
                // Handle case where response doesn't have expected format
                appendMessage('bot', 'Sorry, no response received.');

                // Set Ducky to error state
                setDuckyState(DuckyState.ERROR, 'Error occurred');

                // Return to idle after error animation
                setTimeout(() => {
                    setDuckyState(DuckyState.IDLE, 'Listening...');
                }, 2500);
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Remove the "Thinking..." message
            if (thinkingElement && thinkingElement.parentNode) {
                thinkingElement.parentNode.removeChild(thinkingElement);
            }

            // Show error message
            appendMessage('bot', 'Failed to get response from server.');

            // Set Ducky to error state
            setDuckyState(DuckyState.ERROR, 'Error occurred');

            // Return to idle after error animation
            setTimeout(() => {
                setDuckyState(DuckyState.IDLE, 'Listening...');
            }, 2500);
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

    // Initialize Ducky when page loads
    initializeDucky();
});
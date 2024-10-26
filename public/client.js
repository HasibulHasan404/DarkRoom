const socket = io();
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username-input");
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const typingIndicator = document.getElementById("typing-indicator");
const replyContainer = document.getElementById("reply-container");
const replyMessageText = document.getElementById("reply-message-text");
const cancelReplyButton = document.getElementById("cancel-reply-button");

let username = "";
let replyToMessage = null;

// Load messages from local storage and display them
function loadMessages() {
  const messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
  messages.forEach((msg) => appendMessage(msg));
}

// Save messages to local storage
function saveMessageToLocalStorage(msg) {
  const messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
  messages.push(msg);
  localStorage.setItem("chatMessages", JSON.stringify(messages));
}

// Append message to the chat area
function appendMessage(msg) {
  const messageElement = document.createElement("div");
  const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const avatarSrc = `https://ui-avatars.com/api/?name=${msg.username}&background=007bff&color=fff&size=40`;

  // Build the message element with the reply on top
  messageElement.classList.add("flex", "items-start", "space-x-2", "mb-4");
  messageElement.innerHTML = `
        <img src="${avatarSrc}" alt="${
    msg.username
  }'s avatar" class="avatar w-8 h-8 rounded-full" />
        <div class="bg-blue-600 text-white p-2 rounded-lg shadow-lg break-words max-w-xs md:max-w-sm lg:max-w-md">
            ${
              msg.replyTo
                ? `
                <div class="bg-gray-700 text-gray-300 p-1 rounded-t-lg border-b border-gray-500 mb-2">
                    <strong>${msg.replyTo.username}:</strong> ${msg.replyTo.text}
                </div>`
                : ""
            }
            <div><strong>${msg.username}:</strong> ${msg.text}</div>
            <span class="text-gray-300 text-xs block mt-1">${timestamp}</span>
            <button class="reply-button text-xs text-blue-300 underline mt-1">Reply</button>
        </div>
    `;
  chatMessages.appendChild(messageElement);

  // Add event listener to the reply button
  const replyButton = messageElement.querySelector(".reply-button");
  replyButton.addEventListener("click", () => {
    replyToMessage = { username: msg.username, text: msg.text };
    replyContainer.classList.remove("hidden");
    replyMessageText.textContent = `Replying to ${msg.username}: ${msg.text}`;
  });
}

// Handle login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  username = usernameInput.value.trim();
  if (username) {
    socket.emit("login", username);
    loginContainer.style.display = "none";
    chatContainer.style.display = "flex";
    loadMessages(); // Load existing messages after login
  }
});

// Handle chat message submission
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (chatInput.value) {
    const message = {
      username: username,
      text: chatInput.value,
      timestamp: new Date(),
      replyTo: replyToMessage, // Include the message being replied to (if any)
    };

    // Send message to server and save to local storage
    socket.emit("chat message", message);
    saveMessageToLocalStorage(message); // Save to local storage
    chatInput.value = "";
    replyContainer.classList.add("hidden"); // Hide reply container after sending
    replyToMessage = null; // Reset reply
  }
});

// Emit typing event
chatInput.addEventListener("input", () => {
  socket.emit("typing");
});

// Listen for chat messages
socket.on("chat message", (msg) => {
  appendMessage(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Listen for user joined and left events
socket.on("user joined", (username) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add(
    "bg-gray-600",
    "text-white",
    "p-2",
    "rounded-lg",
    "shadow",
    "break-words",
    "max-w-fit",
    "self-center"
  );
  messageElement.textContent = `${username} joined the chat`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("user left", (username) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add(
    "bg-gray-600",
    "text-white",
    "p-2",
    "rounded-lg",
    "shadow",
    "break-words",
    "max-w-fit",
    "self-center"
  );
  messageElement.textContent = `${username} left the chat`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Listen for typing event
socket.on("typing", (username) => {
  typingIndicator.classList.remove("hidden");
  typingIndicator.textContent = `${username} is typing...`;
});

// Hide typing indicator after a timeout
socket.on("stop typing", () => {
  typingIndicator.classList.add("hidden");
});

// New: Cancel reply action
cancelReplyButton.addEventListener("click", () => {
  replyContainer.classList.add("hidden"); // Hide the reply container
  replyToMessage = null; // Clear the reply message reference
});

// Load messages on initial page load
loadMessages();

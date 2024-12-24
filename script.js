"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Insert API key here
const OPENAI_API_KEY = "YOUR KEY HERE"
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const pdfInput = document.getElementById("pdfInput");
const pdfViewer = document.getElementById("pdfViewer");
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
let conversationHistory = [];

const models = ['gpt-4o', 'gpt-4o-mini', 'o1-mini'];
let currentModelIndex = 0;

const prevModelBtn = document.getElementById('prevModel');
const nextModelBtn = document.getElementById('nextModel');
const currentModelSpan = document.getElementById('currentModel');

prevModelBtn.addEventListener('click', () => {
    currentModelIndex = (currentModelIndex - 1 + models.length) % models.length;
    currentModelSpan.textContent = models[currentModelIndex];
});

nextModelBtn.addEventListener('click', () => {
    currentModelIndex = (currentModelIndex + 1) % models.length;
    currentModelSpan.textContent = models[currentModelIndex];
});

const textarea = document.getElementById('userInput');

function resetInputHeight() {
    const textarea = document.getElementById('userInput');
    const container = document.getElementById('input-container');
    textarea.style.height = '50px';
    textarea.style.overflowY = 'hidden';
    container.style.height = '100px';
}

textarea.addEventListener('input', function() {
    // If empty, reset and return
    if (!this.value) {
        resetInputHeight();
        return;
    }

    // Save current height before reset
    const currentHeight = this.offsetHeight;
    
    // Reset height to recalculate
    this.style.height = '50px';
    
    // Calculate heights
    const lineHeight = parseInt(window.getComputedStyle(this).lineHeight);
    const padding = 20;
    const baseHeight = 50;
    const maxHeight = (lineHeight * 8) + padding;
    
    // Only expand if content exceeds current height by more than half a line
    const shouldExpand = this.scrollHeight > (currentHeight + (lineHeight / 2));
    
    if (shouldExpand) {
        const newHeight = Math.min(Math.max(baseHeight, this.scrollHeight - padding), maxHeight);
        this.style.height = newHeight + 'px';
        const container = document.getElementById('input-container');
        container.style.height = (newHeight + 30) + 'px';
        
        // Always scroll to show latest input when at max height
        if (this.scrollHeight > maxHeight) {
            this.style.overflowY = 'scroll';
            requestAnimationFrame(() => {
                this.scrollTop = this.scrollHeight;
            });
        }
    } else {
        // Keep current height if no expansion needed
        this.style.height = currentHeight + 'px';
    }
});

// Replace both keydown and keyup handlers with this single handler
textarea.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        if (event.shiftKey) {
            // Allow Shift+Enter for line break - default behavior
            return;
        }
        // Normal Enter
        event.preventDefault();
        if (this.value.trim()) {
            sendMessage();
        }
    }
});

// Add at top
const pdfjsLib = window['pdfjsLib'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null;
const pdfViewerElement = document.getElementById('pdf-viewer');

let currentPdfContent = "";

// Function to load PDF content
async function loadPdfContent(pdfDoc) {
    let fullText = "";
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    currentPdfContent = fullText;
}

// Update the existing PDF input event listener
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target.result);
        pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
        renderPage(1);
        await loadPdfContent(pdfDoc); // Extract text
        addMessageToUI("PDF loaded successfully. You can now ask questions about its content.", "assistant");
    };
    reader.readAsArrayBuffer(file);
});

// Simplified render function with fixed scale
async function renderPage(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const dpiScale = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: dpiScale });
    
    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page-wrapper';
    pageDiv.style.width = `${viewport.width / dpiScale}px`;
    pageDiv.style.height = `${viewport.height / dpiScale}px`;
    
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page';
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.width = `${viewport.width / dpiScale}px`;
    canvas.style.height = `${viewport.height / dpiScale}px`;
    pageDiv.appendChild(canvas);
    
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'text-layer';
    textLayerDiv.style.width = `${viewport.width / dpiScale}px`;
    textLayerDiv.style.height = `${viewport.height / dpiScale}px`;
    pageDiv.appendChild(textLayerDiv);
    
    pdfViewerElement.appendChild(pageDiv);

    const context = canvas.getContext('2d');
    await page.render({
        canvasContext: context,
        viewport: viewport,
        enableWebGL: true
    }).promise;

    const textContent = await page.getTextContent();
    pdfjsLib.renderTextLayer({
        textContent, 
        container: textLayerDiv,
        viewport: viewport,
        textDivs: [],
        enhanceTextSelection: true
    });

    if (pageNum < pdfDoc.numPages) {
        renderPage(pageNum + 1);
    }
}

sendBtn.addEventListener("click", () => {
    sendMessage();
});

textarea.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        if (event.shiftKey) {
            
            return;
        }
        event.preventDefault(); 
        if (this.value.trim()) {
            sendMessage();
        }
    }
});

function sendMessage() {
    return __awaiter(this, void 0, void 0, function* () {
        const text = userInput.value.trim();
        if (!text) return;
        
        addMessageToUI(text, "user");
        userInput.value = '';
        resetInputHeight();
        
        // Add loading message
        const loadingDiv = addLoadingMessage();
        
        conversationHistory.push({ role: "user", content: text });
        const response = yield getOpenAIResponse(conversationHistory);
        
        // Remove loading message
        loadingDiv.remove();
        
        if (response) {
            addMessageToUI(response, "assistant");
            conversationHistory.push({ role: "assistant", content: response });
        }
    });
}

function addMessageToUI(messageText, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");
    
    // Convert markdown-style formatting to HTML
    const formattedText = messageText
        // Protect LaTeX from other formatting
        .replace(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|`[\s\S]*?`|```[\s\S]*?```)/g, match => {
            return match.replace(/[<>&]/g, c => ({
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;'
            }[c]));
        })
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, (match, code) => 
            `<pre><code>${code.trim()}</code></pre>`)
        // Inline code
        .replace(/`([^`]+)`/g, (match, code) => 
            `<code>${code}</code>`)
        // Line breaks
        .replace(/\n/g, '<br>');
    
    contentDiv.innerHTML = formattedText;
    messageDiv.appendChild(contentDiv);
    
    if (sender === "user") {
        messageDiv.classList.add("user-message");
    } else {
        messageDiv.classList.add("bot-message");
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Trigger MathJax to render the new content
    if (window.MathJax) {
        MathJax.typesetPromise([contentDiv]).catch((err) => console.log('MathJax error:', err));
    }
}

function addLoadingMessage() {
    const loadingDiv = document.createElement("div");
    loadingDiv.classList.add("message", "bot-message", "loading-bubble");
    
    // Add three dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.classList.add("loading-dot");
        loadingDiv.appendChild(dot);
    }
    
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
}

function addErrorMessage(errorText) {
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("error-message");
    errorDiv.textContent = errorText;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Automatically remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function getOpenAIResponse(conversation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
                addErrorMessage("Bitte fügen Sie einen gültigen API-Key ein");
                return null;
            }

            let messages;
            if (models[currentModelIndex] === 'o1-mini') {
                // For o1-mini, add PDF content as user message instead of system message
                const pdfContext = {
                    role: "user",
                    content: "Here is the PDF content to reference for subsequent questions:\n\n" + currentPdfContent
                };
                messages = currentPdfContent ? [pdfContext, ...conversation] : conversation;
            } else {
                // For other models, use system message
                const contextMessage = {
                    role: "system",
                    content: currentPdfContent ? 
                        "Here is the content of the PDF document to reference: \n\n" + currentPdfContent
                        : "No PDF has been loaded yet."
                };
                messages = [contextMessage, ...conversation];
            }

            const response = yield fetch(OPENAI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: models[currentModelIndex],
                    messages: messages,
                }),
            });

            const data = yield response.json();

            if (!response.ok) {
                let errorMessage = "Ein Fehler ist aufgetreten";
                if (data.error?.message) {
                    errorMessage = `API-Fehler: ${data.error.message}`;
                } else if (response.status === 429) {
                    errorMessage = "Rate limit erreicht. Bitte warten Sie einen Moment.";
                } else if (response.status === 401) {
                    errorMessage = "Ungültiger API-Key oder fehlende Berechtigung.";
                }
                addErrorMessage(errorMessage);
                return null;
            }

            return data.choices?.[0]?.message?.content || null;

        } catch (error) {
            addErrorMessage(`Netzwerkfehler: ${error.message}`);
            return null;
        }
    });
}

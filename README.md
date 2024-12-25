ChatPDF

This repository contains the source code for a web-based PDF viewer and assistant application. The application enables users to upload PDF documents, view their content, and interact with a conversational assistant to ask questions or extract information directly from the uploaded document. 
I personally don't want to pay a monthly fee for a tool that I use maybe max. 3 times a month, so I build this and want to share it.

I'm open for any suggestions.

Preview:
![ChatPDF](https://github.com/user-attachments/assets/5e2e0b85-8e57-48b5-ad72-c872bfba54a6)

Getting Started

Prerequisites
	•	API Key:
Obtain an API key from OpenAI. Insert it into the script file under the OPENAI_API_KEY constant.
	•	Dependencies:
The project relies on the following external libraries:
	•	pdf.js for PDF rendering
	•	OpenAI API for natural language processing

Usage
	1.	"Upload" a PDF: Click the “Upload PDF” button and select a file from your computer.
	2.	Ask Questions: Use the input box to type questions related to the PDF content and press Enter.
	3.	Switch Models: Use the model navigation buttons to toggle between available OpenAI models.
	

Technologies Used
	•	Frontend: HTML, CSS, JavaScript
	•	PDF Parsing: pdf.js
	•	AI Integration: OpenAI API

Known Issues and Limitations
	•	The PDF content is fully preloaded, which may result in delays for large files.
	•	The application does not currently support advanced PDF features such as annotations or form interactions.

Future Improvements
	•	Add drag-and-drop support for PDF uploads.
	•	Enhance the chat interface with more intuitive controls
	•	Implement caching for faster response times when revisiting similar documents.
  • Message history...

License

This project is licensed under the MIT License. See the LICENSE file for details.

import React, { useState } from "react";
import "./App.css";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0); // Track extraction progress

  // Handle file upload
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile.size > 5000000) { // 5MB file size limit
      alert("File is too large. Please upload a file smaller than 5MB.");
      return;
    }
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setExtractedText("");
  };

  // Handle drag and drop
  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile.size > 5000000) {
      alert("File is too large. Please upload a file smaller than 5MB.");
      return;
    }
    setFile(droppedFile);
    setFileName(droppedFile.name);
    setExtractedText("");
  };

  // Prevent default behavior (to allow drop)
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Extract text from PDFs
  const extractTextFromPDF = async (file) => {
    try {
      setIsLoading(true);
      setProgress(0);
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let textContent = "";

        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const text = await page.getTextContent();
          textContent += text.items.map((item) => item.str).join(" ");
          setProgress(Math.floor(((i + 1) / pdf.numPages) * 100)); // Update progress
        }
        setExtractedText(textContent);
      };
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      alert("Error extracting text from PDF: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract text from Images using Tesseract
  const extractTextFromImage = (file) => {
    setIsLoading(true);
    Tesseract.recognize(file, "eng", { logger: (m) => console.log(m) })
      .then(({ data: { text } }) => {
        setExtractedText(text);
      })
      .catch((error) => {
        alert("Error extracting text from image: " + error.message);
      })
      .finally(() => setIsLoading(false));
  };

  // Handle form submission
  const handleGenerateSummary = (event) => {
    event.preventDefault();
    if (!file) return;

    if (file.type === "application/pdf") {
      extractTextFromPDF(file);
    } else if (file.type.startsWith("image/")) {
      extractTextFromImage(URL.createObjectURL(file));
    } else {
      alert("Unsupported file type. Please upload a PDF or image.");
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    alert("Text copied to clipboard!");
  };

  // Clear extracted text and reset file input
  const handleClearText = () => {
    setExtractedText(""); // Clear extracted text
    setFile(null); // Clear file state
    setFileName(""); // Clear file name display
    setProgress(0); // Reset progress

    // Reset file input field
    const fileInput = document.getElementById("file-input");
    if (fileInput) {
      fileInput.value = ""; // This resets the file input
    }
  };

  // Convert text to uppercase
  const handleUppercase = () => {
    setExtractedText(extractedText.toUpperCase());
  };

  // Convert text to Power Case (Capitalize first letter of each word)
  const handlePowerCase = () => {
    setExtractedText(
      extractedText.replace(/\b\w/g, (char) => char.toUpperCase())
    );
  };

  // Remove extra spaces
  const handleRemoveExtraSpaces = () => {
    setExtractedText(extractedText.replace(/\s+/g, " ").trim());
  };

  // Download extracted text as a .txt file
  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "extracted_text.txt";
    link.click();
  };

  return (
    <div>
      <div className="navbar">
        <h1 className="heading">Document Text Extractor</h1>
      </div>
      <div className="app">
        {/* File Upload Section */}
        <form onSubmit={handleGenerateSummary}>
          <div
            className="file-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="icon">📄</div>
            <p>Drag and Drop your file here</p>
            <p>or</p>
            <input
              type="file"
              accept=".pdf, image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="file-input"
            />
            <label htmlFor="file-input" className="browse-label">
              Browse Files
            </label>
            <p>Supported formats: PDF, PNG, JPG, JPEG, GIF</p>
          </div>

          {/* Display file name */}
          {fileName && <p className="file-name">File: {fileName}</p>}
          <button type="submit" disabled={!file}>
            Extract Text
          </button>
        </form>

        <p>*Your privacy is protected! No data is transmitted or stored.</p>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="loading">
            Processing... Please wait
            <div className="progress-bar">
              <div
                className="progress-bar-filled"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Display Extracted Text */}
        {extractedText && (
          <div className="text-output">
            <h3>Extracted Text:</h3>
            <textarea
              className="textarea-extract-text"
              value={extractedText}
              readOnly
              rows="10"
              cols="50"
              style={{ width: "100%", fontSize: "14px" }}
            />

            <div className="actions">
              <button onClick={handleCopyText}>Copy Text</button>
              <button onClick={handleClearText}>Clear Text</button>
              <button onClick={handleUppercase}>To Uppercase</button>
              <button onClick={handlePowerCase}>To Power Case</button>
              <button onClick={handleRemoveExtraSpaces}>Remove Extra Spaces</button>
              <button onClick={handleDownloadText}>Download Text</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

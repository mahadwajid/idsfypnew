import React, { useState } from 'react'; // Import the service function
import { uploadDataset } from '../Services/API';
import { useNavigate } from 'react-router-dom'; 
import { useDataset } from '../Contexts/DatasetContext'; // Import useDataset
import '../CSS/Home.css';

function Home() {
    const [file, setFile] = useState(null); // State to store selected file
    const [fileName, setFileName] = useState(null); // State to display uploaded file name
    const [fileSize, setFileSize] = useState(null); // State to display file size
    const [dragActive, setDragActive] = useState(false); // State to manage drag-and-drop highlight
    const [uploadProgress, setUploadProgress] = useState(0); // State for upload progress
    const [uploadMessage, setUploadMessage] = useState(''); // State to display success/error message

    const navigate = useNavigate(); 
    const { setDatasetName, setDatasetSummary } = useDataset(); // Use the context hook

    const handleFileUpload = (event) => {
        event.preventDefault();
        const selectedFile = event.target.files ? event.target.files[0] : event.dataTransfer.files[0];
        if (selectedFile) {
            setFile(selectedFile); // Store the file
            setFileName(selectedFile.name); // Display file name
            setFileSize(selectedFile.size); // Display file size
        }
        setDragActive(false); // Remove drag highlight
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragActive(true); // Highlight drop zone
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragActive(false); // Remove drag highlight
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!file) {
            setUploadMessage('Please select a file to upload.');
            return;
        }
    
        const formData = new FormData();
        formData.append('dataset', file);
        formData.append('name', fileName);
        formData.append('size', fileSize);
    
        setUploadProgress(0); // Reset progress
    
        try {
            const message = await uploadDataset(formData, (progress) => {
                setUploadProgress(progress); // Update progress state
            });
            setUploadMessage(message); // Display success message
            if (message.includes("success")) {
                // Assuming backend returns dataset name and summary, for now using fileName and a placeholder
                setDatasetName(fileName);
                setDatasetSummary(`Summary for ${fileName}: This is a placeholder summary.`); // Placeholder
                navigate('/visualization'); // Navigate to Data Visualization screen
            }
        } catch (error) {
            setUploadMessage(error.message); // Display error message
        }
    };
    
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="upload-container">
            <div className="upload-card">
                <h2>File Upload</h2>
                
                <div
                    className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleFileUpload}
                >
                    <div className="upload-icon">
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15V3M12 3L7 8M12 3L17 8" stroke="#00BCD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3 15V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V15" stroke="#00BCD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <p>Drag files here or <label htmlFor="file-upload" className="browse-text">Browse</label></p>
                    <input
                        type="file"
                        id="file-upload"
                        accept=".csv, .txt, .doc, .pdf"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>

                {fileName && (
                    <div className="file-info">
                        <div className="file-icon">📄</div>
                        <div className="file-details">
                            <span className="file-name">{fileName}</span>
                            <span className="file-size">{formatFileSize(fileSize)} of {formatFileSize(10 * 1024 * 1024)}</span>
                        </div>
                        {uploadProgress > 0 && (
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                )}

                <button 
                    className="done-button" 
                    onClick={handleUpload}
                    disabled={!file}
                >
                    DONE
                </button>

                {uploadMessage && (
                    <p className="upload-message">
                        {uploadMessage}
                    </p>
                )}
            </div>
        </div>
    );
}

export default Home;

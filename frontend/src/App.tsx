import React, { useState, useEffect } from 'react';
import './App.css';

interface Document {
  id: number;
  filename: string;
  filesize: number;
  created_at: string;
}

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/documents`);
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        showMessage('error', data.message || 'Failed to fetch documents');
      }
    } catch (error) {
      showMessage('error', 'Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showMessage('error', 'Only PDF files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', 'File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'File uploaded successfully');
        fetchDocuments();
        // Clear the file input
        event.target.value = '';
      } else {
        showMessage('error', data.message || 'Failed to upload file');
      }
    } catch (error) {
      showMessage('error', 'Network error. Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        showMessage('error', errorData.message || 'Failed to download file');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showMessage('error', 'Network error. Failed to download file.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Document deleted successfully');
        fetchDocuments();
      } else {
        showMessage('error', data.message || 'Failed to delete document');
      }
    } catch (error) {
      showMessage('error', 'Network error. Failed to delete document.');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Patient Portal</h1>
          <p>Medical Document Management System</p>
        </header>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <main className="main-content">
          <section className="upload-section">
            <h2>Upload Document</h2>
            <div className="upload-area">
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="upload-button">
                {uploading ? 'Uploading...' : 'Choose PDF File'}
              </label>
            </div>
            <p className="upload-info">
              Only PDF files are allowed. Maximum file size: 10MB
            </p>
          </section>

          <section className="documents-section">
            <h2>Your Documents</h2>
            {loading ? (
              <div className="loading">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="no-documents">
                <p>No documents uploaded yet.</p>
                <p>Upload your first medical document to get started.</p>
              </div>
            ) : (
              <div className="documents-list">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="document-info">
                      <h3 className="document-name">{doc.filename}</h3>
                      <div className="document-meta">
                        <span className="file-size">{formatFileSize(doc.filesize)}</span>
                        <span className="upload-date">{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button
                        className="btn btn-download"
                        onClick={() => handleDownload(doc.id, doc.filename)}
                      >
                        Download
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(doc.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;

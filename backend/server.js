const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./documents.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        filesize INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

app.post('/documents/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { filename, path: filepath, size } = req.file;

        const stmt = db.prepare('INSERT INTO documents (filename, filepath, filesize) VALUES (?, ?, ?)');
        stmt.run([filename, filepath, size], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save document metadata'
                });
            }

            res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                document: {
                    id: this.lastID,
                    filename: filename,
                    filesize: size,
                    created_at: new Date().toISOString()
                }
            });
        });
        stmt.finalize();
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload file'
        });
    }
});

app.get('/documents', (req, res) => {
    db.all('SELECT id, filename, filesize, created_at FROM documents ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve documents'
            });
        }

        res.json({
            success: true,
            documents: rows.map(doc => ({
                ...doc,
                filesize: parseInt(doc.filesize)
            }))
        });
    });
});

app.get('/documents/:id', (req, res) => {
    const documentId = req.params.id;

    db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve document'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (!fs.existsSync(row.filepath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        res.download(row.filepath, row.filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Failed to download file'
                    });
                }
            }
        });
    });
});

app.delete('/documents/:id', (req, res) => {
    const documentId = req.params.id;

    db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve document'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (fs.existsSync(row.filepath)) {
            fs.unlinkSync(row.filepath);
        }

        db.run('DELETE FROM documents WHERE id = ?', [documentId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete document'
                });
            }

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        });
    });
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

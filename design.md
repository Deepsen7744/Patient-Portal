# Patient Portal - Design Document

## Tech Stack Choices

### Q1. What frontend framework did you use and why?
**React.js** with modern hooks and functional components. React provides:
- Component-based architecture for reusable UI elements
- Strong ecosystem and community support
- Excellent state management with useState and useEffect
- Easy integration with backend APIs via fetch/axios
- Virtual DOM for efficient rendering

### Q2. What backend framework did you choose and why?
**Express.js** with Node.js. Express offers:
- Minimal and flexible web application framework
- Robust routing and middleware support
- Excellent file upload handling with multer
- Easy database integration
- Large ecosystem of npm packages
- Fast development and deployment

### Q3. What database did you choose and why?
**SQLite** for this implementation. Reasons:
- Zero configuration required - works out of the box
- File-based database - perfect for local development
- ACID compliant and reliable
- No separate database server needed
- Easy to backup and version control
- Sufficient for single-user demo application

### Q4. If you were to support 1,000 users, what changes would you consider?
For 1,000+ users, I would:
- **Database**: Migrate to PostgreSQL or MySQL for better concurrent connections
- **File Storage**: Use cloud storage (AWS S3, Google Cloud Storage) instead of local files
- **Authentication**: Implement JWT-based user authentication and authorization
- **Load Balancing**: Add load balancer and multiple backend instances
- **Caching**: Implement Redis caching for frequently accessed data
- **CDN**: Use CDN for static assets and file downloads
- **Monitoring**: Add logging, monitoring, and error tracking
- **Security**: Implement rate limiting, input validation, and security headers
- **Scaling**: Consider microservices architecture for different features

## Architecture Overview

### System Flow
```
Frontend (React) ←→ Backend API (Express) ←→ Database (SQLite) 
                                    ↓
                              File Storage (uploads/)
```

### Component Flow
1. **Frontend**: React application with components for upload, list, download, delete
2. **Backend**: Express server with REST API endpoints
3. **Database**: SQLite storing file metadata
4. **Storage**: Local uploads/ directory for PDF files

### Data Flow
- User uploads PDF → Frontend sends to backend → Backend saves file and metadata → Database updated
- User views files → Frontend requests list → Backend queries database → Returns file list
- User downloads file → Frontend requests download → Backend serves file from uploads/
- User deletes file → Frontend sends delete request → Backend removes file and database entry

## API Specification

### 1. Upload Document
**Endpoint**: `POST /documents/upload`
**Description**: Upload a PDF file to the server

**Request**:
- Content-Type: multipart/form-data
- Body: file (PDF file)

**Response** (Success - 201):
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "document": {
    "id": 1,
    "filename": "prescription.pdf",
    "filesize": 1024000,
    "created_at": "2025-12-09T10:30:00.000Z"
  }
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

### 2. List All Documents
**Endpoint**: `GET /documents`
**Description**: Get list of all uploaded documents

**Request**: No body required

**Response** (Success - 200):
```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "filename": "prescription.pdf",
      "filesize": 1024000,
      "created_at": "2025-12-09T10:30:00.000Z"
    },
    {
      "id": 2,
      "filename": "test-results.pdf",
      "filesize": 2048000,
      "created_at": "2025-12-09T11:15:00.000Z"
    }
  ]
}
```

### 3. Download Document
**Endpoint**: `GET /documents/:id`
**Description**: Download a specific document by ID

**Request**: Path parameter `id` (document ID)

**Response** (Success - 200):
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="prescription.pdf"
- Body: PDF file content

**Response** (Error - 404):
```json
{
  "success": false,
  "message": "Document not found"
}
```

### 4. Delete Document
**Endpoint**: `DELETE /documents/:id`
**Description**: Delete a specific document by ID

**Request**: Path parameter `id` (document ID)

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Response** (Error - 404):
```json
{
  "success": false,
  "message": "Document not found"
}
```

## Data Flow Description

### Q5. Describe the step-by-step process of what happens when a file is uploaded and when it is downloaded.

**File Upload Process**:
1. User selects PDF file in frontend form
2. Frontend validates file type (PDF only) and size
3. Frontend sends POST request to `/documents/upload` with multipart/form-data
4. Backend receives request, validates file type and size again
5. Multer middleware saves file to `uploads/` directory with unique filename
6. Backend extracts file metadata (original name, size, path)
7. Backend inserts metadata into SQLite database
8. Backend returns success response with document information
9. Frontend updates UI to show new file in list

**File Download Process**:
1. User clicks download button for a document
2. Frontend sends GET request to `/documents/:id`
3. Backend receives request and queries database for document with given ID
4. If document found, backend reads file from uploads/ directory
5. Backend sets appropriate headers (Content-Type: application/pdf)
6. Backend streams file content as response
7. Browser receives file and initiates download
8. If document not found, backend returns 404 error

## Assumptions

### Q6. What assumptions did you make while building this?

**Technical Assumptions**:
- **File Size Limit**: Maximum 10MB per PDF file
- **File Type**: Only PDF files accepted (validated by extension and MIME type)
- **Storage**: Local filesystem storage sufficient for demo purposes
- **Database**: SQLite suitable for single-user application
- **Concurrency**: Low concurrent user load (single user assumption)
- **Network**: Reliable local network connection

**Security Assumptions**:
- **Authentication**: No user authentication required (single user)
- **Authorization**: All users have full access to all documents
- **File Security**: Uploaded files are scanned for basic validation only
- **Input Validation**: Basic validation on frontend and backend

**Business Assumptions**:
- **User Base**: Single user or very small number of users
- **File Volume**: Limited number of documents (hundreds, not thousands)
- **Availability**: Application doesn't need 99.9% uptime
- **Backup**: Manual backup of database and files is sufficient
- **Compliance**: Basic healthcare document handling (no HIPAA compliance needed)

**Infrastructure Assumptions**:
- **Hosting**: Local development environment
- **Resources**: Standard laptop/desktop resources sufficient
- **Maintenance**: Manual maintenance and updates acceptable
- **Monitoring**: Basic console logging sufficient for debugging

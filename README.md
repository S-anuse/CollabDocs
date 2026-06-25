# CollabDocs – Real-Time Collaborative Document Editor

A full-stack Google Docs–style collaborative document editor built with the MERN stack. The application allows multiple users to create, edit, share, and collaborate on documents in real time using Socket.IO. It also supports JWT authentication, version history, image uploads through Cloudinary, and role-based document sharing.

---

## Features

### Authentication

- User Registration & Login
- JWT Authentication (Access Token & Refresh Token)
- Protected Routes
- Secure Password Hashing using bcrypt

### Document Management

- Create Documents
- Edit Documents
- Delete Documents
- Rename Documents
- Auto Save with Debouncing

### Real-Time Collaboration

- Live Collaborative Editing
- Multiple Users Editing Simultaneously
- Socket.IO Rooms
- Online User Count

### Sharing & Permissions

- Share Documents via Email
- Viewer Permission
- Editor Permission
- Remove Shared Access

### Version History

- Automatic Version Saving
- View Previous Versions
- Restore Any Previous Version

### Rich Text Editor

- Text Formatting
- Headings
- Lists
- Hyperlinks
- Image Upload Support

### Cloudinary Integration

- Upload Images
- Store Images on Cloudinary
- Insert Images into Documents

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- React Quill
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Socket.IO
- JWT
- bcrypt
- Multer
- Cloudinary

---

## Project Structure

```
collabdocs/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── uploads/
│   ├── package.json
│   └── server.js
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/collabdocs.git
cd collabdocs
```

---

## Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret

REFRESH_TOKEN_SECRET=your_refresh_token_secret

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret
```

Start Backend

```bash
npm start
```

---

## Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file.

```env
VITE_API_URL=http://localhost:5000
```

Run Frontend

```bash
npm run dev
```

---

## Deployment

Frontend: Vercel

Backend: Render

Database: MongoDB Atlas

Image Storage: Cloudinary

---

## Future Improvements

- Comments
- Presence Indicators
- Document Export (PDF)
- Dark Mode
- Folder Organization
- Richer Text Formatting
- Notifications

---

## Screenshots

Add screenshots here after deployment.

Example:

```
screenshots/
    login.png
    dashboard.png
    editor.png
    share.png
```

---

## License

This project is developed for educational purposes.

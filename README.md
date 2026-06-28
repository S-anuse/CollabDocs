# CollabDocs - Real-Time Collaborative Document Editor

A full-stack, Google Docs-inspired collaborative document editor. CollabDocs allows multiple users to create, edit, and collaborate on documents in real time. The application features live cursor tracking, selection highlighting, role-based sharing, auto-saving, and version history.

---

## Live Link

Try the application live here: [https://collab-docs-peach.vercel.app](https://collab-docs-peach.vercel.app)

---

## Features

- User registration and login
- JWT authentication and protected routes
- Password hashing with bcrypt
- Rich text editing powered by Tiptap (bold, italic, lists, headings, alignment)
- Real-time collaborative editing via Socket.IO
- Active users list and presence indicators
- Real-time cursor tracking and selection highlighting
- Document dashboard with creation, renaming, and deletion
- Auto-save with debouncing
- Document sharing via email with Editor and Viewer roles
- Automatic version history and document restoration
- Image uploading and storage via Cloudinary

---

## Tech Stack

### Frontend
- **React (v19)**
- **Vite**
- **Tailwind CSS (v4)**
- **Tiptap (@tiptap/react)**
- **Socket.IO Client**
- **React Router DOM (v7)**
- **Axios**
- **Lucide React**

### Backend
- **Node.js**
- **Express.js (v5)**
- **MongoDB Atlas**
- **Mongoose**
- **Socket.IO**
- **JSON Web Tokens (JWT)**
- **Multer**
- **Cloudinary SDK**
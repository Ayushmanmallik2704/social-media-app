# 🌐 Social Media App

A full-stack social media application built with **React (Vite)** for the frontend and **Node.js + Express** for the backend.  
This app allows users to register, log in, create posts, like, and interact — similar to Instagram/Facebook.

---

## 🚀 Features
- 🔐 User Authentication (Register/Login with JWT)
- 👤 User Profiles
- 📝 Create, Edit & Delete Posts
- ❤️ Like & Comment System
- 🌙 Dark Mode (Tailwind)
- 📱 Responsive UI (Mobile + Desktop)

---

## 🛠️ Tech Stack

### Frontend:
- ⚛️ React (Vite)
- 🎨 Tailwind CSS
- 🔄 Axios (API calls)

### Backend:
- 🌐 Node.js + Express.js
- 🗄️ MongoDB + Mongoose
- 🔑 JWT Authentication
- 🛡️ Bcrypt (Password Hashing)

---

## 📂 Project Structure
social-media-app/
│── social-media-frontend/ # React + Vite frontend
│ ├── src/
│ │ ├── components/ # UI components
│ │ ├── pages/ # Page-level components
│ │ ├── App.jsx # Main app
│ │ └── index.css # Tailwind styles
│
│── social-media-backend/ # Express backend
│ ├── routes/ # API routes
│ ├── models/ # Mongoose models
│ ├── server.js # Main server file
│
└── README.md


## ⚡ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Ayushmanmallik2704/social-media-app.git
cd social-media-app

#Setup Backend
cd social-media-backend
npm install
npm start

Make sure you have a .env file:
MONGO_URI=your_mongodb_url
JWT_SECRET=your_jwt_secret
PORT=5000

Setup Frontend
cd ../social-media-frontend
npm install
npm run dev


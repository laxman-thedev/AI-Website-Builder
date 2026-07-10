#  AI Website Builder

##  Description

AI Website Builder is a full-stack web application that allows users to generate complete, responsive websites using AI. Users can input prompts, and the system generates modern UI websites with real-time preview, version control, and project management.

The platform also includes authentication, credit-based usage, and Stripe integration for purchasing credits.

---

##  Features

*  AI-powered website generation from prompts
*  Automatic HTML + Tailwind CSS code generation
*  Real-time website preview
*  Version control (track and rollback changes)
*  Authentication system (Better Auth)
*  Credit-based system with Stripe payments
*  Project management (create, edit, delete)
*  Community page to view published projects
*  Fully responsive UI

---

## 📂 Project Structure

```
AI-Website-Builder/
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── configs/
│   │   ├── lib/
│   │   └── types/
│   └── public/
│
├── server/                # Backend (Node.js + Express)
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── prisma/
│   ├── configs/
│   ├── lib/
│   └── types/
│
└── README.md
```

---

##  Technologies Used

### Frontend

* React (Vite)
* TypeScript
* Tailwind CSS
* Axios
* React Router
* Better Auth UI

### Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* Better Auth
* Stripe API
* OpenAI (via OpenRouter)

---

## Installation

### 1. Clone the repository

```
git clone https://github.com/your-username/ai-website-builder.git
cd ai-website-builder
```

---

### 2. Setup Environment Variables

Create `.env` files in both `client` and `server` folders.

Refer:

```
.env.example
```

---

### 3. Install Dependencies

```
cd client
npm install

cd ../server
npm install
```

---

### 4. Setup Database

```
npx prisma db push
npx prisma generate
```

---

### 5. Run the Project

Start backend:

```
npm run server
```

Start frontend:

```
cd client
npm run dev
```

---

## Demo

* Live App: https://instantwebai.vercel.app

---

## 📄 License

This project is licensed under the terms specified in the `LICENSE` file.
Refer to **license.md** for details.

---

## 🤝 Contributing

Contributions are welcome!

Please read **contributing.md** for guidelines on how to contribute to this project.

---

## Author

**Laxman Goud**

* Portfolio: https://laxman-thedev.me
* GitHub: https://github.com/laxman-thedev

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

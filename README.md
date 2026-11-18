# 🏛️ TK — College Library Management System

A production-ready, full-stack College Library Management System built with a white glassmorphism user interface and an Express / MongoDB Atlas REST backend.

---

## 🌟 Key Features & Architecture

### 1. Three Separate Login & Portal Systems
- **Student Portal (`/login/student`)**:
  - Live catalog discovery with full-text search (Title, Author, ISBN, Category, Publisher).
  - Physical copy stock availability tracking (`availableCopies` vs `totalCopies`).
  - Book issue request submission.
  - Hold/reservation queue placement for out-of-stock titles.
  - Active loan countdown with due date reminders and overdue alerts.
  - Borrowing history ledger and fine penalty breakdown.
  - Secure self-service password update.
- **Librarian Portal (`/login/librarian`)**:
  - Catalog inventory management (Add, edit, and safe archive with historical preservation).
  - Counter checkout (direct issue to Student ID) and return check-in.
  - Concurrency-safe atomic inventory decrement and increment.
  - Automated due date calculation based on configurable loan periods.
  - Overdue loans identification with student contact information and calculated fines.
  - Student borrow request approvals and decline handling with custom reasons.
  - Overdue fine collection recording and waiver authorization.
  - Exportable CSV reports for catalog inventory and circulation logs.
- **Admin Portal (`/login/admin`)**:
  - System-wide real-time analytics directly aggregated from MongoDB Atlas.
  - Student and librarian user provisioning, role assignments, and account activation/deactivation.
  - Institutional circulation policies (Loan period in days, max borrow limits, daily overdue fine rates, fine enabled/disabled toggle).
  - Security and operational audit trail with user role, action, target, IP address, and timestamps.
  - *RBAC Guard*: Only authorized librarians and administrators can add, edit, or archive books.

### 2. Design System: Professional White Glassmorphism
- White and soft off-white canvas with subtle ambient blur (`backdrop-blur-md bg-white/75`).
- Thin, low-contrast borders and restrained depth.
- Dark charcoal typography with high contrast readability.
- Subtle teal and sky accents for circulation indicators and buttons.
- Fully responsive across desktop, laptop, tablet, and mobile displays.

### 3. Real MongoDB Atlas Database — Zero Mock Data
- MongoDB Atlas cluster collections with indexed fields, unique constraints, and relations.
- Proper empty states when collections contain 0 records.
- Live database connection status monitoring on both frontend and backend.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24 LTS recommended)
- **MongoDB Atlas Cluster**: Connection string URI

---

### Step 1: Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Configure environment variables in `backend/.env` (see `backend/.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/college_library_db?retryWrites=true&w=majority
   JWT_SECRET=super_secret_college_library_key_2026_antigravity
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```

3. **Secure Initial Administrator Provisioning**:
   Before launching the application for the first time, provision the master administrator account:
   ```bash
   # Interactive / argument-driven provisioning:
   node src/scripts/setupAdmin.js --name="Administrator" --email="admin@college.edu" --password="YourSecurePassword123"

   # Or via npm script:
   npm run setup-admin
   ```
   *Note: This script enforces a single-use security guard and will refuse to run if an administrator already exists in the database.*

4. Run the automated tests:
   ```bash
   npm test
   ```

5. Start the backend server:
   ```bash
   # Development mode with hot-reloading:
   npm run dev

   # Or production start:
   npm start
   ```
   *The API will start at `http://localhost:5000` with health check at `http://localhost:5000/api/health`.*

---

### Step 2: Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Verify or create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open at `http://localhost:5173`.*

4. (Optional) Build production bundle:
   ```bash
   npm run build
   ```

---

## 🔒 Security & RBAC Implementation

| Endpoint Group | Allowed Roles | Description |
| :--- | :--- | :--- |
| `POST /api/auth/login` | Public | Role-verified authentication |
| `POST /api/auth/register-student` | Public | Enrolls new students (role strictly forced to `student`) |
| `GET /api/books` | Public / All | Searchable catalog browsing |
| `POST, PUT, DELETE /api/books` | **Librarian Only** | Catalog modifications (Admin/Student blocked) |
| `POST /api/circulation/request` | **Student Only** | Student issue request |
| `POST /api/circulation/issue-direct` | **Librarian Only** | Direct counter checkout |
| `POST /api/circulation/:id/return` | **Librarian Only** | Check in return and calculate fines |
| `GET, POST, PUT /api/users` | **Admin Only** | User lifecycle & account activation |
| `PUT /api/settings` | **Admin Only** | Circulation rules and fine rate configuration |
| `GET /api/audit-logs` | **Admin Only** | Security audit events inspection |

---

## 📂 Project Directory Structure

```
LMS/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Business logic & DB aggregations
│   │   ├── middleware/      # Auth, RBAC, Rate limiter, Error handler
│   │   ├── models/          # Mongoose models (User, Book, BorrowTransaction, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── scripts/         # Initial admin provisioning (setupAdmin.js)
│   │   ├── utils/           # JWT, auditLogger helpers
│   │   ├── validators/      # Express-validator schemas
│   │   ├── app.js           # Express app configuration
│   │   └── server.js        # Server listener
│   ├── tests/               # Automated RBAC & security tests
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Glassmorphic UI (Navbar, Sidebar, StatCard, etc.)
│   │   ├── context/         # AuthContext with session & health state
│   │   ├── layouts/         # AppLayout, PublicLayout, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── public/      # Landing, Login (Student/Librarian/Admin), Register
│   │   │   ├── student/     # Student dashboard, Browse, Loans, Reservations
│   │   │   ├── librarian/   # Librarian dashboard, Catalog, Circulation, Fines
│   │   │   └── admin/       # Admin dashboard, Students, Staff, Settings, Logs
│   │   ├── routes/          # AppRoutes.jsx
│   │   ├── services/        # Axios api client with interceptors
│   │   ├── index.css        # Tailwind & Glassmorphic tokens
│   │   └── main.jsx         # React DOM root
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛡️ License
Proprietary Educational Software &middot; Developed for College Library Operations.

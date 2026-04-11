# 👟 ShoeStore — Full-Stack E-Commerce

A complete, professional e-commerce website for shoes built with HTML/CSS/JS (frontend) and Node.js + Express + MySQL (backend).

---

## 📁 Project Structure

```
shoestore/
├── frontend/
│   ├── index.html          ← Home page
│   ├── products.html       ← Products listing with filters
│   ├── product.html        ← Single product detail
│   ├── cart.html           ← Shopping cart
│   ├── checkout.html       ← Checkout form
│   ├── login.html          ← Sign in
│   ├── signup.html         ← Create account
│   ├── admin.html          ← Admin dashboard
│   ├── css/style.css       ← All styles (color palette + responsive)
│   └── js/script.js        ← All frontend logic
│
├── backend/
│   ├── server.js           ← Express app entry point
│   ├── package.json        ← Node dependencies
│   ├── .env.example        ← Environment variable template
│   ├── config/
│   │   └── database.js     ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js         ← JWT auth middleware
│   ├── routes/
│   │   ├── products.js     ← GET/POST/PUT/DELETE /api/products
│   │   ├── users.js        ← POST /api/users/register|login
│   │   ├── orders.js       ← POST/GET /api/orders
│   │   └── admin.js        ← GET /api/admin/stats
│   └── controllers/
│       ├── productController.js
│       ├── userController.js
│       └── orderController.js
│
└── schema.sql              ← MySQL database schema + seed data
```

---

## 🎨 Color Palette

| Variable     | Hex       | Usage                  |
|--------------|-----------|------------------------|
| Primary      | `#1B3C53` | Navbar, buttons, text  |
| Secondary    | `#234C6A` | Hover states, gradient |
| Accent       | `#456882` | Labels, badges, links  |
| Background   | `#D2C1B6` | Page background        |

---

## ⚡ Quick Start (Frontend Only — No Backend Needed)

The frontend works **standalone** with built-in mock data. You can open it directly in a browser:

```bash
# Option 1: Open index.html directly in your browser
open frontend/index.html

# Option 2: Use VS Code Live Server extension
# Right-click index.html → "Open with Live Server"

# Option 3: Use Python's built-in server
cd frontend
python3 -m http.server 5500
# Then visit http://localhost:5500
```

All features work in demo mode — cart, wishlist, product browsing, login (any credentials), checkout, admin dashboard.

---

## 🔧 Full Setup with Backend

### Step 1 — Install Node.js

Download and install Node.js (v18+ recommended):
- **Windows/Mac**: https://nodejs.org → Download LTS
- **Linux**: `sudo apt install nodejs npm` or use [nvm](https://github.com/nvm-sh/nvm)

Verify installation:
```bash
node --version   # Should show v16+ 
npm --version    # Should show 8+
```

---

### Step 2 — Install Backend Dependencies

```bash
# Navigate to the backend folder
cd shoestore/backend

# Install all packages listed in package.json
npm install

# This installs: express, mysql2, bcryptjs, jsonwebtoken, cors, helmet, dotenv, morgan, nodemon
```

---

### Step 3 — Set Up MySQL Database

**3a. Install MySQL** (if not already installed):
- **Windows**: Download MySQL Installer from https://dev.mysql.com/downloads/installer/
- **Mac**: `brew install mysql` then `brew services start mysql`
- **Linux**: `sudo apt install mysql-server` then `sudo systemctl start mysql`

**3b. Create the database and tables:**
```bash
# Log in to MySQL (enter your root password when prompted)
mysql -u root -p

# Or run the schema file directly:
mysql -u root -p < shoestore/schema.sql
```

This creates:
- `shoestore` database
- `users`, `products`, `orders`, `order_items` tables
- 8 sample products
- 1 admin user (`admin@shoestore.com` / `admin123`)

---

### Step 4 — Configure Environment Variables

```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit .env with your MySQL credentials
nano backend/.env   # or open in any text editor
```

Update these values in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD   ← change this
DB_NAME=shoestore
JWT_SECRET=any_long_random_string ← change this
PORT=5000
```

---

### Step 5 — Run the Backend Server

```bash
cd shoestore/backend

# Development mode (auto-restarts on file changes)
npm run dev

# OR production mode
npm start
```

You should see:
```
✅ MySQL connected successfully
✅ ShoeStore API running at http://localhost:5000
```

Test the API is working:
```bash
curl http://localhost:5000/api/health
# {"status":"OK","message":"ShoeStore API is running"}

curl http://localhost:5000/api/products
# Returns JSON array of products from database
```

---

### Step 6 — Connect Frontend to Backend

Open `frontend/js/script.js` and verify the API URL matches your server:

```javascript
const CONFIG = {
  API_BASE: 'http://localhost:5000/api',  // ← must match your PORT
  ...
};
```

The frontend automatically tries the API and falls back to mock data if the server is offline.

---

### Step 7 — Run the Website

**Option A — Serve frontend from the backend (simplest)**

The backend already serves the frontend folder:
```bash
# Make sure backend is running (Step 5)
# Then visit:
http://localhost:5000
```

**Option B — Separate frontend server**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && python3 -m http.server 5500
# Visit http://localhost:5500
```

---

## 🔑 API Endpoints

| Method | Endpoint                  | Auth     | Description               |
|--------|---------------------------|----------|---------------------------|
| GET    | `/api/health`             | None     | Server health check       |
| GET    | `/api/products`           | None     | Get all products           |
| GET    | `/api/products/:id`       | None     | Get single product         |
| POST   | `/api/products`           | Admin    | Create product             |
| PUT    | `/api/products/:id`       | Admin    | Update product             |
| DELETE | `/api/products/:id`       | Admin    | Delete product             |
| POST   | `/api/users/register`     | None     | Register new user          |
| POST   | `/api/users/login`        | None     | Login, get JWT token       |
| GET    | `/api/users/profile`      | User     | Get profile                |
| POST   | `/api/orders`             | User     | Create order               |
| GET    | `/api/orders/my-orders`   | User     | Get user's orders          |
| GET    | `/api/orders`             | Admin    | Get all orders             |
| PUT    | `/api/orders/:id/status`  | Admin    | Update order status        |
| GET    | `/api/admin/stats`        | Admin    | Dashboard statistics       |

---

## 👤 Default Accounts

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| Admin    | admin@shoestore.com      | admin123   |
| Demo     | any@email.com            | any6chars  |

---

## 🚀 Features

### Frontend
- ✅ Responsive design (mobile + desktop)
- ✅ Product grid with filters and sorting
- ✅ Shopping cart (localStorage, real-time updates)
- ✅ Product detail page with size selection
- ✅ Checkout form with validation
- ✅ Login & signup with password strength meter
- ✅ Admin dashboard with stats, product and order management
- ✅ Toast notifications
- ✅ Wishlist toggle
- ✅ Works in demo mode without a backend

### Backend
- ✅ REST API with Express.js
- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ MySQL with connection pooling
- ✅ CORS, Helmet security headers
- ✅ Request logging with Morgan
- ✅ Graceful fallback to mock data

---

## 🛠️ Tech Stack

| Layer      | Technology        |
|------------|-------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript |
| Backend    | Node.js, Express.js |
| Database   | MySQL             |
| Auth       | JWT (jsonwebtoken) |
| Security   | bcryptjs, Helmet, CORS |

---

## 📦 NPM Packages Used

```
express        — Web framework
mysql2         — MySQL driver with Promise support
bcryptjs       — Password hashing
jsonwebtoken   — JWT creation and verification
cors           — Cross-Origin Resource Sharing
helmet         — Security HTTP headers
morgan         — HTTP request logger
dotenv         — Environment variable loader
nodemon        — Dev auto-restart (devDependency)
```

---

## ❓ Troubleshooting

**"Cannot connect to MySQL"**
- Make sure MySQL is running: `sudo systemctl status mysql`
- Check your `.env` DB_PASSWORD matches your MySQL root password
- Try: `mysql -u root -p` to test direct connection

**"Port 5000 already in use"**
- Change `PORT=5001` in your `.env` file
- Update `API_BASE` in `frontend/js/script.js` accordingly

**"CORS error in browser"**
- Make sure your frontend URL is in the `cors` whitelist in `server.js`
- For local development, use `http://localhost:5500` or `http://127.0.0.1:5500`

**Products not loading from API**
- The frontend will automatically use mock data as fallback
- Check the browser console for error messages
- Verify the backend is running: `curl http://localhost:5000/api/health`

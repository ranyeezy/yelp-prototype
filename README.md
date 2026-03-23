# 🍽️ Yelp Prototype

A full-stack restaurant discovery and review platform. Users can explore restaurants, write reviews, manage favorites, and get AI-powered recommendations. Restaurant owners get a dedicated dashboard to track feedback and analytics.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| Database | MySQL |
| Auth | JWT (separate flows for users & owners) |
| AI | LangChain + Tavily web search |
| Media | FastAPI StaticFiles for uploaded images |

---

## 📋 Prerequisites

Before running locally, make sure you have:

- **Python 3.10+**
- **Node.js 18+** *(required to run the React frontend)*
- **MySQL 8+** running locally

---

## 🗄️ Step 1 — MySQL Database Setup

Open your MySQL shell (`mysql -u root -p`) and run these commands once:

```sql
CREATE DATABASE yelp_prototype
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'yelp_user'@'localhost' IDENTIFIED BY 'yelp_pass_123';

GRANT ALL PRIVILEGES ON yelp_prototype.* TO 'yelp_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

---

## ⚙️ Step 2 — Backend Setup

```bash
cd backend
```

Create `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://yelp_user:yelp_pass_123@localhost:3306/yelp_prototype
JWT_SECRET=my_super_secret_jwt_key_change_in_prod
TAVILY_API_KEY=your_tavily_key_here
```

> `TAVILY_API_KEY` is optional — the AI assistant works without it but will not pull live web results.

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

✅ Backend is live at:

| Resource | URL |
|----------|-----|
| API base | `http://127.0.0.1:8000` |
| Swagger UI | `http://127.0.0.1:8000/docs` |
| ReDoc | `http://127.0.0.1:8000/redoc` |

> Database tables are created automatically on first startup.

---

## 🎨 Step 3 — Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend starts at `http://localhost:5173`

When prompted in the app, set the **API Base URL** to `http://127.0.0.1:8000`

---

## 🚀 End-to-End Verification Flow

1. Open `http://127.0.0.1:8000/docs` — confirm Swagger loads
2. Open `http://localhost:5173` — confirm the homepage loads
3. **Sign up** as a new user → log in → browse restaurants
4. **Search** restaurants by name, cuisine, keywords, or city
5. **Add a favorite** and view it in your Favorites tab
6. **Write a review** with a star rating and optional photo
7. **Update your profile** and configure dining preferences
8. **Open AI Assistant** → ask for personalized restaurant recommendations
9. **Sign up as an owner** → claim a restaurant → view your analytics dashboard

---

## 🗺️ API Reference

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/users/signup` | Register a new user |
| POST | `/auth/users/login` | User login — returns JWT |
| POST | `/auth/owners/signup` | Register a new owner |
| POST | `/auth/owners/login` | Owner login — returns JWT |

</details>

<details>
<summary><strong>Users and Owners</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PUT | `/users/me` | Update user profile |
| GET | `/owners/me` | Get current owner profile |
| PUT | `/owners/me` | Update owner profile |

</details>

<details>
<summary><strong>Restaurants</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/restaurants` | Add a new restaurant |
| GET | `/restaurants` | List and search restaurants |
| GET | `/restaurants/{id}` | Get restaurant detail |
| PUT | `/restaurants/{id}` | Update a restaurant |
| DELETE | `/restaurants/{id}` | Delete a restaurant |

</details>

<details>
<summary><strong>Reviews</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reviews` | Submit a review |
| GET | `/reviews/restaurant/{id}` | Get reviews for a restaurant |
| GET | `/reviews/me` | Get current user review history |
| PUT | `/reviews/{id}` | Update own review |
| DELETE | `/reviews/{id}` | Delete own review |
| POST | `/reviews/uploads/photo` | Upload a review photo |

</details>

<details>
<summary><strong>Favorites</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/favorites/{restaurant_id}` | Mark restaurant as favorite |
| GET | `/favorites/me` | List your favorites |
| DELETE | `/favorites/{restaurant_id}` | Remove from favorites |

</details>

<details>
<summary><strong>Preferences</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/preferences/me` | Get saved user preferences |
| PUT | `/preferences/me` | Save user preferences |

</details>

<details>
<summary><strong>Owner Dashboard</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/owners/restaurants/{id}/claim` | Claim a restaurant listing |
| GET | `/owners/restaurants` | List claimed restaurants |
| GET | `/owners/dashboard` | Analytics and recent reviews |

</details>

<details>
<summary><strong>AI Assistant</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai-assistant/chat` | Multi-turn restaurant recommendation chat |

</details>

---

## 💡 Sample Requests

**User Signup**
```json
POST /auth/users/signup
{
  "name": "Alex",
  "email": "alex@example.com",
  "password": "secure123"
}
```

**Submit a Review** *(Bearer token required)*
```json
POST /reviews
{
  "restaurant_id": 1,
  "rating": 5,
  "comment": "Outstanding food and atmosphere."
}
```

**Add a Restaurant** *(Bearer token required)*
```json
POST /restaurants
{
  "name": "The Golden Spoon",
  "cuisine_type": "Mediterranean",
  "address": "200 Market St",
  "city": "San Jose"
}
```

**AI Chat** *(Bearer token required)*
```json
POST /ai-assistant/chat
{
  "message": "I want spicy Thai food under $20 in downtown San Jose",
  "conversation_history": []
}
```

---

## 📁 Project Structure

```
yelp-prototype/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── models.py          # Database models
│   │   ├── schemas.py         # Request and response schemas
│   │   ├── database.py        # DB connection setup
│   │   ├── security.py        # Password hashing and JWT
│   │   ├── deps.py            # Auth dependency injection
│   │   ├── ai_chat_service.py # LangChain AI integration
│   │   ├── crud_*.py          # CRUD logic per resource
│   │   └── routers/           # Route handlers per feature
│   ├── uploads/               # Uploaded images (restaurants, reviews, profiles)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/
        │   ├── public/        # Explore page and restaurant details
        │   ├── user/          # Authenticated user pages
        │   └── owner/         # Authenticated owner pages
        ├── components/        # Shared UI components
        └── App.jsx            # Router and app entry
```

---

## 🔒 Notes

- Passwords are hashed with **bcrypt** — plaintext passwords are never stored.
- JWT tokens are signed and expire; clients must re-authenticate to renew access.
- Uploaded media is stored in `backend/uploads/` and served at `/uploads/<filename>`.
- The `DATABASE_URL` in `.env` must match the MySQL credentials created in Step 1 exactly.
- Tables are auto-created on first startup — no separate migration step required.
- API documentation is available via Swagger at `/docs` once the backend is running.

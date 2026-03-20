## Yelp Prototype

Yelp-style full-stack lab project with:

- FastAPI + SQLAlchemy backend
- React + Vite frontend
- JWT authentication for users and owners
- Restaurant discovery, reviews, favorites, owner dashboard, and AI assistant

## Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8+ (or compatible MySQL server)

## 1) Backend setup and run

From the project root:

```bash
cd backend
```

Create `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:<port>/<db_name>
JWT_SECRET=<long-random-secret>
TAVILY_API_KEY=<optional-for-web-context-enrichment>
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend server:

```bash
uvicorn app.main:app --reload
```

Backend should be available at:

- API base: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 2) Frontend setup and run

Open a new terminal from project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs at Vite's local URL (typically `http://127.0.0.1:5173` or `http://localhost:5173`).

In the app UI, set API base URL to:

- `http://127.0.0.1:8000`

Optional production build check:

```bash
npm run build
```

## 3) Quick verification flow

1. Start backend (`uvicorn`) and confirm `GET /docs` loads.
2. Start frontend (`npm run dev`) and open the Vite URL.
3. Sign up/login as a user.
4. Search restaurants, add favorites, and create a review.
5. Login as an owner, claim a restaurant, and open owner dashboard.
6. Open AI assistant and submit a recommendation query.

## Implemented API routes

### Auth
- `POST /auth/users/signup`
- `POST /auth/users/login`
- `POST /auth/owners/signup`
- `POST /auth/owners/login`

### User and owner profile
- `GET /users/me`
- `PUT /users/me`
- `GET /owners/me`
- `PUT /owners/me`

### Owner restaurant management
- `POST /owners/restaurants/{restaurant_id}/claim`
- `GET /owners/restaurants`
- `GET /owners/dashboard`

### Preferences
- `GET /preferences/me`
- `PUT /preferences/me`

### Restaurants
- `POST /restaurants`
- `GET /restaurants`
- `GET /restaurants/{restaurant_id}`
- `PUT /restaurants/{restaurant_id}`
- `DELETE /restaurants/{restaurant_id}`

### Reviews
- `POST /reviews`
- `GET /reviews/restaurant/{restaurant_id}`
- `GET /reviews/me`
- `PUT /reviews/{review_id}`
- `DELETE /reviews/{review_id}`

### Favorites
- `POST /favorites/{restaurant_id}`
- `GET /favorites/me`
- `DELETE /favorites/{restaurant_id}`

### AI assistant
- `POST /ai-assistant/chat`

## Quick request examples

### User signup

`POST /auth/users/signup`

```json
{
	"name": "Alice",
	"email": "alice@example.com",
	"password": "pass1234"
}
```

### Create review

`POST /reviews` (Bearer token required)

```json
{
	"restaurant_id": 1,
	"rating": 5,
	"comment": "Amazing food and service"
}
```

### Create restaurant

`POST /restaurants` (Bearer token required)

```json
{
	"name": "Downtown Grill",
	"cuisine_type": "American",
	"address": "100 Main St",
	"city": "San Jose"
}
```

### Add favorite

`POST /favorites/1` (Bearer token required)

### Owner claim a restaurant

`POST /owners/restaurants/1/claim` (Owner Bearer token required)

### AI assistant chat

`POST /ai-assistant/chat` (Bearer token required)

```json
{
	"message": "Find me affordable Indian food in San Jose",
	"conversation_history": []
}
```

## Notes

- Backend dependencies are pinned in `backend/requirements.txt`.
- Database tables auto-create on app startup via SQLAlchemy metadata.
- AI endpoint includes LangChain-based filter parsing and optional Tavily web context when `TAVILY_API_KEY` is configured.

## Frontend demo flows

- User auth (signup/login)
- Restaurant search/listing
- Favorites add/remove
- Reviews create/list
- Owner login, claim restaurant, dashboard view
- AI assistant chat recommendations

## Current implementation status

- Backend APIs for auth, users/owners, restaurants, reviews, favorites, preferences, owner analytics, and AI assistant are implemented.
- Frontend includes user and owner authentication, restaurant discovery, listing management, favorites, reviews, preferences, and AI chat flows.
- UI has responsive Yelp-inspired styling and includes lab pair attribution in the dashboard.

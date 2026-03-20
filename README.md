## Yelp Prototype

Backend API for a Yelp-style lab project using FastAPI + SQLAlchemy.

## Backend setup

1) Create `backend/.env` with:

```env
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:<port>/<db_name>
JWT_SECRET=<long-random-secret>
```

2) Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3) Run server:

```bash
uvicorn app.main:app --reload
```

4) Open docs:

- Swagger: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

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

### AI assistant chat

`POST /ai-assistant/chat` (Bearer token required)

```json
{
	"message": "Find me affordable Indian food in San Jose",
	"conversation_history": []
}
```

## Notes

- Keep using `requirements.txt` as the backend dependency source for submission.
- Tables auto-create on app startup via SQLAlchemy metadata.

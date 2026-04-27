# 🍽️ Yelp Prototype

A full-stack restaurant discovery and review platform. Users can explore restaurants, write reviews, manage favorites, and get AI-powered recommendations. Restaurant owners get a dedicated dashboard to track feedback and analytics.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Redux Toolkit |
| Backend | Python + FastAPI (microservices) |
| Database | MongoDB |
| Message Queue | Apache Kafka + Zookeeper |
| Auth | JWT (separate flows for users & owners) |
| AI | LangChain + Groq + Tavily web search |
| Container | Docker + Docker Compose |
| Orchestration | Kubernetes (AWS EKS) |
| Gateway | Nginx reverse proxy |
| Media | FastAPI StaticFiles for uploaded images |

---

## 🚀 Option A — Run with Docker Compose (Recommended)

Runs the full stack locally: MongoDB, Kafka, Zookeeper, all microservices, and Nginx.

### Prerequisites
- Docker Desktop running
- `backend/.env` file with:

```env
JWT_SECRET=yelpsecretkey
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### Start the backend

```bash
cd backend
docker-compose up -d
```

All services start in order: Zookeeper → MongoDB → Kafka → microservices → Nginx.
API gateway is available at `http://localhost`.

### Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Ensure `frontend/.env.local` contains:

```env
VITE_API_URL=http://localhost
```

### Populate the database (first run only)

```bash
cd backend
python3 populate_db.py
```

### Stop all services

```bash
cd backend
docker-compose down
```

---

## ☁️ Option B — Deploy to AWS EKS

### Prerequisites
- AWS CLI configured (`aws configure`)
- `eksctl` and `kubectl` installed
- Docker installed

### 1. Create EKS cluster

```bash
eksctl create cluster --name=yelp-cluster --region=us-east-1 --nodes=3
aws eks update-kubeconfig --name=yelp-cluster --region=us-east-1
```

### 2. Build and push images to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build with linux/amd64 (required on Apple Silicon Macs)
docker build --platform linux/amd64 -t yelp/user-service \
  -f services/user-service/Dockerfile.user services/user-service

docker tag yelp/user-service:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/yelp/user-service:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/yelp/user-service:latest
```

Repeat for: `owner-service`, `restaurant-service`, `review-service`, `restaurant-worker-service`, `review-worker-service`.

### 3. Attach ECR permissions to node group

In AWS IAM → find the node group role → attach `AmazonEC2ContainerRegistryReadOnly`.

### 4. Create Kubernetes secret

```bash
kubectl create secret generic yelp-secrets --namespace yelp \
  --from-literal=GROQ_API_KEY="your_groq_api_key_here"
```

### 5. Deploy to cluster

```bash
kubectl apply -f backend/k8s/k8s.yaml
kubectl get pods -n yelp -w
```

### 6. Get public URL

```bash
kubectl get svc -n yelp nginx-gateway
# Copy the EXTERNAL-IP value
```

### 7. Populate the database on EKS

```bash
kubectl port-forward -n yelp svc/mongodb 27017:27017 &
python3 backend/populate_db_simple.py
```

### Scale a deployment

```bash
kubectl scale deployment user-service -n yelp --replicas=3
```

### Pause cluster (stop EC2 billing)

```bash
eksctl scale nodegroup --cluster=yelp-cluster --name=<nodegroup-name> --nodes=0 --nodes-min=0
```

### Delete cluster

```bash
eksctl delete cluster --name=yelp-cluster
```

---

## 🚀 End-to-End Verification Flow

1. Open `http://localhost:5173` — confirm the homepage loads
2. **Sign up** as a new user → log in → browse restaurants
3. **Search** restaurants by name, cuisine, keywords, or city
4. **Add a favorite** and view it in your Favorites tab
5. **Write a review** with a star rating and optional photo
6. **Update your profile** and configure dining preferences
7. **Open AI Assistant** → ask for personalized restaurant recommendations
8. **Sign up as an owner** → claim a restaurant → view your analytics dashboard

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
| GET | `/reviews/my-reviews` | Get current user review history |
| PUT | `/reviews/{id}` | Update own review |
| DELETE | `/reviews/{id}` | Delete own review |

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
  "restaurant_id": "64a1f...",
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
│   ├── services/
│   │   ├── user-service/          # Auth, profiles, sessions, AI assistant
│   │   ├── owner-service/         # Owner auth and dashboard
│   │   ├── restaurant-service/    # Restaurant CRUD + Kafka producer
│   │   ├── review-service/        # Review CRUD + Kafka producer
│   │   ├── restaurant-worker-service/  # Kafka consumer → MongoDB
│   │   └── review-worker-service/      # Kafka consumer → MongoDB
│   ├── k8s/
│   │   └── k8s.yaml               # Full Kubernetes manifest
│   ├── nginx/
│   │   └── nginx.conf             # Reverse proxy config
│   ├── docker-compose.yml
│   ├── populate_db.py             # Populate via API (Docker Compose)
│   └── populate_db_simple.py      # Populate directly via MongoDB (EKS)
└── frontend/
    └── src/
        ├── store/
        │   ├── index.js           # Redux store
        │   ├── slices/            # auth, restaurants, reviews, favorites
        │   └── selectors/         # Selectors per slice
        ├── pages/
        │   ├── public/            # Explore page and restaurant details
        │   ├── user/              # Authenticated user pages
        │   └── owner/             # Authenticated owner pages
        ├── components/            # Shared UI components
        └── App.jsx
```

---

## 🔒 Notes

- Passwords are hashed with **bcrypt** — plaintext passwords are never stored.
- JWT tokens are signed and expire; clients must re-authenticate to renew access.
- Sessions are stored in MongoDB with a TTL index on `expires_at` for automatic expiry.
- Uploaded media is stored per-service in `uploads/` and served at `/uploads/<filename>`.
- Kafka topics (`review.created`, `review.updated`, `review.deleted`, `restaurant.created`) are auto-created on first message.
- API documentation is available via Swagger at each service's `/docs` endpoint.

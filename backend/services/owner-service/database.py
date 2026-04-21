import os
from pymongo import MongoClient

MONGODB_URL = os.getenv("DATABASE_URL", "mongodb://mongodb-service:27017/yelp_prototype")

client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
db = client.yelp_prototype

# Create indexes for common queries
def init_db():
    """Initialize database indexes"""
    
    # Users collection indexes
    db.users.create_index("email", unique=True)
    
    # Owners collection indexes
    db.owners.create_index("email", unique=True)
    
    # Restaurants collection indexes
    db.restaurants.create_index("name")
    db.restaurants.create_index("city")
    db.restaurants.create_index("listed_by_user_id")
    
    # Reviews collection indexes
    db.reviews.create_index("restaurant_id")
    db.reviews.create_index("user_id")
    db.reviews.create_index([("user_id", 1), ("restaurant_id", 1)], unique=True)
    
    # Sessions collection indexes with TTL
    db.sessions.create_index("expires_at", expireAfterSeconds=0)
    db.sessions.create_index("user_id")
    
    # Favorites collection indexes
    db.favorites.create_index([("user_id", 1), ("restaurant_id", 1)], unique=True)
    
    print("MongoDB indexes created successfully")

# Initialize on startup
init_db()
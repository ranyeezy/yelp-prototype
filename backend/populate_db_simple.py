#!/usr/bin/env python3
"""
Populate MongoDB with extensive dummy data.
Run from the backend/ directory:
    python populate_db_simple.py
Requires: pymongo, passlib, bcrypt
    pip install pymongo passlib bcrypt
"""

from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
from passlib.context import CryptContext
import random
import time

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "yelp_prototype"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def h(password: str) -> str:
    return pwd_context.hash(password)

def ts(days_ago=0):
    return datetime.utcnow() - timedelta(days=days_ago)

# ---------------------------------------------------------------------------
# Raw data
# ---------------------------------------------------------------------------

USERS = [
    {"name": "Alice Johnson",  "email": "alice@example.com",  "password": "password123", "city": "San Jose",    "gender": "Female", "photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"},
    {"name": "Bob Smith",      "email": "bob@example.com",    "password": "password123", "city": "Milpitas",    "gender": "Male",   "photo": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"},
    {"name": "Carol Williams", "email": "carol@example.com",  "password": "password123", "city": "Fremont",     "gender": "Female", "photo": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"},
    {"name": "David Brown",    "email": "david@example.com",  "password": "password123", "city": "Santa Clara", "gender": "Male",   "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"},
    {"name": "Eva Martinez",   "email": "eva@example.com",    "password": "password123", "city": "Sunnyvale",   "gender": "Female", "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"},
    {"name": "Frank Lee",      "email": "frank@example.com",  "password": "password123", "city": "San Jose",    "gender": "Male",   "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"},
    {"name": "Grace Kim",      "email": "grace@example.com",  "password": "password123", "city": "Cupertino",   "gender": "Female", "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"},
    {"name": "Henry Patel",    "email": "henry@example.com",  "password": "password123", "city": "Newark",      "gender": "Male",   "photo": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200"},
    {"name": "Iris Chen",      "email": "iris@example.com",   "password": "password123", "city": "Milpitas",    "gender": "Female", "photo": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200"},
    {"name": "James Wilson",   "email": "james@example.com",  "password": "password123", "city": "San Jose",    "gender": "Male",   "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200"},
]

OWNERS = [
    {"name": "Maria Garcia", "email": "maria@owners.com", "password": "password123", "restaurant_location": "San Jose",    "photo": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200"},
    {"name": "Tony Nguyen",  "email": "tony@owners.com",  "password": "password123", "restaurant_location": "Milpitas",    "photo": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200"},
    {"name": "Linda Park",   "email": "linda@owners.com", "password": "password123", "restaurant_location": "Fremont",     "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200"},
    {"name": "Sam Patel",    "email": "sam@owners.com",   "password": "password123", "restaurant_location": "Santa Clara", "photo": "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200"},
    {"name": "Wei Zhang",    "email": "wei@owners.com",   "password": "password123", "restaurant_location": "Sunnyvale",   "photo": "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200"},
    {"name": "Rosa Flores",  "email": "rosa@owners.com",  "password": "password123", "restaurant_location": "San Jose",    "photo": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200"},
]

# Unsplash food photos (stable, free, no key required)
PHOTOS = {
    "Indian":     "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    "Chinese":    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
    "Italian":    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    "Mexican":    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
    "Japanese":   "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
    "American":   "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    "Thai":       "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
    "Greek":      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    "Vietnamese": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800",
    "Korean":     "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800",
    "French":     "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    "BBQ":        "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800",
    "Seafood":    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800",
    "Pizza":      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    "Burger":     "https://images.unsplash.com/photo-1550317138-10000687a72b?w=800",
}

RESTAURANTS = [
    # San Jose
    {"name": "Spice Palace",         "cuisine_type": "Indian",     "address": "123 Main St",        "city": "San Jose",    "state": "CA", "zip": "95110", "description": "Authentic Indian cuisine with traditional recipes and fragrant spices", "phone": "408-555-0001", "price_tier": 2, "hours": "Mon-Sun 11am-10pm", "amenities": "Takeout, Dine-in, Delivery"},
    {"name": "Dragon Garden",        "cuisine_type": "Chinese",    "address": "456 Oak Ave",         "city": "San Jose",    "state": "CA", "zip": "95112", "description": "Best dumplings in town, dim sum on weekends", "phone": "408-555-0002", "price_tier": 2, "hours": "Mon-Sun 10am-9pm",  "amenities": "Dine-in, Takeout"},
    {"name": "Taco Fiesta",          "cuisine_type": "Mexican",    "address": "321 Elm St",          "city": "San Jose",    "state": "CA", "zip": "95113", "description": "Street tacos, burritos, and margaritas in a lively atmosphere", "phone": "408-555-0004", "price_tier": 1, "hours": "Mon-Sun 10am-11pm", "amenities": "Takeout, Dine-in, Bar"},
    {"name": "Golden Pho",           "cuisine_type": "Vietnamese", "address": "789 Story Rd",        "city": "San Jose",    "state": "CA", "zip": "95122", "description": "Hearty pho, banh mi, and Vietnamese coffee in a cozy setting", "phone": "408-555-0010", "price_tier": 1, "hours": "Mon-Sun 8am-9pm",   "amenities": "Takeout, Dine-in"},
    {"name": "Seoul Kitchen",        "cuisine_type": "Korean",     "address": "234 Tully Rd",        "city": "San Jose",    "state": "CA", "zip": "95111", "description": "Korean BBQ and stews with banchan sides", "phone": "408-555-0011", "price_tier": 2, "hours": "Tue-Sun 12pm-10pm", "amenities": "Dine-in, Reservations"},
    {"name": "The Burger Spot",      "cuisine_type": "Burger",     "address": "567 Blossom Hill Rd", "city": "San Jose",    "state": "CA", "zip": "95123", "description": "Craft burgers with locally sourced ingredients and homemade sauces", "phone": "408-555-0012", "price_tier": 1, "hours": "Mon-Sun 11am-10pm", "amenities": "Takeout, Dine-in, Drive-through"},
    {"name": "Casa Italiana",        "cuisine_type": "Italian",    "address": "890 Almaden Blvd",    "city": "San Jose",    "state": "CA", "zip": "95120", "description": "Family-style Italian with house-made pasta and wood-fired pizza", "phone": "408-555-0013", "price_tier": 3, "hours": "Wed-Mon 5pm-10pm",  "amenities": "Dine-in, Reservations, Wine Bar"},
    {"name": "Smokey's BBQ",         "cuisine_type": "BBQ",        "address": "111 Guadalupe Pkwy",  "city": "San Jose",    "state": "CA", "zip": "95110", "description": "Slow-smoked ribs, brisket, and pulled pork with house rubs", "phone": "408-555-0014", "price_tier": 2, "hours": "Wed-Sun 11am-9pm",  "amenities": "Takeout, Dine-in, Catering"},
    # Milpitas
    {"name": "Bella Italia",         "cuisine_type": "Italian",    "address": "789 Pine Rd",         "city": "Milpitas",    "state": "CA", "zip": "95035", "description": "Traditional Italian pasta, risotto, and wine", "phone": "408-555-0003", "price_tier": 3, "hours": "Tue-Sun 5pm-10pm",  "amenities": "Dine-in, Reservations, Wine List"},
    {"name": "Sakura Sushi",         "cuisine_type": "Japanese",   "address": "654 Maple Ln",        "city": "Milpitas",    "state": "CA", "zip": "95035", "description": "Fresh sushi, sashimi, and ramen made by a master chef", "phone": "408-555-0005", "price_tier": 3, "hours": "Mon-Sun 11am-9:30pm", "amenities": "Dine-in, Takeout, Sake Bar"},
    {"name": "Thai Orchid",          "cuisine_type": "Thai",       "address": "432 Dixon Landing Rd","city": "Milpitas",    "state": "CA", "zip": "95035", "description": "Fragrant curries and pad thai with authentic Bangkok flavors", "phone": "408-555-0015", "price_tier": 2, "hours": "Mon-Sun 11am-9pm",  "amenities": "Takeout, Dine-in, Delivery"},
    {"name": "Pizza Paradiso",       "cuisine_type": "Pizza",      "address": "876 Calaveras Blvd",  "city": "Milpitas",    "state": "CA", "zip": "95035", "description": "Neapolitan-style pizza baked in a wood-burning oven", "phone": "408-555-0016", "price_tier": 2, "hours": "Mon-Sun 11am-10pm", "amenities": "Dine-in, Takeout, Beer & Wine"},
    # Fremont
    {"name": "Athen's Grille",       "cuisine_type": "Greek",      "address": "345 Fremont Blvd",    "city": "Fremont",     "state": "CA", "zip": "94538", "description": "Classic Greek mezze, souvlaki, and fresh seafood", "phone": "510-555-0001", "price_tier": 2, "hours": "Mon-Sun 11am-9pm",  "amenities": "Dine-in, Outdoor Seating"},
    {"name": "Peking Duck House",    "cuisine_type": "Chinese",    "address": "678 Mowry Ave",       "city": "Fremont",     "state": "CA", "zip": "94536", "description": "Specialty Peking duck with 24-hour preparation and crispy skin", "phone": "510-555-0002", "price_tier": 3, "hours": "Tue-Sun 11:30am-9pm", "amenities": "Dine-in, Reservations"},
    {"name": "Le Petit Bistro",      "cuisine_type": "French",     "address": "901 Stevenson Blvd",  "city": "Fremont",     "state": "CA", "zip": "94538", "description": "Romantic French bistro with steak frites and crème brûlée", "phone": "510-555-0003", "price_tier": 4, "hours": "Wed-Sun 5:30pm-10pm", "amenities": "Dine-in, Reservations, Wine List"},
    # Santa Clara
    {"name": "Tandoor Express",      "cuisine_type": "Indian",     "address": "200 El Camino Real",  "city": "Santa Clara", "state": "CA", "zip": "95050", "description": "Quick-service Indian with fresh naan, curries, and lassi", "phone": "408-555-0020", "price_tier": 1, "hours": "Mon-Sun 11am-9pm",  "amenities": "Takeout, Delivery, Catering"},
    {"name": "Harbor Catch",         "cuisine_type": "Seafood",    "address": "450 Lawrence Expy",   "city": "Santa Clara", "state": "CA", "zip": "95051", "description": "Market-fresh seafood including clam chowder and Dungeness crab", "phone": "408-555-0021", "price_tier": 3, "hours": "Mon-Sun 12pm-9pm",  "amenities": "Dine-in, Reservations, Happy Hour"},
    # Sunnyvale
    {"name": "All-American Diner",   "cuisine_type": "American",   "address": "765 Mathilda Ave",    "city": "Sunnyvale",   "state": "CA", "zip": "94085", "description": "Classic American diner with all-day breakfast and mile-high pies", "phone": "408-555-0030", "price_tier": 1, "hours": "Mon-Sun 7am-10pm",  "amenities": "Takeout, Dine-in, Breakfast All Day"},
    {"name": "Tokyo Ramen Bar",      "cuisine_type": "Japanese",   "address": "321 Murphy Ave",      "city": "Sunnyvale",   "state": "CA", "zip": "94086", "description": "Rich tonkotsu and miso ramen with hand-made noodles", "phone": "408-555-0031", "price_tier": 2, "hours": "Mon-Sun 11am-10pm", "amenities": "Dine-in, Takeout"},
    {"name": "Curry Leaf",           "cuisine_type": "Indian",     "address": "543 Evelyn Ave",      "city": "Sunnyvale",   "state": "CA", "zip": "94086", "description": "South Indian specialties: dosa, idli, and coconut curries", "phone": "408-555-0032", "price_tier": 2, "hours": "Tue-Sun 11am-9:30pm", "amenities": "Dine-in, Takeout, Vegetarian Friendly"},
]

REVIEW_TEMPLATES = [
    (5, "Absolutely incredible!", "One of the best meals I've had in the Bay Area. Every dish was perfectly seasoned and the service was attentive throughout."),
    (5, "A hidden gem",           "Stumbled upon this place by accident and I'm so glad I did. The freshness of the ingredients really comes through."),
    (4, "Really good, will return","Food was excellent and portions generous. Service was a bit slow on a Friday night but understandable."),
    (4, "Great flavors",          "The flavors here are authentic and bold. Loved the ambiance too. Knocked off one star only for parking."),
    (4, "Solid choice",           "Consistent quality every visit. Nothing over the top but reliably good — exactly what you want in a neighborhood spot."),
    (3, "Decent but pricey",      "Food was good but the price point felt a little high for what you get. Would come back for happy hour specials."),
    (3, "Hit and miss",           "Some dishes were outstanding and others fell flat. Worth trying but manage your expectations."),
    (3, "Average experience",     "Nothing remarkable but nothing bad either. Service was friendly. Probably won't go out of my way to return."),
    (2, "Disappointed",           "Had high expectations based on the reviews but the food came out lukewarm and the wait was over 40 minutes."),
    (2, "Not what I expected",    "The menu descriptions sounded amazing but execution was lacking. Maybe it was just a bad night."),
    (1, "Terrible experience",    "Wrong order, rude staff, and food that tasted nothing like the menu described. Won't be back."),
    (5, "Must-visit",             "Drove 30 minutes for this place and it was completely worth it. The signature dish alone is reason enough to come."),
    (4, "Great date night spot",  "Brought my partner here for an anniversary dinner and we were not disappointed. Cozy atmosphere and delicious food."),
    (3, "Good for groups",        "Came here with 8 friends and they handled it well. Food is consistent if not exciting. Good value for groups."),
    (5, "Best in the city",       "Hands down the best version of this cuisine in the South Bay. Locals know, tourists should find out."),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def clear_collections(db):
    cols = ["users", "owners", "restaurants", "reviews", "favorites", "owner_restaurants"]
    for col in cols:
        count = db[col].count_documents({})
        db[col].delete_many({})
        log(f"  Cleared {count} docs from {col}")

# ---------------------------------------------------------------------------
# Seeders
# ---------------------------------------------------------------------------

def seed_users(db):
    log("\n👤 Seeding users...")
    docs = []
    for u in USERS:
        docs.append({
            "_id": ObjectId(),
            "name": u["name"],
            "email": u["email"],
            "password_hash": h(u["password"]),
            "city": u["city"],
            "gender": u["gender"],
            "profile_photo": u["photo"],
            "about_me": f"Hi, I'm {u['name'].split()[0]}! I love exploring restaurants.",
            "languages": "English",
            "created_at": ts(random.randint(30, 180)),
            "updated_at": ts(random.randint(0, 29)),
        })
    db.users.insert_many(docs)
    log(f"  ✅ Created {len(docs)} users")
    return docs

def seed_owners(db):
    log("\n👔 Seeding owners...")
    docs = []
    for o in OWNERS:
        docs.append({
            "_id": ObjectId(),
            "name": o["name"],
            "email": o["email"],
            "password_hash": h(o["password"]),
            "restaurant_location": o["restaurant_location"],
            "profile_photo": o["photo"],
            "created_at": ts(random.randint(30, 180)),
            "updated_at": ts(random.randint(0, 29)),
        })
    db.owners.insert_many(docs)
    log(f"  ✅ Created {len(docs)} owners")
    return docs

def seed_restaurants(db, owners):
    log("\n🍽️  Seeding restaurants...")
    docs = []
    owner_cycle = owners * 10  # cycle through owners
    for i, r in enumerate(RESTAURANTS):
        owner = owner_cycle[i % len(owners)]
        cuisine = r["cuisine_type"]
        photo_url = PHOTOS.get(cuisine, PHOTOS["American"])
        docs.append({
            "_id": ObjectId(),
            "name": r["name"],
            "cuisine_type": cuisine,
            "address": r["address"],
            "city": r["city"],
            "state": r["state"],
            "zip": r["zip"],
            "country": "USA",
            "description": r["description"],
            "phone": r["phone"],
            "price_tier": r["price_tier"],
            "hours": r.get("hours", "Mon-Sun 11am-9pm"),
            "amenities": r.get("amenities", "Dine-in, Takeout"),
            "photos": [photo_url],
            "listed_by_user_id": owner["_id"],
            "created_at": ts(random.randint(10, 120)),
            "updated_at": ts(random.randint(0, 9)),
        })
    db.restaurants.insert_many(docs)
    log(f"  ✅ Created {len(docs)} restaurants")
    return docs

def seed_owner_claims(db, owners, restaurants):
    log("\n🏷️  Seeding owner claims...")
    docs = []
    # Each owner claims 3-4 restaurants in their city
    for i, owner in enumerate(owners):
        city = OWNERS[i]["restaurant_location"]
        city_restaurants = [r for r in restaurants if r["city"] == city]
        # Fall back to any if city has none
        pool = city_restaurants if city_restaurants else restaurants
        count = min(len(pool), random.randint(2, 4))
        chosen = random.sample(pool, count)
        for r in chosen:
            # Avoid duplicate claims
            if not db.owner_restaurants.find_one({"restaurant_id": r["_id"]}):
                docs.append({
                    "_id": ObjectId(),
                    "owner_id": owner["_id"],
                    "restaurant_id": r["_id"],
                    "created_at": ts(random.randint(5, 60)),
                })
    if docs:
        db.owner_restaurants.insert_many(docs)
    log(f"  ✅ Created {len(docs)} owner claims")

def seed_reviews(db, users, restaurants):
    log("\n⭐ Seeding reviews...")
    docs = []
    seen = set()  # (user_id, restaurant_id) — unique constraint
    for restaurant in restaurants:
        # Each restaurant gets 2-6 reviews
        num_reviews = random.randint(2, 6)
        reviewers = random.sample(users, min(num_reviews, len(users)))
        for user in reviewers:
            key = (str(user["_id"]), str(restaurant["_id"]))
            if key in seen:
                continue
            seen.add(key)
            tpl = random.choice(REVIEW_TEMPLATES)
            days_ago = random.randint(1, 90)
            docs.append({
                "_id": ObjectId(),
                "restaurant_id": restaurant["_id"],
                "user_id": user["_id"],
                "rating": tpl[0],
                "comment": f"{tpl[1]} — {tpl[2]}",
                "created_at": ts(days_ago),
                "updated_at": ts(days_ago),
            })
    db.reviews.insert_many(docs)
    log(f"  ✅ Created {len(docs)} reviews")

def seed_favorites(db, users, restaurants):
    log("\n❤️  Seeding favorites...")
    docs = []
    seen = set()
    for user in users:
        # Each user favorites 2-5 restaurants
        num = random.randint(2, 5)
        chosen = random.sample(restaurants, min(num, len(restaurants)))
        for r in chosen:
            key = (str(user["_id"]), str(r["_id"]))
            if key in seen:
                continue
            seen.add(key)
            docs.append({
                "_id": ObjectId(),
                "user_id": user["_id"],
                "restaurant_id": r["_id"],
                "created_at": ts(random.randint(1, 60)),
            })
    db.favorites.insert_many(docs)
    log(f"  ✅ Created {len(docs)} favorites")

def seed_preferences(db, users):
    log("\n⚙️  Seeding preferences...")
    cuisine_pool = list(PHOTOS.keys())
    docs = []
    for user in users:
        cuisines = random.sample(cuisine_pool, 3)
        price_min = random.choice([1, 2])
        price_max = random.choice([3, 4])
        docs.append({
            "_id": ObjectId(),
            "user_id": user["_id"],
            "cuisines": ", ".join(cuisines),
            "price_min": price_min,
            "price_max": price_max,
            "preferred_locations": user["city"],
            "search_radius": random.choice([5, 10, 15, 25]),
            "dietary_needs": random.choice(["None", "Vegetarian", "Gluten-free", "Halal", "Vegan"]),
            "ambiance": random.choice(["Casual", "Fine Dining", "Family-friendly", "Romantic", "Lively"]),
            "sort_preference": random.choice(["rating", "distance", "newest"]),
            "created_at": ts(random.randint(1, 30)),
            "updated_at": ts(0),
        })
    db.preferences.insert_many(docs)
    log(f"  ✅ Created {len(docs)} preference profiles")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("🚀 Populating MongoDB with extensive dummy data")
    print("=" * 60)

    for attempt in range(30):
        try:
            client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
            db = client[DB_NAME]
            db.restaurants.count_documents({})
            log("✅ Connected to MongoDB")
            break
        except Exception as e:
            if attempt < 29:
                log(f"⏳ Waiting for MongoDB... ({attempt + 1}/30)")
                time.sleep(1)
            else:
                log(f"❌ Could not connect: {e}")
                return

    log("\n🗑️  Clearing existing data...")
    clear_collections(db)

    users       = seed_users(db)
    owners      = seed_owners(db)
    restaurants = seed_restaurants(db, owners)
    seed_owner_claims(db, owners, restaurants)
    seed_reviews(db, users, restaurants)
    seed_favorites(db, users, restaurants)
    seed_preferences(db, users)

    print("\n" + "=" * 60)
    print("✅ Done!")
    print("=" * 60)
    print(f"  Users:       {len(users)}")
    print(f"  Owners:      {len(owners)}")
    print(f"  Restaurants: {len(restaurants)}")
    print("\nLogin credentials (all passwords: password123)")
    print("  Users:  alice@example.com, bob@example.com, carol@example.com ...")
    print("  Owners: maria@owners.com, tony@owners.com, linda@owners.com ...")
    print("\nOpen the app at: http://localhost:5173")

if __name__ == "__main__":
    main()

"""
Run this script to populate your MySQL database with test data.
Place it in your backend/ directory and run: python seed_database.py
"""

import sys
from datetime import datetime
from sqlalchemy.orm import Session

# Import your models and database
sys.path.insert(0, '.')
from app.database import SessionLocal, engine
from app.models import User, Owner, Restaurant, Review, Favorite, UserPreference, RestaurantPhoto, OwnerRestaurant
from app.security import hash_password

# Create tables if they don't exist
from app.models import Base
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    try:
        # Clear existing data (optional - comment out if you want to keep old data)
        print("Clearing existing data...")
        db.query(OwnerRestaurant).delete()
        db.query(Review).delete()
        db.query(Favorite).delete()
        db.query(RestaurantPhoto).delete()
        db.query(UserPreference).delete()
        db.query(Restaurant).delete()
        db.query(Owner).delete()
        db.query(User).delete()
        db.commit()
        print("✓ Cleared existing data")
        
        # ===== CREATE TEST USERS =====
        users = [
            User(
                name="Alice Chen",
                email="alice@example.com",
                password_hash=hash_password("password123"),
                phone="+1-415-555-0101",
                city="San Francisco",
                state="CA",
                country="USA",
                about_me="Food enthusiast and travel blogger",
                languages="English, Mandarin",
                gender="Female",
                profile_photo="alice.jpg"
            ),
            User(
                name="Bob Smith",
                email="bob@example.com",
                password_hash=hash_password("password123"),
                phone="+1-408-555-0102",
                city="San Jose",
                state="CA",
                country="USA",
                about_me="Love trying new cuisines",
                languages="English",
                gender="Male",
                profile_photo="bob.jpg"
            ),
            User(
                name="Carol Martinez",
                email="carol@example.com",
                password_hash=hash_password("password123"),
                phone="+1-650-555-0103",
                city="Palo Alto",
                state="CA",
                country="USA",
                about_me="Vegetarian, always looking for healthy options",
                languages="English, Spanish",
                gender="Female",
                profile_photo="carol.jpg"
            ),
            User(
                name="David Lee",
                email="david@example.com",
                password_hash=hash_password("password123"),
                phone="+1-510-555-0104",
                city="Oakland",
                state="CA",
                country="USA",
                about_me="Foodie and photography enthusiast",
                languages="English, Korean",
                gender="Male",
                profile_photo="david.jpg"
            ),
        ]
        db.add_all(users)
        db.commit()
        print(f"✓ Created {len(users)} test users")
        
        # ===== CREATE TEST OWNERS =====
        owners = [
            Owner(
                name="Marco Rossi",
                email="marco@restaurant.com",
                password_hash=hash_password("ownerpass123"),
                restaurant_location="San Francisco, CA"
            ),
            Owner(
                name="Priya Patel",
                email="priya@restaurant.com",
                password_hash=hash_password("ownerpass123"),
                restaurant_location="San Jose, CA"
            ),
            Owner(
                name="James Wong",
                email="james@restaurant.com",
                password_hash=hash_password("ownerpass123"),
                restaurant_location="Mountain View, CA"
            ),
        ]
        db.add_all(owners)
        db.commit()
        print(f"✓ Created {len(owners)} test owners")
        
        # ===== CREATE TEST RESTAURANTS =====
        restaurants = [
            Restaurant(
                name="The Golden Spoon",
                cuisine_type="Mediterranean",
                address="123 Market Street",
                city="San Francisco",
                state="CA",
                zip="94105",
                country="USA",
                description="Authentic Mediterranean cuisine with fresh ingredients",
                phone="+1-415-555-0201",
                price_tier=3,
                hours="11:00 AM - 10:00 PM",
                amenities="WiFi, Outdoor Seating, Vegan Options"
            ),
            Restaurant(
                name="Dragon Palace",
                cuisine_type="Chinese",
                address="456 Main Street",
                city="San Jose",
                state="CA",
                zip="95112",
                country="USA",
                description="Traditional Sichuan and Cantonese dishes",
                phone="+1-408-555-0202",
                price_tier=2,
                hours="11:30 AM - 11:00 PM",
                amenities="Delivery, Takeout, Family Style Dining"
            ),
            Restaurant(
                name="Trattoria Roma",
                cuisine_type="Italian",
                address="789 Park Avenue",
                city="Palo Alto",
                state="CA",
                zip="94301",
                country="USA",
                description="Cozy Italian trattoria with homemade pasta",
                phone="+1-650-555-0203",
                price_tier=3,
                hours="5:00 PM - 11:00 PM",
                amenities="Wine Selection, Private Dining, Reservations Required"
            ),
            Restaurant(
                name="Sakura Sushi",
                cuisine_type="Japanese",
                address="321 Oak Street",
                city="Oakland",
                state="CA",
                zip="94607",
                country="USA",
                description="Fresh sushi and authentic Japanese ramen",
                phone="+1-510-555-0204",
                price_tier=2,
                hours="12:00 PM - 10:00 PM",
                amenities="Omakase Available, Happy Hour, Sake Selection"
            ),
            Restaurant(
                name="El Mariachi",
                cuisine_type="Mexican",
                address="555 Mission Street",
                city="San Francisco",
                state="CA",
                zip="94103",
                country="USA",
                description="Authentic Mexican street food and cocktails",
                phone="+1-415-555-0205",
                price_tier=1,
                hours="10:00 AM - 11:00 PM",
                amenities="Outdoor Seating, Margarita Bar, Family Friendly"
            ),
            Restaurant(
                name="The Burger Joint",
                cuisine_type="American",
                address="222 California Street",
                city="San Jose",
                state="CA",
                zip="95110",
                country="USA",
                description="Gourmet burgers with craft beer selection",
                phone="+1-408-555-0206",
                price_tier=2,
                hours="11:00 AM - 10:00 PM",
                amenities="Beer Garden, Patio, Live Music Weekends"
            ),
        ]
        db.add_all(restaurants)
        db.commit()
        print(f"✓ Created {len(restaurants)} test restaurants")
        
        # ===== CREATE TEST REVIEWS =====
        reviews_data = [
            (users[0].id, restaurants[0].id, 5, "Amazing food! The pasta was perfectly cooked."),
            (users[1].id, restaurants[0].id, 4, "Great atmosphere, friendly staff."),
            (users[2].id, restaurants[1].id, 5, "Best Chinese food I've had in San Jose!"),
            (users[3].id, restaurants[1].id, 4, "Good flavors but a bit too spicy for me."),
            (users[0].id, restaurants[2].id, 5, "Felt like I was dining in Rome. Absolutely loved it."),
            (users[1].id, restaurants[3].id, 5, "Fresh fish, expert preparation. Worth every penny."),
            (users[2].id, restaurants[3].id, 4, "Good ramen but the wait was long."),
            (users[3].id, restaurants[4].id, 4, "Authentic Mexican vibes, delicious tacos."),
            (users[0].id, restaurants[5].id, 5, "Best burger in town! Will definitely come back."),
            (users[1].id, restaurants[5].id, 3, "Burgers are good but overpriced."),
        ]
        
        reviews = []
        for user_id, restaurant_id, rating, comment in reviews_data:
            review = Review(
                user_id=user_id,
                restaurant_id=restaurant_id,
                rating=rating,
                comment=comment,
                photo_url=None
            )
            reviews.append(review)
        
        db.add_all(reviews)
        db.commit()
        print(f"✓ Created {len(reviews)} test reviews")
        
        # ===== CREATE TEST FAVORITES =====
        favorites_data = [
            (users[0].id, restaurants[0].id),
            (users[0].id, restaurants[2].id),
            (users[1].id, restaurants[1].id),
            (users[1].id, restaurants[5].id),
            (users[2].id, restaurants[0].id),
            (users[2].id, restaurants[3].id),
            (users[3].id, restaurants[1].id),
            (users[3].id, restaurants[4].id),
        ]
        
        favorites = []
        for user_id, restaurant_id in favorites_data:
            favorite = Favorite(user_id=user_id, restaurant_id=restaurant_id)
            favorites.append(favorite)
        
        db.add_all(favorites)
        db.commit()
        print(f"✓ Created {len(favorites)} test favorites")
        
        # ===== CREATE TEST USER PREFERENCES =====
        preferences = [
            UserPreference(
                user_id=users[0].id,
                cuisines="Mediterranean, Italian, Asian",
                price_min=2,
                price_max=5,
                preferred_locations="San Francisco, Palo Alto",
                search_radius=10,
                dietary_needs="Vegetarian",
                ambiance="Fine Dining, Casual",
                sort_preference="rating"
            ),
            UserPreference(
                user_id=users[1].id,
                cuisines="Chinese, Japanese, Mexican",
                price_min=1,
                price_max=3,
                preferred_locations="San Jose, Oakland",
                search_radius=5,
                dietary_needs="None",
                ambiance="Casual, Family",
                sort_preference="distance"
            ),
            UserPreference(
                user_id=users[2].id,
                cuisines="Japanese, Mediterranean, American",
                price_min=2,
                price_max=4,
                preferred_locations="Palo Alto, Mountain View",
                search_radius=8,
                dietary_needs="Vegan",
                ambiance="Fine Dining, Modern",
                sort_preference="rating"
            ),
        ]
        db.add_all(preferences)
        db.commit()
        print(f"✓ Created {len(preferences)} user preferences")
        
        # ===== CREATE RESTAURANT PHOTOS =====
        photos = [
            # The Golden Spoon (Mediterranean)
            RestaurantPhoto(restaurant_id=restaurants[0].id, photo_url="https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[0].id, photo_url="https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[0].id, photo_url="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[0].id, photo_url="https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400"),
            
            # Dragon Palace (Chinese)
            RestaurantPhoto(restaurant_id=restaurants[1].id, photo_url="https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[1].id, photo_url="https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[1].id, photo_url="https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[1].id, photo_url="https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=400"),
            
            # Trattoria Roma (Italian)
            RestaurantPhoto(restaurant_id=restaurants[2].id, photo_url="https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[2].id, photo_url="https://images.pexels.com/photos/3186654/pexels-photo-3186654.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[2].id, photo_url="https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[2].id, photo_url="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=400"),
            
            # Sakura Sushi (Japanese)
            RestaurantPhoto(restaurant_id=restaurants[3].id, photo_url="https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[3].id, photo_url="https://images.pexels.com/photos/2399648/pexels-photo-2399648.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[3].id, photo_url="https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[3].id, photo_url="https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=400"),
            
            # El Mariachi (Mexican)
            RestaurantPhoto(restaurant_id=restaurants[4].id, photo_url="https://images.pexels.com/photos/5737456/pexels-photo-5737456.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[4].id, photo_url="https://images.pexels.com/photos/3202917/pexels-photo-3202917.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[4].id, photo_url="https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[4].id, photo_url="https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400"),
            
            # The Burger Joint (American)
            RestaurantPhoto(restaurant_id=restaurants[5].id, photo_url="https://images.pexels.com/photos/460195/pexels-photo-460195.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[5].id, photo_url="https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[5].id, photo_url="https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400"),
            RestaurantPhoto(restaurant_id=restaurants[5].id, photo_url="https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=400"),
        ]
        db.add_all(photos)
        db.commit()
        print(f"✓ Created {len(photos)} restaurant photos")
        
        # ===== LINK OWNERS TO RESTAURANTS =====
        owner_links = [
            OwnerRestaurant(owner_id=owners[0].id, restaurant_id=restaurants[0].id),
            OwnerRestaurant(owner_id=owners[0].id, restaurant_id=restaurants[4].id),
            OwnerRestaurant(owner_id=owners[1].id, restaurant_id=restaurants[1].id),
            OwnerRestaurant(owner_id=owners[1].id, restaurant_id=restaurants[5].id),
            OwnerRestaurant(owner_id=owners[2].id, restaurant_id=restaurants[2].id),
        ]
        db.add_all(owner_links)
        db.commit()
        print(f"✓ Linked owners to restaurants")
        
        print("\n" + "="*50)
        print("✅ Database seeded successfully!")
        print("="*50)
        print("\nTest Credentials:")
        print("-" * 50)
        for user in users:
            print(f"User: {user.email} / Password: password123")
        print("-" * 50)
        for owner in owners:
            print(f"Owner: {owner.email} / Password: ownerpass123")
        print("-" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
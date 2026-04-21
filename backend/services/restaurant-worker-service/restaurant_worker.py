import json
import os
from kafka import KafkaConsumer
from kafka.errors import KafkaError
import logging
from sqlalchemy import text

from database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka-service:9092")


def start_restaurant_worker():
    try:
        consumer = KafkaConsumer(
            'restaurant.created',
            bootstrap_servers=KAFKA_BROKER,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='restaurant-worker-group',
            auto_offset_reset='earliest',
            enable_auto_commit=True
        )

        logger.info("Restaurant Worker started, listening to restaurant.created...")

        for message in consumer:
            try:
                event = message.value
                if event.get('event_type') == 'restaurant.created':
                    handle_restaurant_created(event)
            except Exception as e:
                logger.error("Error processing message: %s", e)

    except KafkaError as e:
        logger.error("Kafka error in restaurant worker: %s", e)


def handle_restaurant_created(event):
    db = SessionLocal()
    try:
        # Use raw SQL to insert restaurant (avoids FK constraint issues)
        insert_query = text("""
            INSERT INTO restaurants (
                listed_by_user_id, name, cuisine_type, address, city, 
                state, zip, country, description, phone, price_tier, hours, amenities
            ) VALUES (
                :owner_id, :name, :cuisine_type, :address, :city,
                :state, :zip, :country, :description, :phone, :price_tier, :hours, :amenities
            )
        """)
        
        db.execute(insert_query, {
            'owner_id': event.get('owner_id'),
            'name': event.get('name'),
            'cuisine_type': event.get('cuisine_type'),
            'address': event.get('address'),
            'city': event.get('city'),
            'state': event.get('state'),
            'zip': event.get('zip'),
            'country': event.get('country'),
            'description': event.get('description'),
            'phone': event.get('phone'),
            'price_tier': event.get('price_tier'),
            'hours': event.get('hours'),
            'amenities': event.get('amenities'),
        })
        db.commit()

        # Insert photo if provided
        photo_url = event.get('photo_url')
        if photo_url:
            # Get the restaurant ID we just inserted
            result = db.execute(text("SELECT LAST_INSERT_ID()"))
            restaurant_id = result.scalar()
            
            photo_query = text("""
                INSERT INTO restaurant_photos (restaurant_id, photo_url)
                VALUES (:restaurant_id, :photo_url)
            """)
            db.execute(photo_query, {
                'restaurant_id': restaurant_id,
                'photo_url': photo_url
            })
            db.commit()
            logger.info("restaurant.created written to DB with photo: %s", event.get('name'))
        else:
            logger.info("restaurant.created written to DB: %s", event.get('name'))
            
    except Exception as e:
        db.rollback()
        logger.error("DB error on restaurant.created: %s", e)
    finally:
        db.close()


if __name__ == '__main__':
    start_restaurant_worker()
import json
import os
from kafka import KafkaConsumer
from kafka.errors import KafkaError
import logging
from datetime import datetime
from bson import ObjectId

from database import db

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
    try:
        # Use MongoDB to insert restaurant
        restaurant_doc = {
            "listed_by_user_id": ObjectId(event.get('owner_id')),
            "name": event.get('name'),
            "cuisine_type": event.get('cuisine_type'),
            "address": event.get('address'),
            "city": event.get('city'),
            "state": event.get('state'),
            "zip": event.get('zip'),
            "country": event.get('country'),
            "description": event.get('description'),
            "phone": event.get('phone'),
            "price_tier": event.get('price_tier'),
            "hours": event.get('hours'),
            "amenities": event.get('amenities'),
            "photos": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        result = db.restaurants.insert_one(restaurant_doc)
        restaurant_id = result.inserted_id

        # Insert photo if provided
        photo_url = event.get('photo_url')
        if photo_url:
            db.restaurants.update_one(
                {"_id": restaurant_id},
                {"$push": {"photos": photo_url}}
            )
            logger.info("restaurant.created written to DB with photo: %s", event.get('name'))
        else:
            logger.info("restaurant.created written to DB: %s", event.get('name'))
            
    except Exception as e:
        logger.error("DB error on restaurant.created: %s", e)


if __name__ == '__main__':
    start_restaurant_worker()
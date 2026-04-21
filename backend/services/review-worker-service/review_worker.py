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


def start_review_worker():
    try:
        consumer = KafkaConsumer(
            'review.created',
            'review.updated',
            'review.deleted',
            bootstrap_servers=KAFKA_BROKER,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='review-worker-group',
            auto_offset_reset='earliest',
            enable_auto_commit=True
        )

        logger.info("Review Worker started, listening to review events...")

        for message in consumer:
            try:
                event = message.value
                event_type = event.get('event_type')

                if event_type == 'review.created':
                    handle_review_created(event)
                elif event_type == 'review.updated':
                    handle_review_updated(event)
                elif event_type == 'review.deleted':
                    handle_review_deleted(event)

            except Exception as e:
                logger.error("Error processing message: %s", e)

    except KafkaError as e:
        logger.error("Kafka error in review worker: %s", e)


def handle_review_created(event):
    try:
        review_doc = {
            "user_id": ObjectId(event.get('user_id')),
            "restaurant_id": ObjectId(event.get('restaurant_id')),
            "rating": event.get('rating'),
            "comment": event.get('comment'),
            "photo_url": event.get('photo_url'),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        result = db.reviews.insert_one(review_doc)
        logger.info("review.created written to DB: user=%s restaurant=%s", 
                   event.get('user_id'), event.get('restaurant_id'))
    except Exception as e:
        logger.error("DB error on review.created: %s", e)


def handle_review_updated(event):
    try:
        update_doc = {}
        if event.get('rating') is not None:
            update_doc['rating'] = event.get('rating')
        if event.get('comment') is not None:
            update_doc['comment'] = event.get('comment')
        update_doc['updated_at'] = datetime.utcnow()
        
        db.reviews.update_one(
            {"_id": ObjectId(event.get('review_id'))},
            {"$set": update_doc}
        )
        logger.info("review.updated written to DB: review_id=%s", event.get('review_id'))
    except Exception as e:
        logger.error("DB error on review.updated: %s", e)


def handle_review_deleted(event):
    try:
        db.reviews.delete_one({"_id": ObjectId(event.get('review_id'))})
        logger.info("review.deleted written to DB: review_id=%s", event.get('review_id'))
    except Exception as e:
        logger.error("DB error on review.deleted: %s", e)


if __name__ == '__main__':
    start_review_worker()
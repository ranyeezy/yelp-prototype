import json
import os
from kafka import KafkaProducer
from kafka.errors import KafkaError

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka-service:9092")

producer = None

def get_producer():
    global producer
    if producer is None:
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BROKER,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                acks='all',
                retries=3
            )
        except Exception as e:
            print(f"Error connecting to Kafka: {e}")
            producer = None
    return producer

def publish_review_created(review_id, restaurant_id, user_id, rating, comment, photo_url=None):
    """Publish review.created event"""
    try:
        p = get_producer()
        if p:
            message = {
                "review_id": review_id,
                "restaurant_id": restaurant_id,
                "user_id": user_id,
                "rating": rating,
                "comment": comment,
                "photo_url": photo_url,
                "event_type": "review.created"
            }
            p.send('review.created', value=message)
            p.flush()
            print(f"Published review.created event: {review_id}")
    except KafkaError as e:
        print(f"Kafka error publishing review.created: {e}")

def publish_review_updated(review_id, restaurant_id, user_id, rating, comment):
    """Publish review.updated event"""
    try:
        p = get_producer()
        if p:
            message = {
                "review_id": review_id,
                "restaurant_id": restaurant_id,
                "user_id": user_id,
                "rating": rating,
                "comment": comment,
                "event_type": "review.updated"
            }
            p.send('review.updated', value=message)
            p.flush()
            print(f"Published review.updated event: {review_id}")
    except KafkaError as e:
        print(f"Kafka error publishing review.updated: {e}")

def publish_review_deleted(review_id):
    """Publish review.deleted event"""
    try:
        p = get_producer()
        if p:
            message = {
                "review_id": review_id,
                "event_type": "review.deleted"
            }
            p.send('review.deleted', value=message)
            p.flush()
            print(f"Published review.deleted event: {review_id}")
    except KafkaError as e:
        print(f"Kafka error publishing review.deleted: {e}")

def close_producer():
    """Close Kafka producer gracefully"""
    global producer
    if producer:
        producer.close()
        producer = None

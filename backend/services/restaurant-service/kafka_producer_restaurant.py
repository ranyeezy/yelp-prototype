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

def publish_restaurant_created(owner_id, name, cuisine_type, address, city,
                                state=None, zip=None, country=None, description=None,
                                phone=None, price_tier=None, hours=None,
                                amenities=None, photo_url=None):
    """Publish restaurant.created event"""
    try:
        p = get_producer()
        if p:
            message = {
                "owner_id": owner_id,
                "name": name,
                "cuisine_type": cuisine_type,
                "address": address,
                "city": city,
                "state": state,
                "zip": zip,
                "country": country,
                "description": description,
                "phone": phone,
                "price_tier": price_tier,
                "hours": hours,
                "amenities": amenities,
                "photo_url": photo_url,
                "event_type": "restaurant.created"
            }
            p.send('restaurant.created', value=message)
            p.flush()
            print(f"Published restaurant.created event for: {name}")
    except KafkaError as e:
        print(f"Kafka error publishing restaurant.created: {e}")

def publish_restaurant_updated(restaurant_id, name, cuisine_type, address, city):
    """Publish restaurant.updated event"""
    try:
        p = get_producer()
        if p:
            message = {
                "restaurant_id": restaurant_id,
                "name": name,
                "cuisine_type": cuisine_type,
                "address": address,
                "city": city,
                "event_type": "restaurant.updated"
            }
            p.send('restaurant.updated', value=message)
            p.flush()
            print(f"Published restaurant.updated event: {restaurant_id}")
    except KafkaError as e:
        print(f"Kafka error publishing restaurant.updated: {e}")

def close_producer():
    """Close Kafka producer gracefully"""
    global producer
    if producer:
        producer.close()
        producer = None

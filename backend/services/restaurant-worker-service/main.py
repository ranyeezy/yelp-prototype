import sys
import signal
import logging
from restaurant_worker import start_restaurant_worker

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def _handle_shutdown(signum, frame):
    logger.info("Restaurant Worker Service received signal %s, shutting down...", signum)
    sys.exit(0)

signal.signal(signal.SIGTERM, _handle_shutdown)
signal.signal(signal.SIGINT, _handle_shutdown)

if __name__ == '__main__':
    logger.info("Starting Restaurant Worker Service...")
    try:
        start_restaurant_worker()
    except SystemExit:
        raise
    except Exception as e:
        logger.error("Restaurant Worker Service error: %s", e)
        sys.exit(1)

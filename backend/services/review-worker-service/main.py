import sys
import signal
import logging
from review_worker import start_review_worker

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def _handle_shutdown(signum, frame):
    logger.info("Review Worker Service received signal %s, shutting down...", signum)
    sys.exit(0)

signal.signal(signal.SIGTERM, _handle_shutdown)
signal.signal(signal.SIGINT, _handle_shutdown)

if __name__ == '__main__':
    logger.info("Starting Review Worker Service...")
    try:
        start_review_worker()
    except SystemExit:
        raise
    except Exception as e:
        logger.error("Review Worker Service error: %s", e)
        sys.exit(1)

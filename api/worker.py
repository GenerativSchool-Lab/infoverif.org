"""RQ worker to process background jobs."""
import os
from rq import Connection, Worker

# Connect to Redis
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
conn = Connection(redis_url)

if __name__ == '__main__':
    worker = Worker(['default'], connection=conn)
    worker.work()


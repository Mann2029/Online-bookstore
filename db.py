import os
from mysql.connector import pooling


load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "bookstore")
DB_PORT = int(os.getenv("DB_PORT", 3306))

pool = pooling.MySQLConnectionPool(
    pool_name="bookstore_pool",
    pool_size=6,
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASS,
    database=DB_NAME,
    port=DB_PORT,
    charset="utf8mb4"
)

def get_conn():
    return pool.get_connection()

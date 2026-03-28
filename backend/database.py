import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(r"D:\gestion-contactos\gestion-contactos\.env")

def get_connection():
    url = os.getenv("DATABASE_URL")
    print("URL:", url)
    return psycopg2.connect(url)
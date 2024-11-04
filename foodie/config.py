# config.py
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_default_secret_key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DB_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    JWT_SECRET = os.getenv('JWT_SECRET')
    JWT_ALGORITHM = 'HS256'
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT= 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL= False
    MAIL_MAX_EMAILS= None
    MAIL_ASCII_ATTACHMENTS = False
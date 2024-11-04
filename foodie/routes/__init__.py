# routes/__init__.py
from flask import Blueprint

auth_bp = Blueprint('auth', __name__)
user_bp = Blueprint('user', __name__)

from . import auth, user

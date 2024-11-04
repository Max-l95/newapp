# routes/auth.py
from flask import request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from . import auth_bp
from models import Utente, Ruolo, Azienda
from app import db
import jwt
import os

# Function to generate mock user profile data
def generate_mock_user_profile(email):
    try:
        user = Utente.query.filter_by(email=email).first()
        if not user:
            return None  # Return None if user is not found

        ruolo = Ruolo.query.filter_by(id_ruolo=user.id_ruolo).first()
        azienda = Azienda.query.filter_by(id_azienda=user.id_azienda).first()

        return {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number,
            'email': user.email,
            'city': user.city,
            'cap': user.cap,
            'address': user.address,
            'provincia': user.provincia,
            'azienda': {
                "id": user.id_azienda,
                "denominazione": azienda.nome_azienda,
                "forma": azienda.forma_giuridica,
                "partitaIva": azienda.partita_iva,
                "codiceFiscale": azienda.codice_fiscale,
                "sede": azienda.sede_legale,
                "city": azienda.citta,
                "cap": azienda.cap,
                "provincia": azienda.provincia,
                "nome": azienda.nome,
                "cognome": azienda.cognome,
                "rFiscale": azienda.rfiscale,
                "res": azienda.res,
                "pos": azienda.pos,
                "logo": azienda.logo
            },
            'shop': user.shop,
            'ruolo': ruolo.nome_ruolo,
            'ade_user': azienda.ae_user,
            'ade_password': azienda.ae_password,
            "ade_pin": azienda.ae_pin,
            '_id': user.id
        }

    except Exception as e:
        print(f"Error generating user profile: {e}")
        return None
    finally:
        db.session.remove()  # Clean up the session


@auth_bp.route('/post-jwt-login', methods=['POST'])
def login():
    auth = request.json
    user = Utente.query.filter_by(email=auth.get('email')).first()
    
    if user and check_password_hash(user.password, auth.get('password')):
        token = jwt.encode(
            {'user': user.email, 'id_azienda': user.id_azienda},
            os.getenv('JWT_SECRET'),  # Ensure JWT_SECRET is fetched from environment variables
            algorithm='HS256'  # Ensure that you define the algorithm here
        )
        return jsonify({'token': token, 'data': generate_mock_user_profile(user.email)}), 200  # Add HTTP status code

    return jsonify({'message': 'Invalid credentials'}), 401

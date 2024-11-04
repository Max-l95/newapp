
import os

import pdfkit
import subprocess

from unicodedata import category
from urllib import response
from flask import Flask, request, jsonify, render_template, send_file, session, send_from_directory, make_response
from functools import wraps
import jwt, requests
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import date, datetime, timedelta
import pytz, json, hashlib
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from flask_migrate import Migrate
from doceasy import *
from sidae import *
import stripe
from flask_mail import Mail, Message
from sqlalchemy import text, func, extract, or_
from sqlalchemy.orm import joinedload
import MySQLdb
import tempfile
from collections import defaultdict
from apscheduler.schedulers.background import BackgroundScheduler
import pytz
from flask_caching import Cache
from fattura_elettronica_reader import (
    parse_xml_file,
    is_p7m_file_signed,
    remove_signature_from_p7m_file,
)

# Import the database and models
from models import db, Azienda,Aperture, Ruolo, Utente, Check, Shops, Reservation, Settings, Tables, Turns, Reparti, Categories, Schedules, Festivita, Products, Um, Articoli, Codiva, Comande, Varianti, Listino, Giacenze, Clienti, Fornitori, Ingredienti, Testmag, Movmag, Sezionali, Numerazioni, Pagamenti, Banche, Fatture
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'f9e483c7c690993b80b3976ef4723351237abf354be736b6f05050721861043e'  # Replace with your own secret key
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True, async_mode='eventlet')

# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Secret key for JWT token (should be kept secret and secure)
JWT_SECRET = os.getenv('JWT_SECRET')  # Replace with your actual JWT secret
JWT_ALGORITHM = 'HS256'
WKHTMLTOPDF_PATH = r'C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe'
# Download SSL certificate
cert_url = 'https://letsencrypt.org/certs/isrgrootx1.pem'
cert_path = '/tmp/isrgrootx1.pem'  # Use a temporary path to save the certificate

# Download the certificate if it doesn't already exist
if not os.path.exists(cert_path):
    response = requests.get(cert_url)
    with open(cert_path, 'wb') as cert_file:
        cert_file.write(response.content)


# Database configuration for MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DB_URI')  # Replace with your actual database URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_POOL_RECYCLE'] = 60

app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'connect_args': {
        'ssl': {
            'ca': cert_path  # Use the path of the downloaded certificate
        }
    }
}


# Initialize SQLAlchemy with app
db.init_app(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

scheduler = BackgroundScheduler()

def scheduled_task():
    with app.app_context():     
        invio_asincrono()

def invio_asincrono(): 
    aziende = Azienda.query.filter_by(sidae=True).all()
    try:
        for azienda in aziende:
            comande = Comande.query.filter(or_(Comande.numeroDoc == "", Comande.numeroDoc == None),Comande.status == 2).all()
            for comanda in comande:
                # Payment mapping from numeric value to string representation
                payment_mapping = {0 :"Non Pagato",  1: "CONTANTI", 2:"PAGAMENTO ELETTRONICO"}
                payment_string = payment_mapping.get(comanda.pagamento, "Unknown Payment Type")  # Default value if not found
                
                
                # Process scontrino data
                scontrino = {
                    "corpo": comanda.contenuto,
                    "total": comanda.totale,
                    "payment": payment_string,  # Use the string representation of payment
                    "idScontrino": comanda.idScontrino
                }

                # Send to appropriate function based on azienda's Sidae setting
                if azienda.sidae:
                    status_code, numero_documento = invio_reale(azienda, scontrino)
                    comanda.numeroDoc = numero_documento
                    db.session.commit()
                else:
                    status_code, numero_documento = invio_test(azienda, scontrino)
                
                if status_code != 200:
                    return jsonify({"error": "Failed to send data to the service", "details": numero_documento}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()



# Schedule the task for a specific time
scheduler.add_job(scheduled_task, 'cron', minute=0)  # Runs every day at 10:00 AM
scheduler.start()

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_MAX_EMAILS'] = None
app.config['MAIL_ASCII_ATTACHMENTS'] = False

# Initialize Flask-Mail
mail = Mail(app)

# Create all database tables and insert initial data
@app.after_request
def after_request(response):
    db.session.remove()
    return response

@app.teardown_appcontext
def shutdown_session(exception=None):
    """Cleanup database sessions after each request."""
    db.session.remove()


def kill_sleeping_connections():
    try:
        # Only select sleeping connections that have been idle for a while
        sleeping_connections = db.session.execute(
            text("SELECT id, TIME FROM information_schema.processlist WHERE command = 'Sleep' AND TIME > 300;")  # TIME > 300 seconds (5 minutes)
        ).fetchall()

        if len(sleeping_connections) > 10:
            print(f"Found {len(sleeping_connections)} long-idle connections, exceeding the limit.")

            for conn in sleeping_connections:
                try:
                    db.session.execute(text(f"KILL {conn[0]};"))
                    db.session.commit()
                    print(f"Killed sleeping connection: {conn[0]}")
                except MySQLdb.OperationalError as e:
                    if e.args[0] == 1094:
                        print(f"Thread {conn[0]} was already closed, ignoring.")
                    else:
                        raise
        else:
            print(f"Number of long-idle connections ({len(sleeping_connections)}) is within the limit.")

    except Exception as e:
        print(f"Failed to kill sleeping connections: {e}")
        db.session.rollback()

   

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
                "logo" : azienda.logo
            },
            'shop': user.shop,
            'ruolo': ruolo.nome_ruolo,
            'ade_user': azienda.ae_user,
            'ade_password': azienda.ae_password,
            "ade_pin": azienda.ae_pin,
            '_id': user.id
        }

    except Exception as e:
        db.session.rollback()  # Rollback on error
        print(f"Error generating user profile: {e}")
        return None

    finally:
        db.session.remove()  # Clean up the session


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):        
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(" ")[1]  # Remove "Bearer " prefix
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

def decode_token_and_get_azienda(token):
    try:
        # Decode the token to get the user email
        decoded_token = jwt.decode(token.split(" ")[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = decoded_token.get('user')
        
        if not email:
            return None, None
        
        # Retrieve the user based on the email
        user = Utente.query.filter_by(email=email).first()
        if not user:
            return None, None
        
        # Retrieve the associated azienda
        azienda = Azienda.query.filter_by(id_azienda=user.id_azienda).first()
        
        return user, azienda

    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None, None
    except jwt.InvalidTokenError:
        print("Invalid token")
        return None, None
    except Exception as e:
        db.session.rollback()  # Rollback on error
        print(f"Error decoding token and retrieving azienda: {e}")
        return None, None

    finally:
        db.session.remove()  # Clean up the session



@socketio.on('connect')
def handle_connect():
    token = request.args.get('token')
    if not token:
        print('No token provided')
        return False  # Reject the connection if no token is provided

    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        id_azienda = data.get('id_azienda')
        if not id_azienda:
            print('No id_azienda in token')
            return False
        join_room(id_azienda)
        print(f'Client connected and joined room {id_azienda}')

    except jwt.ExpiredSignatureError:
        print('Token expired')
        return False

    except jwt.InvalidTokenError:
        print('Invalid token')
        return False


@socketio.on('disconnect')
def handle_disconnect():
    token = request.args.get('token')
    if token:
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            id_azienda = data['id_azienda']
            leave_room(id_azienda)
            print(f'Client disconnected from room {id_azienda}')
        except jwt.InvalidTokenError:
            print('Invalid token during disconnect')

@socketio.on('update_tables')
def handle_update_tables(azienda):
    tables_data = fetch_table_data(azienda)
      # Assuming id_azienda is included in the data    
    if azienda:
        socketio.emit('tables_updated', {'data': tables_data}, room=azienda.id_azienda)
    else:
        print("No id_azienda provided in data")

@app.route('/')
def index():
    return "WebSocket server is running."

@socketio.on('message')
def handle_message(message):
    print(f"Received message: {message}")
    send(f"Echo: {message}")



@app.route('/post-jwt-login', methods=['POST'])
def login():
	auth = request.json
	user = Utente.query.filter_by(email=auth.get('email')).first()
	if user and check_password_hash(user.password, auth.get('password')):
		token = jwt.encode(
			{'user': user.email, 'id_azienda': user.id_azienda},
			JWT_SECRET,
			algorithm=JWT_ALGORITHM
		)
		return jsonify({'token': token, 'data': generate_mock_user_profile(user.email)})
	return jsonify({'message': 'Invalid credentials'}), 401


@app.route('/open/drawer', methods = ['GET'])
@token_required
def open_drawer():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    try:
        socketio.emit('open_drawer', room=azienda.id_azienda)
        return jsonify({"success": "Reservation added successfully"}), 201  # Return success response
    except Exception as e:
        db.session.rollback()  # Rollback the session in case of error
        return jsonify({'message': 'Error registering user', 'error': str(e)}), 500
    finally:
        db.session.remove()
    



@app.route('/post-jwt-register', methods=['POST'])
def register():
    data = request.json
    user = Utente.query.filter_by(email=data.get('email')).first()
    if not user and data.get('password') == data.get('confirm_password'):
        try:
            super_admin_password = generate_password_hash(data.get('email'))  # Replace with a secure method to generate a password
            super_admin = Utente(
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                phone_number=data.get('phone_number'),
                email=data.get('email'),
                password=super_admin_password,
                city=data.get('city'),
                address=data.get('address'),
                provincia=data.get('provincia'),
                cap=data.get('cap'),
                id_azienda=1,  # Link to 'Digital Business' azienda
                id_ruolo=1  # Assuming role ID 1 is for super admin
            )
            db.session.add(super_admin)
            db.session.commit()
            db.session.remove()
            return 'success'
        except Exception as e:
            db.session.rollback()  # Rollback the session in case of error
            return jsonify({'message': 'Error registering user', 'error': str(e)}), 500
        finally:
            db.session.remove()
    else:
        return jsonify({'message': 'Utente già registrato'}), 401

@app.route('/user/add', methods=['POST'])
def user_add():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    try:
        data = request.json
        user = Utente.query.filter_by(email=data.get('email')).first()
        if data.get('admin'):
            ruolo = 1 
        else:
            ruolo = 2
        if not user:        
            super_admin_password = generate_password_hash(data.get('first_name'))  # Replace with a secure method to generate a password
            super_admin = Utente(
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                phone_number=data.get('phone_number'),
                email=data.get('email'),
                password=super_admin_password,
                city=data.get('city'),
                address=data.get('address'),
                provincia=data.get('provincia'),
                cap=data.get('cap'),
                id_azienda=azienda.id_azienda,  # Link to 'Digital Business' azienda
                id_ruolo=ruolo,  # Assuming role ID 1 is for super admin
                shop=data.get('shop')
            )
            db.session.add(super_admin)
            db.session.commit()
            db.session.remove()
            return jsonify({"success": "Reservation added successfully"}), 201  # Return success response
    except Exception as e:
        db.session.rollback()  # Rollback the session in case of error
        return jsonify({'message': 'Error registering user', 'error': str(e)}), 500
    finally:
        db.session.remove()
   
   

@app.route('/user/profile', methods=['GET'])
@token_required
def get_user_profile():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    
    if email:
        # Generate user profile data based on email
        user_profile = generate_mock_user_profile(email)
        if user_profile:
            return jsonify({'user': user_profile, 'success': True, 'error': None})
        else:
            return jsonify({'message': 'User not found'}), 404
    else:
        return jsonify({'message': 'Invalid token'}), 401





@app.route('/password/change', methods=['POST'])
@token_required
def change_password():
    data = request.json
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not old_password or not new_password or not confirm_password:
        return jsonify({'message': 'Dati mancanti', "color": "danger"}), 400

    try:
        user = Utente.query.filter_by(email=data.get('email')).first()
        
        if not user:
            return jsonify({'message': 'Utente non trovato', "color": "danger"}), 404
        
        if not check_password_hash(user.password, old_password):
            return jsonify({'message': 'Vecchia password è incorretta', "color": "danger"}), 401

        if new_password != confirm_password:
            return jsonify({'message': 'Nuova passwords non corrisponde', "color": "danger"}), 400

        user.password = generate_password_hash(new_password)
        db.session.commit()
        db.session.remove()
        
        return jsonify({'message': 'Password modificata correttamente', "color": "success"})

    except Exception as e:
        db.session.rollback()  # Roll back the session if there's an error
        return jsonify({'message': 'Si è verificato un errore', 'error': str(e), "color": "danger"}), 500
    finally:
        db.session.remove()




@app.route('/post-jwt-profile', methods=['POST'])
@token_required
def update_user_profile():
    data = request.json
    
    token = request.headers.get('Authorization')
    decoded_token = jwt.decode(token.split(" ")[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    email = decoded_token['user']

    user = Utente.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Update user attributes
    user.email = data.get('email', user.email)
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.phone_number = data.get('phone_number', user.phone_number)
    user.city = data.get('city', user.city)
    user.address = data.get('address', user.address)
    user.cap = data.get('cap', user.cap)
    user.provincia = data.get('provincia', user.provincia)

    # Commit changes for user
    db.session.commit()

    # Fetch settings using user.id_azienda (still in the same session)
    setting = Settings.query.filter_by(id_azienda=user.id_azienda).first()
    if not setting:
        return jsonify({'message': 'Settings not found'}), 404

    # Update settings
    setting.password = data.get('email_password', setting.password)
    setting.importo = data.get('cauzione', setting.importo)

    # Commit changes for settings
    db.session.commit()  # Commit only once after all operations are done

    return jsonify({'message': 'Profilo aggiornato con successo', 'user': generate_mock_user_profile(email)})


    



    


@app.route('/azienda/update', methods=['POST'])
@token_required
def azienda_update():
    data = request.json
    token = request.headers.get('Authorization')
    decoded_token = jwt.decode(token.split(" ")[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    email = decoded_token['user']

    try:
        user = Utente.query.filter_by(email=email).first()
        azienda = Azienda.query.filter_by(id_azienda=user.id_azienda).first()
        
        if not azienda:
            return jsonify({'message': 'Azienda not found'}), 404

        azienda.nome_azienda = data.get('denominazione', azienda.nome_azienda)
        azienda.codice_fiscale = data.get('codice_fiscale', azienda.codice_fiscale)
        azienda.partita_iva = data.get('partita_iva', azienda.partita_iva)
        azienda.sede_legale = data.get('address', azienda.sede_legale)
        azienda.citta = data.get('city', azienda.citta)
        azienda.cap = data.get('cap', azienda.cap)
        azienda.provincia = data.get('provincia', azienda.provincia)
        azienda.phone = data.get('phone', azienda.phone)
        azienda.mail = data.get('mail', azienda.mail)
        azienda.ae_user = data.get('ade_user', azienda.ae_user)
        azienda.ae_password = data.get('ade_password', azienda.ae_password)
        azienda.ae_pin = data.get('ade_pin', azienda.ae_pin)
        

        db.session.commit()
        db.session.remove()
        
        return jsonify({'message': 'Dati Azienda aggiornati correttamente'})

    except Exception as e:
        db.session.rollback()  # Roll back the session if there's an error
        return jsonify({'message': 'Si è verificato un errore', 'error': str(e)}), 500
    finally:
        db.session.remove()



@app.route("/azienda/ade/update", methods = ['POST'])
def ade_update():
    data = request.json
    token = request.headers.get('Authorization')
    decoded_token = jwt.decode(token.split(" ")[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    email = decoded_token['user']
    try:
        user = Utente.query.filter_by(email=email).first()
        azienda = Azienda.query.filter_by(id_azienda=user.id_azienda).first()
        if not azienda:
            return jsonify({'message': 'Azienda not found'}), 404
        azienda.ae_user = data.get("ae_user")
        azienda.ae_password = data.get("ae_password")
        azienda.ae_pin = data.get("ae_pin")
        db.session.commit()

    except Exception as e:
        db.session.rollback()  # Roll back the session if there's an error
        return jsonify({'message': 'Si è verificato un errore', 'error': str(e)}), 500
    finally:
        db.session.remove()


@app.route('/api/hrm/records', methods=['GET'])
@token_required
def hrm_records():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    api_url = "https://api.us.crosschexcloud.com"
    api_key = "97a2e30b4271b47702fcb3d927e5d25c"
    api_secret = "2ed521bcbdfc8b697602175302e9b2f1"
    
    # Generate unique requestId and current timestamp
    request_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"  # Ensure the timestamp is in the correct format
    
    token_response = get_token(api_url, api_key, api_secret, request_id, timestamp)
    if 'payload' in token_response and 'token' in token_response['payload']:
        token = token_response['payload']['token']
        response = get_records(token, api_url, request_id, timestamp, start_date, end_date, page, limit)
        if response.status_code == 200:
            records = response.json().get('payload', {}).get('data', [])
            for record in records:
                check = Check(
                    uuid=record['uuid'],
                    checktype=record['checktype'],
                    checktime=datetime.fromisoformat(record['checktime'].replace('Z', '+00:00')),
                    device_serial_number=record['device']['serial_number'],
                    device_name=record['device']['name'],
                    employee_first_name=record['employee']['first_name'],
                    employee_last_name=record['employee']['last_name'],
                    employee_workno=record['employee']['workno'],
                    employee_department=record['employee']['department'],
                    employee_job_title=record['employee']['job_title']
                )
                db.session.add(check)
            db.session.commit()
            db.session.remove()
            return jsonify({"message": "Records successfully inserted"}), 200
        else:
            return jsonify({"error": "Request failed", "status_code": response.status_code, "response": response.text}), 400
    else:
        return jsonify(token_response), 400

@app.route('/shops', methods=['GET'])
@token_required
def get_shops():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Query the Shops based on the `id_azienda`
        shops = Shops.query.filter_by(id_azienda=azienda.id_azienda).all()

        # Create a list of dictionaries with all relevant fields from the Shops model
        shops_list = [{
            "id": shop.id,
            "description": shop.descrizione,
            "name": shop.name,
            "location_link": shop.location_link,
            "address": shop.address,
            "city": shop.city,
            "cap": shop.cap,
            "provincia": shop.provincia
        } for shop in shops]

        return jsonify({"data": shops_list}), 200

    except Exception as e:
        db.session.rollback()  # Rollback in case of any errors
        return jsonify({"error": "An error occurred while fetching shops", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session

@app.route('/users', methods=['GET'])
@token_required
def get_users():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Query the Utente based on the `id_azienda`
        users = Utente.query.filter_by(id_azienda=azienda.id_azienda).all()

        # Create a list of dictionaries with all relevant fields from the Utente model
        users_list = [{
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "city": user.city,
            "address": user.address,
            "provincia": user.provincia,
            "cap": user.cap,
            "id_azienda": user.id_azienda,
            "id_ruolo": user.id_ruolo,
            "ruolo": user.ruolo.nome_ruolo,  # Assuming 'nome_ruolo' is a field in the Ruolo model
            "shop": user.shop
        } for user in users]

        return jsonify({"data": users_list}), 200

    except Exception as e:
        db.session.rollback()  # Rollback in case of any errors
        return jsonify({"error": "An error occurred while fetching users", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session



@app.route('/reservations', methods=['GET'])
@token_required
def get_reservations():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Query all reservations for the given azienda
        reservations = Reservation.query.filter_by(id_azienda=azienda.id_azienda).all()

        # Dictionary to store fused reservations by reservation_col
        fused_reservations = defaultdict(lambda: {
            
            "customer": None,
            "date": None,
            "turn": None,
            "people": 0,  # Aggregate total people
            "reservations_count": 0,  # Count of reservations with the same reservation_col
            "tables": [],  # List of tables in the group
            "notes": [],  # Collect all notes
            "shops": set(),  # Collect shop info (assuming multiple shops)
        })

        # Fuse reservations by reservation_col
        for res in reservations:
            reservation_col = res.reservation_col  # Group by reservation_col

            fused = fused_reservations[reservation_col]
            if not fused["customer"]:  # Set customer once
                fused["customer"] = {
                    "id": res.customer.id,
                    "nome": res.customer.nome,
                    "cognome": res.customer.cognome,
                    "email": res.customer.email,
                    "telefono": res.customer.telefono
                }
            fused["date"] = res.date  # Set date
            fused["turn"] = res.turn  # Set turn
            fused["people"] += res.people  # Aggregate total people
            fused["reservations_count"] += 1  # Increment reservation count
            fused["tables"].append({
                "id": res.table_rel.id,
                "number": res.table_rel.number,
                "min_places": res.table_rel.min_places,
                "max_places": res.table_rel.max_places,
                "banco": res.table_rel.banco
            })
            if res.note:
                fused["notes"].append(res.note)  # Collect notes
            fused["shops"].add(res.shop_rel.name)  # Collect shop names

        # Convert defaultdict to a normal dict and format output
        reservations_list = []
        for reservation_col, fused_data in fused_reservations.items():
            reservation_record = {
                "reservation_col": reservation_col,
                "customer": fused_data["customer"],
                "date": fused_data["date"],
                "turn": fused_data["turn"],
                "people": fused_data["people"],
                "reservations_count": fused_data["reservations_count"],
                "tables": fused_data["tables"],
                "notes": fused_data["notes"],
                "shops": list(fused_data["shops"])  # Convert set to list for JSON response
            }
            reservations_list.append(reservation_record)

        return jsonify({"data": reservations_list}), 200

    except Exception as e:
        db.session.rollback()  # Rollback in case of any errors
        return jsonify({"error": "An error occurred while fetching reservations", "details": str(e)}), 500

@app.route('/reservations/filter', methods=['POST'])
@token_required
def filter_reservations_by_date():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    
    try:

        # Get the 'date' from the JSON payload (POST body)
        data = request.get_json()
        filter_date = data.get('date')
        shop = data.get('shop')
        table = data.get('table')

        if not filter_date:
            return jsonify({"error": "Date parameter is required"}), 400   

        # Initialize the base query
        query = Reservation.query.join(Shops).filter(Shops.id_azienda == azienda.id_azienda)

        # Add filters conditionally
        query = query.filter(Reservation.date == filter_date)

        if shop is not None:
            query = query.filter(Reservation.shop == shop)

        if table is not None:
            query = query.filter(Reservation.table == table)

        # Execute the query
        reservations = query.all()

        if not reservations:
            return jsonify({"data": [], "message": "No reservations found for the given date"}), 200

        # Create a list of dictionaries with all relevant fields, similar to the previous route
        reservations_list = []
        for res in reservations:
            reservation_data = {
                "id": res.id,
                "customer": {
                    "id": res.customer.id,
                    "nome": res.customer.nome,
                    "cognome": res.customer.cognome,
                    "email": res.customer.email,
                    "telefono": res.customer.telefono
                },
                "customer_payment": res.customer_payment,
                "date": res.date,
                "turn": res.turn,
                "people": res.people,
                "reservation_validated": res.reservation_validated,
                "charged": res.charged,
                "note": res.note,
                "payment_id": res.payment_id,
                "removed": res.removed,
                "locale": res.locale,
                "time": res.time,
                "table": {
                    "id": res.table_rel.id,
                    "number": res.table_rel.number,
                    "min_places": res.table_rel.min_places,
                    "max_places": res.table_rel.max_places,
                    "banco": res.table_rel.banco
                },
                "shop": {
                        "id": res.shop_rel.id,
                        "name": res.shop_rel.name,
                        "location_link": res.shop_rel.location_link,
                        "address": res.shop_rel.address,
                        "city": res.shop_rel.city,
                        "cap": res.shop_rel.cap,
                        "provincia": res.shop_rel.provincia
                    }           
            }
            reservations_list.append(reservation_data)

        return jsonify({"data": reservations_list}), 200
    except Exception as e:
        db.session.rollback()  # Rollback in case of any errors
        return jsonify({"error": "An error occurred while fetching reservations", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session






@app.route('/reservations/tables-and-turns', methods=['POST'])
@token_required
def get_tables_and_turns_with_reservations():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Get filters from the JSON payload (POST body)
        data = request.get_json()
        filter_date = data.get('date')  # Date to filter reservations
        shop = data.get('shop')           # Shop filter

        # Check if the filter_date is a holiday
        if filter_date:
            holiday_check = Festivita.query.filter(
                Festivita.id_azienda == azienda.id_azienda,
                Festivita.days.contains(filter_date)  # Check if filter_date is in the holiday days
            ).first()

            # If filter_date is a holiday, return no reservations
            if holiday_check:
                return jsonify({"data": []}), 200

        # Determine the day of the week from the filter_date
        if filter_date:
            date_object = datetime.strptime(filter_date, '%Y-%m-%d')  # Adjust format as needed
            day_of_week = date_object.strftime('%A').lower()  # Get the day in lowercase (e.g., 'monday')

        # Initialize the base query for tables
        tables = Tables.query.filter(Tables.id_azienda == azienda.id_azienda, Tables.shop == shop).all()

        # Prepare the result list
        result = []

        # Fetch the schedule for the specific shop and azienda
        schedule = Schedules.query.filter(
            Schedules.id_azienda == azienda.id_azienda,
            Schedules.shop == shop
        ).first()

        # Determine available turns based on the schedule for the specified day
        available_turn_ids = []
        if schedule:
            turns_for_day = getattr(schedule, day_of_week)  # Get the turn IDs for the specific day
            if turns_for_day:
                available_turn_ids = [turn_id for turn_id in turns_for_day]  # Adjust this based on how turns are stored

        for table in tables:
            # Fetch corresponding turns based on available turn IDs
            turns = Turns.query.filter(
                Turns.id_azienda == azienda.id_azienda,
                Turns.id.in_(available_turn_ids)  # Filter turns by available IDs
            ).all()

            table_data = {
                "id": table.id,
                "number": table.number,
                "min_places": table.min_places,
                "max_places": table.max_places,
                "banco": table.banco,
                "reservations": []
            }

            for turn in turns:
                # Query reservations for the current table and turn, applying filters
                query = Reservation.query.filter(
                    Reservation.table == table.id,
                    Reservation.turn == turn.id,  # Correct comparison
                    Reservation.removed == False
                )

                # Apply date filter if provided
                if filter_date:
                    query = query.filter(Reservation.date == filter_date)

                # Apply shop filter if provided
                if shop:
                    query = query.filter(Reservation.shop == shop)

                reservations = query.all()

                # If there are reservations, gather their data
                if reservations:
                    reservation_list = []
                    for res in reservations:
                        reservation_data = {
                            "id": res.id,
                            "customer": {
                                "id": res.customer.id,
                                "nome": res.customer.nome,
                                "cognome": res.customer.cognome,
                                "email": res.customer.email,
                                "telefono": res.customer.telefono
                            },
                            "date": res.date,
                            "people": res.people,
                            "note": res.note,
                            "reservation_validated": res.reservation_validated,
                            "charged": res.charged,
                            "time": res.time,
                            "payment_id": res.payment_id,
                        }
                        reservation_list.append(reservation_data)

                    # Use to_dict method for serialization of turn
                    table_data["reservations"].append({
                        "turn": turn.to_dict(),  # Convert turn to dict
                        "reservations": reservation_list
                    })
                else:
                    # If no reservations, add null for the turn
                    table_data["reservations"].append({
                        "turn": turn.to_dict(),  # Convert turn to dict
                        "reservations": None
                    })

            result.append(table_data)

        return jsonify({"data": result}), 200
    except Exception as e:
        db.session.rollback()  # Rollback in case of any errors
        return jsonify({"error": "An error occurred while fetching reservations", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session



# Route to mark reservations as deleted (soft delete)
@app.route('/reservation/delete', methods=['DELETE'])
@token_required
def delete_reservation():
    token = request.headers.get('Authorization')

    try:
        # Decode the token and get the user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        turn_id = data.get('id')
        turn_ids = data.get('ids')

        # Ensure at least one of `id` or `ids` is provided
        if not turn_id and not turn_ids:
            return jsonify({"error": "No turn ID(s) provided"}), 400

        if turn_ids:
            turns = Reservation.query.filter(Reservation.reservation_col.in_(turn_ids)).all()
            if not turns:
                return jsonify({"error": "No turns found with the provided IDs"}), 404
            for turn in turns:
                turn.removed = True
                turn.reservation_validated = False
        elif turn_id:
            turns = Reservation.query.filter_by(reservation_col=turn_id).all()
            if not turns:
                return jsonify({"error": "Turn not found"}), 404
            for turn in turns:
                turn.removed = True
                turn.reservation_validated = False

        db.session.commit()
        return jsonify({"success": "Turn(s) marked as deleted successfully"}), 200

    except Exception as e:
        print(f"Error during turn deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the turn(s)", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


# Route to completely delete reservations (hard delete)
@app.route('/reservation/delete/complete', methods=['DELETE'])
@token_required
def delete_reservation_complete():
    token = request.headers.get('Authorization')

    try:
        # Decode the token and get the user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        turn_id = data.get('id')
        turn_ids = data.get('ids')

        # Ensure at least one of `id` or `ids` is provided
        if not turn_id and not turn_ids:
            return jsonify({"error": "No turn ID(s) provided"}), 400

        if turn_ids:
            turns = Reservation.query.filter(Reservation.reservation_col.in_(turn_ids)).all()
            if not turns:
                return jsonify({"error": "No turns found with the provided IDs"}), 404
            for turn in turns:
                db.session.delete(turn)
        elif turn_id:
            turns = Reservation.query.filter_by(reservation_col=turn_id).all()
            if not turns:
                return jsonify({"error": "Turn not found"}), 404
            for turn in turns:
                db.session.delete(turn)

        db.session.commit()
        return jsonify({"success": "Turn(s) deleted successfully"}), 200

    except Exception as e:
        print(f"Error during turn deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the turn(s)", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/reservation/add', methods=['POST'])
@token_required
def add_reservation():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    # Generate a unique ID for the reservation batch
    reservation_id = str(uuid.uuid4())

    data = request.json
    try:
        # Check if the customer already exists by denominazione
        customer = Clienti.query.filter_by(nome=data.get('nome'), cognome=data.get('cognome')).first()

        turns = Turns.query.filter_by(id_azienda=azienda.id_azienda).all()

        # If customer doesn't exist, create a new customer
        if not customer:
            customer = Clienti(
                cognome=data.get('cognome'),
                nome=data.get('nome'),
                id_azienda=azienda.id_azienda  # Link to the company
            )
            db.session.add(customer)  # Add new customer to the session
            db.session.flush()  # Flush to get the customer ID

        # Parse the reservation time
        reservation_time_str = data.get('time')  # Expecting HH:MM format
        reservation_time = datetime.strptime(reservation_time_str, "%H:%M")
        
        # Determine the time window
        start_time = reservation_time - timedelta(minutes=90)
        end_time = reservation_time + timedelta(minutes=90)

        # Find turns that are within the specified time window
        available_turns = []
        for turn in turns:
            turn_time = datetime.strptime(turn.description, "%H:%M")  # Assuming turn.description is in HH:MM format
            if start_time.time() <= turn_time.time() <= end_time.time():
                available_turns.append(turn)

        # Handle the reservation creation
        if not data.get("table"):  # If no tables are specified
            table = Tables.query.filter_by(shop=data.get('shop'), number=data.get('number')).first()
            for turn in available_turns:
                reservation = Reservation(
                    customer_id=customer.id,
                    people=data.get('people'),
                    time=data.get('time'),
                    note=data.get('notes'),
                    id_azienda=azienda.id_azienda,
                    date=data.get('date'),
                    turn=turn.id,  # Use the matching turn ID
                    locale=True,
                    table=table.id,
                    shop=data.get('shop'),
                    reservation_col=reservation_id  # Assign the unique ID here
                )
                db.session.add(reservation)
        else:
            for tab in data.get("table"):
                for turn in available_turns:
                    reservation = Reservation(
                        customer_id=customer.id,
                        people=data.get('people'),
                        time=data.get('time'),
                        note=data.get('notes'),
                        id_azienda=azienda.id_azienda,
                        date=data.get('date'),
                        turn=turn.id,  # Use the matching turn ID
                        locale=True,
                        table=tab['value'],
                        shop=data.get('shop'),
                        reservation_col=reservation_id  # Assign the unique ID here
                    )
                    db.session.add(reservation)

        db.session.commit()  # Commit the changes
        socketio.emit('tables_updated', room=azienda.id_azienda)
        return jsonify({"success": "Reservation added successfully"}), 201  # Return success response

    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"error": "An error occurred while adding the reservation", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session




@app.route('/reservation/confirm', methods=['DELETE'])
@token_required
def validate_reservation():
    token = request.headers.get('Authorization')

    try:
        # Decode the token and get the user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        turn_id = data.get('id')
        turn_ids = data.get('ids')

        if not turn_id and not turn_ids:
            return jsonify({"error": "No turn ID(s) provided"}), 400

        if turn_ids:
            turns = Reservation.query.filter(Reservation.id.in_(turn_ids)).all()
            if not turns:
                return jsonify({"error": "No turns found with the provided IDs"}), 404
            for turn in turns:
                turn.reservation_validated = True
        else:
            turn = Reservation.query.filter_by(id=turn_id).first()
            if not turn:
                return jsonify({"error": "Turn not found"}), 404
            turn.reservation_validated = True

        db.session.commit()
        socketio.emit('tables_updated', room=azienda.id_azienda)
        return jsonify({"success": "Turn(s) deleted successfully"}), 200

    except Exception as e:
        print(f"Error during turn deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the turn(s)", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup

@app.route('/reservation/charge', methods=['DELETE'])
@token_required
def charge_reservation():
    token = request.headers.get('Authorization')

    try:
        # Decode the token and get the user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        turn_id = data.get('id')
        turn_ids = data.get('ids')
        stripe.api_key = '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'

        if not turn_id and not turn_ids:
            return jsonify({"error": "No turn ID(s) provided"}), 400

        if turn_ids:
            turns = Reservation.query.filter(Reservation.id.in_(turn_ids)).all()
            if not turns:
                return jsonify({"error": "No turns found with the provided IDs"}), 404
            for turn in turns:
                payment_intent_id_bytes = str(turn.payment_id).encode('utf-8')
                stripe.PaymentIntent.confirm(
                    payment_intent_id_bytes,
                    payment_method="pm_card_visa",
                    return_url="https://www.example.com"
                )
                turn.charge = True
        else:
            payment_intent_id_bytes = str(turn.payment_id).encode('utf-8')
            stripe.PaymentIntent.confirm(
                payment_intent_id_bytes,
                payment_method="pm_card_visa",
                return_url="https://www.example.com"
            )
            turn = Reservation.query.filter_by(id=turn_id).first()
            if not turn:
                return jsonify({"error": "Turn not found"}), 404
            turn.charge = True

        db.session.commit()
        return jsonify({"success": "Turn(s) deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error during turn deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the turn(s)", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup






@app.route('/reparti', methods=['GET'])
@token_required
def get_reparti():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Query the Reparti under the same session
        reparti = Reparti.query.filter_by(id_azienda=azienda.id_azienda).all()
        reparti_list = [{"id": cat.id, "description": cat.description, "printer": cat.printer} for cat in reparti]
        return jsonify({"data": reparti_list})

    except Exception as e:
        db.session.rollback()  # Rollback if there's an error
        return jsonify({"error": "An error occurred while fetching reparti", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session


@app.route('/reparti/add', methods=['POST'])
@token_required
def add_reparti():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    try:
        # Create a new Reparti entry
        category = Reparti(
            description=data.get('description'),
            printer=data.get('printer'),
            id_azienda=azienda.id_azienda
        )
        db.session.add(category)  # Add the new category
        db.session.commit()  # Commit the changes

        return jsonify({"success": "Reparti added successfully"}), 201  # Return success response

    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"error": "An error occurred while adding reparti", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session

@app.route('/shops/add', methods=['POST'])
@token_required
def add_shop():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    try:
        # Create a new Shop entry
        new_shop = Shops(
            descrizione=data.get('description'),  # Fetch the description from the request body
            name=data.get('name'),  # Fetch the shop name
            location_link=data.get('location_link'),  # Fetch the location link
            address=data.get('address'),  # Fetch the address
            city=data.get('city'),  # Fetch the city
            cap=data.get('cap'),  # Fetch the postal code
            provincia=data.get('provincia'),  # Fetch the province
            id_azienda=azienda.id_azienda  # Assign the correct azienda ID from the token
        )

        db.session.add(new_shop)  # Add the new shop to the session
        db.session.commit()  # Commit the transaction

        return jsonify({"success": "Shop added successfully"}), 201  # Success response

    except Exception as e:
        db.session.rollback()  # Rollback the session if there's an error
        return jsonify({"error": "An error occurred while adding shop", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session


@app.route('/turns', methods=['GET'])
@token_required
def get_turns():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Query the Turns associated with the azienda
        turns = Turns.query.all()  # If you want to filter by azienda, include that logic as necessary
        turns_list = [{"id": turn.id, "description": turn.description} for turn in turns]
        return jsonify({"data": turns_list})

    except Exception as e:
        db.session.rollback()  # Rollback if there's an error
        return jsonify({"error": "An error occurred while fetching turns", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session


@app.route('/turns/add', methods=['POST'])
@token_required
def add_turn():
    token = request.headers.get('Authorization')
    
    # Decode token to get user and azienda (adjust this as needed for turns)
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    description = data.get('description')
    
    if not description:
        return jsonify({"error": "Description is required"}), 400

    try:
        # Create a new Turn entry
        new_turn = Turns(description=description, id_azienda=azienda.id_azienda)
        db.session.add(new_turn)
        db.session.commit()  # Commit the changes

        return jsonify({"success": "Turn added successfully"}), 201

    except Exception as e:
        db.session.rollback()  # Rollback on error
        return jsonify({"error": "An error occurred while adding the turn", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session

@app.route('/turns/edit', methods=['PATCH'])
@token_required
def edit_turn():
    token = request.headers.get('Authorization')
    
    # Decode token to get user and azienda (adjust this as needed for turns)
    user, azienda = decode_token_and_get_azienda(token)
    
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    turn_id = data.get('id')
    description = data.get('description')
    
    if not turn_id:
        return jsonify({"error": "Turn ID is required"}), 400

    try:
        # Retrieve the Turn by ID
        turn = Turns.query.filter_by(id=turn_id).first()

        if not turn:
            return jsonify({"error": "Turn not found"}), 404

        # Update the turn description
        if description:
            turn.description = description

        db.session.commit()  # Commit the changes

        return jsonify({"success": "Turn updated successfully"}), 200

    except Exception as e:
        db.session.rollback()  # Rollback on error
        return jsonify({"error": "An error occurred while updating the turn", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session

@app.route('/turns/delete', methods=['DELETE'])
@token_required
def delete_turn():
    token = request.headers.get('Authorization')

    try:
        # Decode the token and get the user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        turn_id = data.get('id')
        turn_ids = data.get('ids')

        if not turn_id and not turn_ids:
            return jsonify({"error": "No turn ID(s) provided"}), 400

        if turn_ids:
            turns = Turns.query.filter(Turns.id.in_(turn_ids)).all()
            if not turns:
                return jsonify({"error": "No turns found with the provided IDs"}), 404
            for turn in turns:
                db.session.delete(turn)
        else:
            turn = Turns.query.filter_by(id=turn_id).first()
            if not turn:
                return jsonify({"error": "Turn not found"}), 404
            db.session.delete(turn)

        db.session.commit()
        return jsonify({"success": "Turn(s) deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error during turn deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the turn(s)", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup



    

@app.route('/reparti/delete', methods=['DELETE'])
@token_required
def delete_reparti():
    data = request.json    
    category_id = data.get('id')
    category_ids = data.get('ids')

    if not category_id and not category_ids:
        return jsonify({"error": "No category ID(s) provided"}), 400

    try:
        if category_ids:
            categories = Reparti.query.filter(Reparti.id.in_(category_ids)).all()
            if not categories:
                return jsonify({"error": "No categories found with the provided IDs"}), 404
            for category in categories:
                db.session.delete(category)
        else:
            category = Reparti.query.filter_by(id=category_id).first()
            if not category:
                return jsonify({"error": "Category not found"}), 404
            db.session.delete(category)

        db.session.commit()
        db.session.remove()
        return jsonify({"success": "Category(ies) deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/shops/delete', methods=['DELETE'])
@token_required
def delete_shops():
    token = request.headers.get('Authorization')
        # Decode the token and get the user and azienda
    user, azienda = decode_token_and_get_azienda(token)
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    shop_id = data.get('id')
    shop_ids = data.get('ids')

    if not shop_id and not shop_ids:
        return jsonify({"error": "No shop ID(s) provided"}), 400

    # If multiple shop IDs are provided
    if shop_ids:
        shops = Shops.query.filter(Shops.id.in_(shop_ids), Shops.id_azienda == azienda.id_azienda).all()
        if not shops:
            return jsonify({"error": "No shops found with the provided IDs"}), 404
        for shop in shops:
            db.session.delete(shop)
    else:
        # If a single shop ID is provided
        shop = Shops.query.filter_by(id=shop_id, id_azienda=azienda.id_azienda).first()
        if not shop:
            return jsonify({"error": "Shop not found"}), 404
        db.session.delete(shop)

    # Commit the changes
    db.session.commit()
    return jsonify({"success": "Shop(s) deleted successfully"}), 200
    



@app.route("/reparti/edit", methods=['PATCH'])
@token_required
def update_reparti():
    data = request.json

    try:
        # Retrieve the category by ID
        categoria = Reparti.query.filter_by(id=data.get("id")).first()
        
        if not categoria:
            return jsonify({"error": "Category not found"}), 404

        # Update the category attributes
        categoria.description = data.get('description')
        categoria.printer = data.get('printer')

        db.session.commit()  # Commit the changes

        return jsonify({"success": "Reparti updated successfully"}), 200

    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"error": "An error occurred while updating reparti", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session

@app.route('/shops/edit', methods=['PATCH'])
@token_required
def update_shops():
    data = request.json

    try:
        # Retrieve the shop by ID
        shop = Shops.query.filter_by(id=data.get("id")).first()
        
        if not shop:
            return jsonify({"error": "Shop not found"}), 404

        # Update the shop attributes
        shop.descrizione = data.get('description', shop.descrizione)
        shop.name = data.get('name', shop.name)
        shop.location_link = data.get('location_link', shop.location_link)
        shop.address = data.get('address', shop.address)
        shop.city = data.get('city', shop.city)
        shop.cap = data.get('cap', shop.cap)
        shop.provincia = data.get('provincia', shop.provincia)

        db.session.commit()  # Commit the changes

        return jsonify({"success": "Shop updated successfully"}), 200

    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"error": "An error occurred while updating shop", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session




@app.route('/scontrini', methods=['GET'])
@token_required
def get_scontrino():
    token = request.headers.get('Authorization')
    
    try:
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        comande = Comande.query.filter_by(id_azienda=azienda.id_azienda).all()
        comande_list = [
            {
                "id": cat.id,
                "cliente": cat.cliente if cat.cliente != 1 else "Nessuno",
                "date": cat.date.strftime('%Y/%m/%d %H:%M') if cat.date else None,
                "idScontrino": cat.idScontrino,
                "numeroDoc": cat.numeroDoc,
                "annullato": cat.annullato,
                "totale": cat.totale
            }
            for cat in comande if cat.numeroDoc != ""
        ]
        
        # Sort the list by date, from most recent to oldest
        comande_list.sort(key=lambda x: x['date'], reverse=True)

        return jsonify({"data": comande_list}), 200

    except Exception as e:
        print(f"Error retrieving scontrini: {e}")
        return jsonify({"error": "An error occurred while retrieving scontrini", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session


@app.route('/scontrini/filter/<date>', methods=['GET'])
@token_required
def get_scontrino_filter(date):
    token = request.headers.get('Authorization')
    
    try:
        # Parse date input to ensure it's a valid date
        filter_date = datetime.strptime(date, '%Y-%m-%d')
        
        # Define start and end of the day range
        start_of_day = filter_date
        end_of_day = filter_date + timedelta(days=1)
        
        # Decode token and get user and azienda info
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Filter by id_azienda and date range
        comande = Comande.query.filter(
            Comande.id_azienda == azienda.id_azienda,
            Comande.date >= start_of_day,
            Comande.date < end_of_day
        ).all()
        
        # Prepare response data
        comande_list = [
            {
                "id": cat.id,
                "cliente": cat.cliente if cat.cliente != 1 else "Nessuno",
                "date": cat.date.strftime('%Y/%m/%d %H:%M') if cat.date else None,
                "idScontrino": cat.idScontrino,
                "numeroDoc": cat.numeroDoc,
                "annullato": cat.annullato,
                "totale": cat.totale
            }
            for cat in comande if cat.numeroDoc != ""
        ]
        
        # Sort the list by date, from most recent to oldest
        comande_list.sort(key=lambda x: x['date'], reverse=True)

        return jsonify({"data": comande_list}), 200

    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    except Exception as e:
        print(f"Error retrieving scontrini: {e}")
        return jsonify({"error": "An error occurred while retrieving scontrini", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session



@app.route("/scontrino/annulla", methods=["DELETE"])
@token_required
def scontrino_annulla():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Get the request data
        data = request.json
        id = data.get('ids')
        
        if not id:
            return jsonify({"error": "Missing 'ids' in request body"}), 400
        
        # Retrieve the comanda (receipt)
        comanda = Comande.query.filter_by(id=id).first()
        
        if not comanda:
            return jsonify({"error": f"No scontrino found with id {id}"}), 404
        
        # Handle annulling the scontrino (receipt)
        errore = annullo_scontrino_sidae(azienda, comanda.numeroDoc)
        
        if errore != "":
            return jsonify({"error": "Problemi con l'annullo dello scontrino"}), 400
        
        # Mark as cancelled
        comanda.annullato = True
        db.session.commit()
        
        return jsonify({"success": "Scontrino Annullato"}), 200

    except Exception as e:
        print(f"Error annulling scontrino: {e}")
        return jsonify({"error": "An error occurred while annulling scontrino", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/scontrino/reprint", methods=['POST'])
@token_required
def scontrino_reprint():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Get the request data
        data = request.json
        id = data.get('ids')
        
        if not id:
            return jsonify({"error": "Missing 'ids' in request body"}), 400
        
        # Retrieve the comanda (receipt)
        comanda = Comande.query.filter_by(id=id).first()
        
        if not comanda:
            return jsonify({"error": f"No scontrino found with id {id}"}), 404
        
        # Convert datetime to string
        data_date = comanda.date.strftime('%Y-%m-%d %H:%M:%S') if comanda.date else None
        
        # Build the new data dictionary for reprinting
        new_data = {
            "azienda": {
                "denominazione": f"{azienda.nome_azienda} {azienda.forma_giuridica}" if azienda.nome_azienda != "" 
                                 else f"{azienda.cognome} {azienda.nome}",
                "indirizzo": azienda.sede_legale,
                "cap": azienda.cap,
                "comune": azienda.citta,
                "provincia": azienda.provincia,
                "partitaiva": azienda.partita_iva,
                "codicefiscale": azienda.codice_fiscale,
                "telefono": azienda.phone,
                "mail": azienda.mail
            },
            "cliente": {
                "denominazione": comanda.cliente if comanda.cliente != 1 else "Nessun Cliente"
            },
            "corpo": comanda.contenuto,
            "printer_type": "Network",
            "totale": comanda.totale,
            "iva": comanda.iva,
            "data": data_date,
            "payment": comanda.pagamento,
            "numdoc": comanda.numeroDoc
        }

        # Emit socket event to reprint scontrino
        socketio.emit('print_scontrino', {'data': new_data}, room=azienda.id_azienda)
        
        return jsonify({"success": "Scontrino Ristampato"}), 200
    
    except Exception as e:
        print(f"Error reprinting scontrino: {e}")
        return jsonify({"error": "An error occurred while reprinting scontrino", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/varianti', methods=['GET'])
@token_required
def get_varianti():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Retrieve the list of varianti
        varianti = Varianti.query.filter_by(id_azienda=azienda.id_azienda).all()
        varianti_list = [
            {"id": var.id, "description": var.description, "code": var.code, "ingredienti": var.ingredienti} 
            for var in varianti
        ]
        
        return jsonify({"data": varianti_list}), 200
    
    except Exception as e:
        print(f"Error fetching varianti: {e}")
        return jsonify({"error": "An error occurred while fetching varianti", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/varianti/add', methods=['POST'])
@token_required
def add_varianti():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Get request data
        data = request.json
        description = data.get('description')
        code = data.get('code')
        
        if not description or not code:
            return jsonify({"error": "Missing required fields: 'description' or 'code'"}), 400
        
        # Create new variante entry
        variante = Varianti(description=description, code=code, id_azienda=azienda.id_azienda)
        db.session.add(variante)
        db.session.commit()
        
        return jsonify({"success": "Variante added successfully"}), 201
    
    except Exception as e:
        print(f"Error adding variante: {e}")
        db.session.rollback()  # Roll back in case


@app.route('/varianti/delete', methods=['DELETE'])
@token_required
def delete_varianti():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Get request data
        data = request.json
        category_id = data.get('id')
        category_ids = data.get('ids')
        
        if not category_id and not category_ids:
            return jsonify({"error": "No category ID(s) provided"}), 400
        
        if category_ids:
            # Delete multiple categories
            categories = Varianti.query.filter(Varianti.id.in_(category_ids), Varianti.id_azienda == azienda.id_azienda).all()
            
            if not categories:
                return jsonify({"error": "No categories found with the provided IDs"}), 404
            
            for category in categories:
                db.session.delete(category)
        
        else:
            # Delete a single category
            category = Varianti.query.filter_by(id=category_id, id_azienda=azienda.id_azienda).first()
            
            if not category:
                return jsonify({"error": "Category not found"}), 404
            
            db.session.delete(category)
        
        db.session.commit()
        return jsonify({"success": "Category(ies) deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error deleting varianti: {e}")
        db.session.rollback()  # Roll back in case of error
        return jsonify({"error": "An error occurred while deleting varianti", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/varianti/edit", methods=['PATCH'])
@token_required
def update_variante():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Get request data
        data = request.json
        variante_id = data.get("id")
        if not variante_id:
            return jsonify({"error": "Missing 'id' field"}), 400
        
        # Find variante
        variante = Varianti.query.filter_by(id=variante_id, id_azienda=azienda.id_azienda).first()
        
        if not variante:
            return jsonify({"error": "Variante not found"}), 404
        
        # Update variante
        variante.code = data.get('code', variante.code)
        variante.description = data.get('description', variante.description)
        variante.ingredienti = data.get('ingredienti', variante.ingredienti)
        
        db.session.commit()
        return jsonify({"success": "Variante updated successfully"}), 200
    
    except Exception as e:
        print(f"Error updating variante: {e}")
        db.session.rollback()  # Rollback if something goes wrong
        return jsonify({"error": "An error occurred while updating variante", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup




@app.route('/categories', methods=['GET'])
@token_required
def get_categories():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Retrieve categories
        categories = Categories.query.filter_by(id_azienda=azienda.id_azienda).all()
        if not categories:
            return jsonify({"data": []}), 200
        
        # Prepare response
        categories_list = [
            {"id": cat.id, "description": cat.description, "reparti": cat.reparto, "descrizione_agg": cat.descrizione_agg, "ordinamento": cat.ordinamento, "menu": cat.menu}
            for cat in categories
        ]
        return jsonify({"data": categories_list}), 200
    
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({"error": "An error occurred while fetching categories", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/clienti', methods=['GET'])
@token_required
def get_clienti():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Retrieve clienti
        clienti = Clienti.query.filter_by(id_azienda=azienda.id_azienda).all()
        if not clienti:
            return jsonify({"data": []}), 200
        
        # Prepare response
        clienti_list = [
            {
                "id": c.id, "denominazione": c.denominazione, "nome": c.nome, "cognome": c.cognome, "partitaiva": c.partitaiva,
                "codicefiscale": c.codicefiscale, "indirizzo": c.indirizzo, "civico": c.civico, "comune": c.citta, "provincia": c.provincia,
                "nazione": c.nazione, "SDI": c.SDI, "giuridica": c.giuridica, "email": c.email, "pec": c.pec, "telefono": c.telefono,
                "cellulare": c.cellulare, "cap": c.cap, "generico": c.generico, "news" : c.news, "privacy" : c.privacy
            } for c in clienti
        ]
        return jsonify({"data": clienti_list}), 200
    
    except Exception as e:
        print(f"Error fetching clienti: {e}")
        return jsonify({"error": "An error occurred while fetching clienti", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/fornitori', methods=['GET'])
@token_required
def get_fornitori():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401
        
        # Retrieve fornitori
        fornitori = Fornitori.query.filter_by(id_azienda=azienda.id_azienda).all()
        if not fornitori:
            return jsonify({"data": []}), 200
        
        # Prepare response
        fornitori_list = [
            {
                "id": c.id, "denominazione": c.denominazione, "nome": c.nome, "cognome": c.cognome, "partitaiva": c.partitaiva,
                "codicefiscale": c.codicefiscale, "indirizzo": c.indirizzo, "civico": c.civico, "comune": c.comune, "provincia": c.provincia,
                "nazione": c.nazione, "SDI": c.SDI, "giuridica": c.giuridica, "email": c.email, "pec": c.pec, "telefono": c.telefono,
                "cellulare": c.cellulare, "generico": c.generico
            } for c in fornitori
        ]
        return jsonify({"data": fornitori_list}), 200
    
    except Exception as e:
        print(f"Error fetching fornitori: {e}")
        return jsonify({"error": "An error occurred while fetching fornitori", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/products', methods=['POST', 'GET'])
@token_required
def get_articoli():
    token = request.headers.get('Authorization')

    # Decode token and get user and azienda
    user, azienda = decode_token_and_get_azienda(token)
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    def fetch_variants(art, azienda):
        varianti_list = []
        total_giacenza = 0
        giacenza_variant = None

        for var_data in art.varianti_list:
            var_id = var_data.get("value")
            variant = Varianti.query.filter_by(id=var_id, id_azienda=azienda.id_azienda).first()

            if variant:
                giacenza_variant = Giacenze.query.filter_by(id_articolo=art.id, id_variante=var_id).first()
                prezzo_variant = Listino.query.filter_by(id_articolo=art.id, id_variante=var_id).first()
                giacenza_value = giacenza_variant.giacenza if giacenza_variant else 0
                total_giacenza += giacenza_value

                # Convert prezzo_variant to a dictionary if it exists
                prezzo_dict = {
                    "prezzo": prezzo_variant.prezzo if prezzo_variant else None,
                }

                varianti_list.append({
                    "label": var_data.get("label"),
                    "value": var_data.get("value"),
                    "ingredienti": variant.ingredienti,
                    "giacenza": giacenza_value,
                    "prezzo": prezzo_dict if art.prezzi_varianti else art.prezzo  # Use the serialized version here
                })
            else:
                varianti_list.append(var_data)

        return varianti_list, total_giacenza, giacenza_variant

    def build_article_data(art, azienda):
        varianti_list, total_giacenza, giacenza_variant = fetch_variants(art, azienda)
        giacenza = Giacenze.query.filter_by(id_articolo=art.id).first()

        return {
            "id": art.id,
            "code": art.code,
            "category": {"id": art.category_id, "description": art.category.description},
            "description": art.description,
            "price": art.prezzo,
            "iva": {
                "id": art.iva,
                "description": art.aliva.description,
                "aliquota": art.aliva.aliquota
            },
            "um": {"id": art.um, "description": art.unitmeasure.description},
            "ingredienti": art.ingredienti,
            "vegetariano": art.vegetariano or False,
            "vegano": art.vegano or False,
            "celiaco": art.celiaco or False,
            "menu": art.menu or False,
            "varianti": varianti_list,
            "blocco_giacenze": art.blocco_giacenze,
            "giacenza_id": giacenza_variant.id if giacenza_variant and art.giacenza_varianti else (giacenza.id if giacenza else ""),
            "giacenza": total_giacenza if total_giacenza else (giacenza.giacenza if giacenza else 0),
            "giacenza_varianti": art.giacenza_varianti,
            "prezzi_varianti": art.prezzi_varianti
        }

    if request.method == "POST":
        data = request.json
        if not data or 'id' not in data:
            return jsonify({"error": "Invalid input. 'id' is required"}), 400

        category_id = data.get('id')
        articoli = Articoli.query.filter_by(id_azienda=azienda.id_azienda, category_id=category_id).all()

        if not articoli:
            return jsonify({"data": []}), 200

        articles_list = [build_article_data(art, azienda) for art in articoli]
        return jsonify({"data": articles_list}), 200

    elif request.method == "GET":
        articoli = Articoli.query.filter_by(id_azienda=azienda.id_azienda).all()
        if not articoli:
            return jsonify({"data": []}), 200

        articoli_list = [build_article_data(art, azienda) for art in articoli]
        return jsonify({"data": articoli_list}), 200



    



@app.route('/products/<int:id>', methods=['POST', 'GET'])
def get_articoli_unprotected(id):
    try:
        articoli = Articoli.query.filter_by(id_azienda=id, menu= True).all()

        print(articoli)
        if not articoli:
            return jsonify({"data": []}), 200

        articoli_list = [
            {
                "id": art.id,
                "code": art.code,
                "description": art.description,
                "um": {"id": art.um, "description": art.unitmeasure.description},
                "iva": {"id": art.iva, "description": art.aliva.description, "aliquota": art.aliva.aliquota},
                "img": art.img,
                "category": {
                    "id": art.category_id,
                    "description": art.category.description,
                    "description_agg": art.category.descrizione_agg,
                    "menu": art.category.menu,
                },
                "price": art.prezzo,
                "ingredienti": art.ingredienti,
                "vegetariano": art.vegetariano if art.vegetariano else False,
                "vegano": art.vegano if art.vegano else False,
                "celiaco": art.celiaco if art.celiaco else False,
                "menu": art.menu,
                "varianti": art.varianti_list
            } for art in articoli
        ]
        
        return jsonify({"data": articoli_list}), 200
    
    except Exception as e:
        print(f"Error fetching articles: {e}")
        return jsonify({"error": "An error occurred while fetching products", "details": str(e)}), 500


@app.route("/azienda/<int:id>", methods=['GET'])
def get_azienda_unprotected(id):
    try:
        azienda = Azienda.query.filter_by(id_azienda=id).first()
        if not azienda:
            return jsonify({"error": "Azienda not found"}), 404

        azienda_data = {
            "denominazione": azienda.nome_azienda if azienda.nome_azienda else f"{azienda.cognome} {azienda.nome}",
            "partita_iva": azienda.partita_iva,
            "codice_fiscale": azienda.codice_fiscale,
            "indirizzo": f"{azienda.sede_legale} {azienda.civico}",
            "cap": azienda.cap,
            "comune": azienda.citta,
            "provincia": azienda.provincia
        }
        
        return jsonify({"data": azienda_data}), 200
    
    except Exception as e:
        print(f"Error fetching azienda: {e}")
        return jsonify({"error": "An error occurred while fetching azienda details", "details": str(e)}), 500


@app.route('/products/add', methods=['POST'])
@token_required
def add_product():
    token = request.headers.get('Authorization')
    
    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        required_fields = ['code', 'description', 'category', 'um', 'iva', 'price']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

        # Create product
        product = Articoli(
            code=data['code'],
            description=data['description'],
            um=data['um'],
            iva=data['iva'],
            img=data.get('img', ""),
            category_id=data['category'],
            prezzo=data['price'],
            id_azienda=azienda.id_azienda,
            ingredienti=data.get('ingredients'),
            vegetariano=data.get('vegetariano'),
            vegano=data.get('vegano'),
            celiaco=data.get('celiaco'),
            menu=data.get('menu'),
            varianti=bool(data.get('varianti', False)),
            varianti_list=data.get('varianti'),
            blocco_giacenze= data.get('giacenze'),
            giacenza_varianti = data.get('giacenza_varianti'),
            prezzi_varianti = data.get('prezzi_varianti')
        )

        db.session.add(product)
        db.session.commit()

        return jsonify({"success": 'Product added successfully'}), 201
    
    except Exception as e:
        print(f"Exception occurred while adding product: {e}")
        db.session.rollback()  # Rollback if there's an error
        return jsonify({"error": "An error occurred while adding the product", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/products/delete', methods=['DELETE'])
@token_required
def delete_product():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        product_id = data.get('id')
        product_ids = data.get('ids')

        if not product_id and not product_ids:
            return jsonify({"error": "No product ID(s) provided"}), 400

        if product_ids:
            products = Articoli.query.filter(Articoli.id.in_(product_ids)).all()
            if not products:
                return jsonify({"error": "No products found with the provided IDs"}), 404
            for product in products:
                db.session.delete(product)
        else:
            product = Articoli.query.filter_by(id=product_id, id_azienda=azienda.id_azienda).first()
            if not product:
                return jsonify({"error": "Product not found"}), 404
            db.session.delete(product)

        db.session.commit()
        return jsonify({"success": "Product(s) deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error occurred during product deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the product(s)", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/products/edit", methods=['PATCH'])
@token_required
def update_product():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        product = Articoli.query.filter_by(id=data.get("id"), id_azienda=azienda.id_azienda).first()

        if not product:
            return jsonify({"error": "Product not found"}), 404

        # Update fields only if provided in the request body
        product.code = data.get('code', product.code)
        product.description = data.get('description', product.description)
        product.category_id = data.get('category', product.category_id)
        product.um = data.get('um', product.um)
        product.iva = data.get('iva', product.iva)
        product.prezzo = data.get('price', product.prezzo)
        product.img = data.get('img', product.img)
        product.ingredienti = data.get('ingredients', product.ingredienti)
        product.vegetariano = data.get('vegetariano', product.vegetariano)
        product.vegano = data.get('vegano', product.vegano)
        product.celiaco = data.get('celiaco', product.celiaco)
        product.menu = data.get('menu', product.menu)
        product.varianti = bool(data.get('varianti', product.varianti))
        product.varianti_list = data.get('varianti', product.varianti_list)
        product.blocco_giacenze = data.get('giacenze')
        product.giacenza_varianti = data.get('giacenza_varianti')
        product.prezzi_varianti = data.get('prezzi_varianti')

        db.session.commit()
        return jsonify({"success": 'Product updated successfully'}), 200
    
    except Exception as e:
        print(f"Error occurred during product update: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating the product", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup

@app.route("/giacenze", methods=['GET'])
@token_required
def get_giacenze():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    # Fetch all Articoli for the current azienda
    art_list = Articoli.query.filter_by(id_azienda=azienda.id_azienda).all()


    for articolo in art_list:
        # Check if there's a Listino for each variant of this article
        if articolo.prezzi_varianti:
            for variante in articolo.varianti_list:
                # Check if Listino for this variant exists
                listino_entry = Listino.query.filter_by(
                    id_azienda=azienda.id_azienda,
                    id_articolo=articolo.id,
                    id_variante=variante['value']
                ).first()

                # If Listino does not exist, create a new one with default price
                if not listino_entry:
                    new_prezzo_variante = Listino(
                        id_azienda=azienda.id_azienda,
                        id_articolo=articolo.id,
                        prezzo=0,  # Default price
                        id_variante=variante['value']
                    )
                    db.session.add(new_prezzo_variante)

        # Check if Giacenza exists for the article without any variant
        giacenza_record = Giacenze.query.filter_by(
            id_azienda=azienda.id_azienda,
            id_articolo=articolo.id,
            id_variante=None
        ).first()

        # If Giacenza does not exist, create a new one with default stock
        if not giacenza_record:
            new_giacenza = Giacenze(
                id_azienda=azienda.id_azienda,
                id_articolo=articolo.id,
                giacenza=0,  # Default stock
                id_variante=None
            )
            db.session.add(new_giacenza)

        # Check Giacenze for each variant
        for variante in articolo.varianti_list:
            giacenza_variante_record = Giacenze.query.filter_by(
                id_azienda=azienda.id_azienda,
                id_articolo=articolo.id,
                id_variante=variante['value']
            ).first()

            # If Giacenza for the variant doesn't exist, create it
            if not giacenza_variante_record:
                new_giacenza_variante = Giacenze(
                    id_azienda=azienda.id_azienda,
                    id_articolo=articolo.id,
                    giacenza=0,
                    id_variante=variante['value']
                )
                db.session.add(new_giacenza_variante)

    # Commit the changes after processing all records
    db.session.commit()

    # Query all Giacenze for the current azienda
    giacenze_records = Giacenze.query.filter_by(id_azienda=azienda.id_azienda).all()

    articles_list = []
    for giacenza_record in giacenze_records:
        articolo = giacenza_record.articolo  # Fetch the associated Articoli record
       
        if articolo is None:
            # Skip this giacenza if no corresponding articolo is found
            continue

        # Attempt to get the price from Listino
        listino_entry = Listino.query.filter_by(
            id_azienda=azienda.id_azienda,
            id_articolo=giacenza_record.id_articolo,
            id_variante=giacenza_record.id_variante
        ).first()

        # Set default price if Listino entry is not found
        prezzo = listino_entry.prezzo if listino_entry else 0
        listino_id = listino_entry.id if listino_entry else None

        # Append the giacenza information along with prezzo and listino_id to the response
        print(giacenza_record.id)
        articles_list.append({
            "id": giacenza_record.id,
            "code": articolo.code,
            "codice_variante": giacenza_record.variante.code if giacenza_record.variante and giacenza_record.id_variante else "",
            "desc_variante": giacenza_record.variante.description if giacenza_record.variante and giacenza_record.id_variante else "",
            "description": articolo.description,
            "category": {
                "id": articolo.category_id,
                "description": articolo.category.description
            },
            "giacenza_iniziale": giacenza_record.giacenza,
            "prezzo": prezzo if listino_id is not None else articolo.prezzo,  # Use correct logic for fetching price
            "listino_id": listino_id,  # Use correct logic for fetching Listino ID
            "is_variante": giacenza_record.id_variante is not None,
            "giacenza_varianti": articolo.giacenza_varianti,
            "prezzi_varianti": articolo.prezzi_varianti,
            "id_articolo": articolo.id
        })

    return jsonify({"data": articles_list}), 200

    









@app.route("/update-giacenze", methods=['POST'])
@token_required
def update_giacenze():
    token = request.headers.get('Authorization')

    user, azienda = decode_token_and_get_azienda(token)
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    
    try:
        # Access the 'data' key from the JSON payload
        data = request.json.get('data')
        print(data)

        for item in data:
            id_articolo = item.get('id')
            id_articolo_padre = item.get("id_articolo")
            id_listino = item.get('listino_id')
            giacenza_finale = item.get('giacenza_finale')

            giacenza_record = Giacenze.query.filter_by(id=id_articolo).first()
            if not giacenza_record:
                return jsonify({"error": f"Giacenza record for article ID {id_articolo} not found"}), 404
            
            # Update Listino if listino_id is provided
            if id_listino:
                listino_record = Listino.query.filter_by(id=id_listino).first()
                if listino_record:
                    listino_record.prezzo = item.get('prezzo', listino_record.prezzo)  # Use existing price if not provided

            # Update giacenza if giacenza_finale is not None
            if giacenza_finale is not None:
                giacenza_record.giacenza = giacenza_finale
            
            # Optional: Update Articoli model's price if listino_id is None
            if not id_listino:
                articolo_record = Articoli.query.filter_by(id=id_articolo_padre).first()
                if articolo_record:
                    articolo_record.prezzo = item.get('prezzo', articolo_record.prezzo)  # Update price if provided

        db.session.commit()
        return jsonify(data={"success": "Giacenze successfully updated"}), 200
    except Exception as e:
        print(f"Error occurred during product update: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating the product", "details": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session cleanup



    
   


@app.route('/categories/add', methods=['POST'])
@token_required
def add_category():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        if not data or 'description' not in data:
            return jsonify({"error": "Invalid input. 'description' field is required."}), 400

        category = Categories(
            description=data.get('description'),
            id_azienda=azienda.id_azienda,
            reparto=data.get("reparto"),
            descrizione_agg=data.get('descrizione_agg'),
            ordinamento = data.get('ordinamento'),
            menu= data.get('menu')
        )

        db.session.add(category)
        db.session.commit()
        return jsonify({"success": 'Category added successfully'}), 200
    
    except Exception as e:
        print(f"Error during category addition: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while adding the category", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/categories/delete', methods=['DELETE'])
@token_required
def delete_category():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        category_id = data.get('id')
        category_ids = data.get('ids')

        if not category_id and not category_ids:
            return jsonify({"error": "No category ID(s) provided"}), 400

        if category_ids:
            categories = Categories.query.filter(Categories.id.in_(category_ids), Categories.id_azienda == azienda.id_azienda).all()
            if not categories:
                return jsonify({"error": "No categories found with the provided IDs"}), 404
            for category in categories:
                db.session.delete(category)
        else:
            category = Categories.query.filter_by(id=category_id, id_azienda=azienda.id_azienda).first()
            if not category:
                return jsonify({"error": "Category not found"}), 404
            db.session.delete(category)

        db.session.commit()
        return jsonify({"success": "Category(ies) deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error during category deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the category(ies)", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/categories/edit", methods=['PATCH'])
@token_required
def update_category():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        category_id = data.get('id')

        if not category_id:
            return jsonify({"error": "'id' field is required"}), 400

        category = Categories.query.filter_by(id=category_id, id_azienda=azienda.id_azienda).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404

        # Update fields only if provided
        category.description = data.get('description', category.description)
        category.reparto = data.get('reparto', category.reparto)
        category.descrizione_agg = data.get('descrizione_agg', category.descrizione_agg)
        category.ordinamento = data.get('ordinamento', category.ordinamento)
        category.menu= data.get('menu')

        db.session.commit()
        return jsonify({"success": 'Category updated successfully'}), 200
    
    except Exception as e:
        print(f"Error during category update: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating the category", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/um', methods=['GET'])
@token_required
def get_um():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        ums = Um.query.filter_by(id_azienda=azienda.id_azienda).all()
        if not ums:
            return jsonify({"error": "No UM found for the specified azienda"}), 404

        ums_list = [{"id": u.id, "description": u.description} for u in ums]
        return jsonify({"data": ums_list}), 200

    except Exception as e:
        print(f"Error retrieving UM: {e}")
        return jsonify({"error": "An error occurred while fetching UM", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/um/add", methods=['POST'])
@token_required
def add_um():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        if not data or 'description' not in data:
            return jsonify({"error": "Invalid input. 'description' field is required."}), 400
        um = Um(description=data.get('description'), id_azienda=azienda.id_azienda)
        db.session.add(um)
        db.session.commit()

        return jsonify({"success": 'UM added successfully'}), 200

    except Exception as e:
        print(f"Error adding UM: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while adding UM", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup



@app.route('/um/delete', methods=['DELETE'])
@token_required
def delete_um():
    token = request.headers.get('Authorization')
    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        um_id = data.get('id')
        um_ids = data.get('ids')

        if not um_id and not um_ids:
            return jsonify({"error": "No UM ID(s) provided"}), 400
        if um_ids:
            ums = Um.query.filter(Um.id.in_(um_ids), Um.id_azienda == azienda.id_azienda).all()
            if not ums:
                return jsonify({"error": "No UM found with the provided IDs"}), 404
            for um in ums:
                db.session.delete(um)
        else:
            um = Um.query.filter_by(id=um_id, id_azienda=azienda.id_azienda).first()
            if not um:
                return jsonify({"error": "UM not found"}), 404
            db.session.delete(um)

        db.session.commit()
        return jsonify({"success": "UM(s) deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting UM: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting UM", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup




@app.route("/um/edit", methods=['PATCH'])
@token_required
def update_um():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        um_id = data.get('id')
        if not um_id:
            return jsonify({"error": "'id' field is required"}), 400

        um = Um.query.filter_by(id=um_id, id_azienda=azienda.id_azienda).first()
        if not um:
            return jsonify({"error": "UM not found"}), 404

        um.description = data.get('description', um.description)
        db.session.commit()

        return jsonify({"success": "UM updated successfully"}), 200

    except Exception as e:
        print(f"Error updating UM: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating UM", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/ingredienti", methods=['GET'])
@token_required
def get_ingredienti():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        ingredienti = Ingredienti.query.filter_by(id_azienda=azienda.id_azienda).all()
        if not ingredienti:
            return jsonify({"error": "No ingredients found for the specified azienda"}), 404

        ings_list = [{"id": ing.id, "description": ing.description} for ing in ingredienti]
        return jsonify({"data": ings_list}), 200

    except Exception as e:
        print(f"Error retrieving ingredients: {e}")
        return jsonify({"error": "An error occurred while fetching ingredients", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup

@app.route('/ingredienti/add', methods=['POST'])
@token_required
def add_ingredienti():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        if not data or 'description' not in data:
            return jsonify({"error": "Invalid input. 'description' field is required."}), 400

        category = Ingredienti(
            description=data.get('description'),
            id_azienda=azienda.id_azienda,            
        )

        db.session.add(category)
        db.session.commit()
        return jsonify({"success": 'Category added successfully'}), 200
    
    except Exception as e:
        print(f"Error during category addition: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while adding the category", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup

@app.route("/ingredienti/edit", methods=['PATCH'])
@token_required
def update_ingredienti():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        category_id = data.get('id')

        if not category_id:
            return jsonify({"error": "'id' field is required"}), 400

        category = Ingredienti.query.filter_by(id=category_id, id_azienda=azienda.id_azienda).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404

        # Update fields only if provided
        category.description = data.get('description', category.description)        

        db.session.commit()
        return jsonify({"success": 'Category updated successfully'}), 200
    
    except Exception as e:
        print(f"Error during category update: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating the category", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup

@app.route('/ingredienti/delete', methods=['DELETE'])
@token_required
def delete_ingredienti():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        category_id = data.get('id')
        category_ids = data.get('ids')

        if not category_id and not category_ids:
            return jsonify({"error": "No category ID(s) provided"}), 400

        if category_ids:
            categories = Ingredienti.query.filter(Ingredienti.id.in_(category_ids), Ingredienti.id_azienda == azienda.id_azienda).all()
            if not categories:
                return jsonify({"error": "No categories found with the provided IDs"}), 404
            for category in categories:
                db.session.delete(category)
        else:
            category = Ingredienti.query.filter_by(id=category_id, id_azienda=azienda.id_azienda).first()
            if not category:
                return jsonify({"error": "Category not found"}), 404
            db.session.delete(category)

        db.session.commit()
        return jsonify({"success": "Category(ies) deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error during category deletion: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting the category(ies)", "details": str(e)}), 500
    
    finally:
        db.session.remove()  # Ensure session cleanup


def generate_hash(data):
    """Generate a hash for the given data."""
    data_string = json.dumps(data, sort_keys=True)
    return hashlib.md5(data_string.encode()).hexdigest()

def fetch_table_data(azienda, shop=None):
    
    if shop:
        tables = Tables.query.filter_by(id_azienda=azienda.id_azienda, shop = shop).all()
    else:
        tables = Tables.query.filter_by(id_azienda=azienda.id_azienda).all()
    tables_data = []

    for t in tables:
        comande = Comande.query.filter_by(id_azienda=azienda.id_azienda, table=t.id, status=0).all()
        cliente = comande[0].customer if comande else None

        table_info = {
            "id": t.id,
            "shop": t.negozio.descrizione if t.negozio else "Unknown",
            "number": t.number,
            'min_places': t.min_places,
            'max_places': t.max_places,
            "banco": t.banco,
            "cliente": {
                "cliente_id": cliente.id if cliente and cliente.id != 0 else None,
                "cliente_descrizione": cliente.denominazione if cliente and cliente.denominazione != "" else f"{cliente.cognome} {cliente.nome}" if cliente else "Unknown"
            } if cliente else {
                "cliente_id": None,
                "cliente_descrizione": "Unknown"
            },
            "comandaId": comande[0].id if comande else None,
            "comande": [{"id": c.id, "details": c.contenuto} for c in comande]
        }

        tables_data.append(table_info)
    db.session.remove()
    return tables_data

last_tables_hash = None


@app.route('/tavoli', methods=['GET'])
@token_required
def get_tables():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        global last_tables_hash
        tables_data = fetch_table_data(azienda)
        new_hash = generate_hash(tables_data)
        data_updated = new_hash != last_tables_hash

        if data_updated:
            last_tables_hash = new_hash
            socketio.emit('tables_updated', {'data': tables_data}, room=azienda.id_azienda)

        return jsonify({"data": tables_data, "updated": data_updated}), 200

    except Exception as e:
        print(f"Error retrieving tables: {e}")
        return jsonify({"error": "An error occurred while fetching tables", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/tavoli/<int:id>', methods=['GET'])
@token_required
def get_tables_for_shop(id):
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        global last_tables_hash
        shop = id
        tables_data = fetch_table_data(azienda, shop)
        new_hash = generate_hash(tables_data)
        data_updated = new_hash != last_tables_hash

        if data_updated:
            last_tables_hash = new_hash
            socketio.emit('tables_updated', {'data': tables_data}, room=azienda.id_azienda)

        return jsonify({"data": tables_data, "updated": data_updated}), 200

    except Exception as e:
        print(f"Error retrieving tables: {e}")
        return jsonify({"error": "An error occurred while fetching tables", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup




@app.route('/tavoli/add', methods=['POST'])
@token_required
def add_table():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        if not data or 'shop' not in data or 'number' not in data:
            return jsonify({"error": "Invalid input. 'shop' and 'number' fields are required."}), 400

        table = Tables(shop=data.get("shop"), number=data.get("number"), status=0, id_azienda=azienda.id_azienda, banco=data.get('banco'), min_places= data.get('min_places'), max_places= data.get('max_places'))        
        db.session.add(table)
        db.session.commit()

        return jsonify({"success": "Table added successfully"}), 200

    except Exception as e:
        print(f"Error adding table: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while adding table", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/tavoli/delete', methods=['DELETE'])
@token_required
def delete_table():
    token = request.headers.get('Authorization')
    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        table_id = data.get('id')
        table_ids = data.get('ids')
        if not table_id and not table_ids:
            return jsonify({"error": "No table ID(s) provided"}), 400

        if table_ids:
            tables = Tables.query.filter(Tables.id.in_(table_ids), Tables.id_azienda == azienda.id_azienda).all()
            if not tables:
                return jsonify({"error": "No tables found with the provided IDs"}), 404
            for table in tables:
                db.session.delete(table)
        else:
            table = Tables.query.filter_by(id=table_id, id_azienda=azienda.id_azienda).first()
            if not table:
                return jsonify({"error": "Table not found"}), 404
            db.session.delete(table)
            db.session.commit()
        return jsonify({"success": "Table(s) deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting table: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting table", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/tavoli/edit", methods=['PATCH'])
@token_required
def update_table():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    table = Tables.query.filter_by(id=data.get("id")).first()

    if not table:
        return jsonify({"error": "Table not found"}), 404

    table.shop = data.get('shop')
    table.number = data.get('number')
    table.banco = data.get('banco')
    table.min_places= data.get('min_places')
    table.max_places= data.get('max_places')
    db.session.commit()
    db.session.remove()
    return jsonify({"success": "success"})

@app.route('/orari', methods=['GET'])
@token_required
def get_schedules():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Query the Schedules associated with the azienda
        schedules = Schedules.query.filter_by(id_azienda=azienda.id_azienda).all()

        if not schedules:
            return jsonify({"message": "No schedules found"}), 404

        # Get all shop data in one pass instead of querying inside the loop
        shop_ids = [schedule.shop for schedule in schedules if schedule.shop]
        shops = Shops.query.filter(Shops.id.in_(shop_ids)).all()

        # Create a dictionary of shops to avoid repeated queries
        shop_dict = {shop.id: {"id": shop.id, "description": shop.descrizione} for shop in shops}

        schedules_list = [
            {
                "id": schedule.id,
                "name": schedule.name,
                "monday": schedule.monday,
                "tuesday": schedule.tuesday,
                "wednesday": schedule.wednesday,
                "thursday": schedule.thursday,
                "friday": schedule.friday,
                "saturday": schedule.saturday,
                "sunday": schedule.sunday,
                "active": schedule.active,
                "shop": shop_dict.get(schedule.shop, None)  # Get the shop info from the shop_dict or None if not found
            }
            for schedule in schedules
        ]

        return jsonify({"data": schedules_list}), 200

    except Exception as e:
        return jsonify({"error": "An error occurred while fetching schedules", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session


@app.route('/orari/add', methods=['POST'])
@token_required
def add_schedule():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    try:
        # Create a new Schedule entry
        schedule = Schedules(
            name=data.get('name'),
            monday=data.get('monday'),
            tuesday=data.get('tuesday'),
            wednesday=data.get('wednesday'),
            thursday=data.get('thursday'),
            friday=data.get('friday'),
            saturday=data.get('saturday'),
            sunday=data.get('sunday'),
            shop=data.get('shop'),
            active=data.get('active', True),  # Default to active if not provided
            id_azienda = azienda.id_azienda
        )
        db.session.add(schedule)  # Add the new schedule
        db.session.commit()  # Commit the changes

        return jsonify({"success": "Schedule added successfully"}), 201  # Return success response

    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"error": "An error occurred while adding schedule", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session

@app.route('/orari/edit', methods=['PATCH'])
@token_required
def update_schedule():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    
    try:
        data = request.json

        
        # Retrieve the schedule by ID
        schedule = Schedules.query.filter_by(id=data.get("id")).first()  # Adjust as per your user model
        
        if not schedule:
            return jsonify({"error": "Schedule not found"}), 404

        # Update the schedule attributes
        schedule.name = data.get('name', schedule.name)
        schedule.monday = data.get('monday', schedule.monday)
        schedule.tuesday = data.get('tuesday', schedule.tuesday)
        schedule.wednesday = data.get('wednesday', schedule.wednesday)
        schedule.thursday = data.get('thursday', schedule.thursday)
        schedule.friday = data.get('friday', schedule.friday)
        schedule.saturday = data.get('saturday', schedule.saturday)
        schedule.sunday = data.get('sunday', schedule.sunday)
        schedule.active = data.get('active', schedule.active)
        schedule.shop = data.get('shop', schedule.shop)

        db.session.commit()  # Commit the changes

        return jsonify({"success": "Schedule updated successfully"}), 200
    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"error": "An error occurred while deleting the schedule(s)", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session

    

@app.route('/orari/delete', methods=['DELETE'])
@token_required
def delete_schedules():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    schedule_id = data.get('id')
    schedule_ids = data.get('ids')

    if not schedule_id and not schedule_ids:
        return jsonify({"error": "No schedule ID(s) provided"}), 400

    try:
        if schedule_ids:
            schedules = Schedules.query.filter(Schedules.id.in_(schedule_ids)).all()
            if not schedules:
                return jsonify({"error": "No schedules found with the provided IDs"}), 404
            for schedule in schedules:
                db.session.delete(schedule)
        else:
            schedule = Schedules.query.filter_by(id=schedule_id).first()
            if not schedule:
                return jsonify({"error": "Schedule not found"}), 404
            db.session.delete(schedule)

        db.session.commit()
        return jsonify({"success": "Schedule(s) deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()  # Rollback the session on error
        return jsonify({"error": "An error occurred while deleting the schedule(s)", "details": str(e)}), 500

    finally:
        db.session.remove()  # Clean up the session


@app.route('/codiva', methods=['GET'])
@token_required
def get_codiva():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        codiva = Codiva.query.filter_by(id_azienda=azienda.id_azienda).all()
        codiva_list = [
            {
                "id": u.id,
                "description": u.description,
                "natura": u.natura if u.natura != "0" else "N/P",
                "aliquota": u.aliquota
            }
            for u in codiva
        ]

        return jsonify({"data": codiva_list}), 200

    except Exception as e:
        print(f"Error retrieving codiva: {e}")
        return jsonify({"error": "An error occurred while fetching codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup

@app.route('/festivita', methods=['GET'])
@token_required
def get_festivita():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        codiva = Festivita.query.filter_by(id_azienda=azienda.id_azienda).all()
        codiva_list = [
            {
                "id": u.id,
                "days": u.days,
                
            }
            for u in codiva
        ]

        return jsonify({"data": codiva_list}), 200

    except Exception as e:
        print(f"Error retrieving codiva: {e}")
        return jsonify({"error": "An error occurred while fetching codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/lavineria/festivita', methods=['GET'])
def lavineria_get_festivita():
    try:    

        codiva = Festivita.query.filter_by(id_azienda=3).all()
        codiva_list = [
            {
                "id": u.id,
                "days": u.days,
                
            }
            for u in codiva
        ]

        return jsonify({"data": codiva_list}), 200

    except Exception as e:
        print(f"Error retrieving codiva: {e}")
        return jsonify({"error": "An error occurred while fetching codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup

@app.route('/festivita/add', methods=['POST'])
@token_required
def add_festivita():
    token = request.headers.get('Authorization')
   
    user, azienda = decode_token_and_get_azienda(token)
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    try:
        data = request.json
        
        codiva = Festivita(
            days=data.get('description'),
            id_azienda = azienda.id_azienda
            
        )
        db.session.add(codiva)
        db.session.commit()
    
        return jsonify({"success": "Codiva added successfully"}), 200
    except Exception as e:
        print(f"Error updating codiva: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup

    



@app.route("/festivita/edit", methods=['PATCH'])
@token_required
def update_festivita():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        codiva = Festivita.query.filter_by(id=data.get("id")).first()

        if not codiva:
            return jsonify({"error": "Codiva not found"}), 404

        codiva.days = data.get('description', codiva.days)
        
        
        db.session.commit()
        return jsonify({"success": "Codiva updated successfully"}), 200

    except Exception as e:
        print(f"Error updating codiva: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/festivita/delete', methods=['DELETE'])
@token_required
def delete_festivita():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json    
        codiva_id = data.get('id')
        codiva_ids = data.get('ids')

        if not codiva_id and not codiva_ids:
            return jsonify({"error": "No codiva ID(s) provided"}), 400

        if codiva_ids:
            codiva_entries = Festivita.query.filter(Festivita.id.in_(codiva_ids), Festivita.id_azienda == azienda.id_azienda).all()
            if not codiva_entries:
                return jsonify({"error": "No codiva found with the provided IDs"}), 404
            for entry in codiva_entries:
                db.session.delete(entry)
        else:
            codiva = Festivita.query.filter_by(id=codiva_id, id_azienda=azienda.id_azienda).first()
            if not codiva:
                return jsonify({"error": "Codiva not found"}), 404
            db.session.delete(codiva)

        db.session.commit()
        return jsonify({"success": "Codiva(s) deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting codiva: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/codiva/add', methods=['POST'])
@token_required
def add_codiva():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        if not data or 'description' not in data or 'aliquota' not in data:
            return jsonify({"error": "Invalid input. 'description' and 'aliquota' fields are required."}), 400

        codiva = Codiva(
            description=data.get('description'),
            aliquota=data.get('aliquota'),
            natura=data.get("natura"),
            id_azienda=azienda.id_azienda
        )
        db.session.add(codiva)
        db.session.commit()
        
        return jsonify({"success": "Codiva added successfully"}), 200

    except Exception as e:
        print(f"Error adding codiva: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while adding codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route("/codiva/edit", methods=['PATCH'])
@token_required
def update_codiva():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        codiva = Codiva.query.filter_by(id=data.get("id")).first()

        if not codiva:
            return jsonify({"error": "Codiva not found"}), 404

        codiva.description = data.get('description', codiva.description)
        codiva.aliquota = data.get('aliquota', codiva.aliquota)
        codiva.natura = data.get('natura', codiva.natura)
        
        db.session.commit()
        return jsonify({"success": "Codiva updated successfully"}), 200

    except Exception as e:
        print(f"Error updating codiva: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while updating codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup


@app.route('/codiva/delete', methods=['DELETE'])
@token_required
def delete_codiva():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json    
        codiva_id = data.get('id')
        codiva_ids = data.get('ids')

        if not codiva_id and not codiva_ids:
            return jsonify({"error": "No codiva ID(s) provided"}), 400

        if codiva_ids:
            codiva_entries = Codiva.query.filter(Codiva.id.in_(codiva_ids), Codiva.id_azienda == azienda.id_azienda).all()
            if not codiva_entries:
                return jsonify({"error": "No codiva found with the provided IDs"}), 404
            for entry in codiva_entries:
                db.session.delete(entry)
        else:
            codiva = Codiva.query.filter_by(id=codiva_id, id_azienda=azienda.id_azienda).first()
            if not codiva:
                return jsonify({"error": "Codiva not found"}), 404
            db.session.delete(codiva)

        db.session.commit()
        return jsonify({"success": "Codiva(s) deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting codiva: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup



def fetch_comande_data(azienda):
    comande = Comande.query.filter_by(status=0, id_azienda=azienda.id_azienda).all()

    comande_data = [
        {
            "id": c.id,
            "cliente": c.customer.denominazione if c.customer.denominazione else f"{c.customer.cognome} {c.customer.nome}",
            "table": c.table,
            "date": c.date.strftime('%d-%m-%Y'),  # Format datetime to string
            "content": c.contenuto,
            "numDoc": c.numeroDoc
        }
        for c in comande
    ]

    db.session.remove()

    return comande_data

last_comande_hash = None

@app.route('/comande', methods=['GET'])
@token_required
def get_comande():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    global last_comande_hash
    comande_data = fetch_comande_data(azienda)
    new_hash = generate_hash(comande_data)
    data_updated = new_hash != last_comande_hash

    if data_updated:
        last_comande_hash = new_hash
        # Emit the update to all connected clients
        socketio.emit('comande_updated', {'data': comande_data}, room=azienda.id_azienda)

    return jsonify({"data": comande_data, "updated": data_updated})

@socketio.on('update_comande')
def handle_update_comande(data):
    token = data.get('token')  # Assuming token is part of the event data
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    comande_data = fetch_comande_data(azienda)
    socketio.emit('comande_updated', {'data': comande_data}, room=azienda.id_azienda)

@app.route('/comande/save', methods=['POST'])
@token_required
def add_comanda():
    token = request.headers.get('Authorization')
    
    # Decode token to validate user and azienda
    user, azienda = decode_token_and_get_azienda(token)
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    try:
        
        data = request.json
        new_content = data.get('articles', [])
        pos = data.get('pos', False)  # Default is False
        customer_value = data.get('customer', {}).get('value', 1)  # Default to 1 if not provided

        # Attempt to find an existing comanda for the same table with status 0
        comanda = Comande.query.filter_by(table=data.get("tableId"), status=0).first()
        
        if comanda:
            existing_content = comanda.contenuto or []
            
            # Create a dictionary to track existing articles by (id, variant)
            existing_articles_dict = {
                (article['id'], article.get('variante', {}).get('value', None)): article
                for article in existing_content
            }

            new_articles = []

            # Process new articles
            for article in new_content:
                article_id = article['id']
                variant_value = article.get('variante', {}).get('value', None)
                key = (article_id, variant_value)

                if key in existing_articles_dict:
                    existing_article = existing_articles_dict[key]
                    # Solo se la quantità è cambiata, aggiorna e aggiungi per la stampa
                    if existing_article['quantity'] != article.get('quantity', 1):
                        existing_article['quantity'] = article.get('quantity', 1)
                        new_articles.append(existing_article)  # Aggiungi solo se c'è una modifica
                else:
                    new_articles.append(article)  # Aggiungi articolo veramente nuovo
               
            # Update comanda content based on 'pos' flag
            if not pos:
                # If pos is False, merge existing articles with new ones
                combined_content = list(existing_articles_dict.values()) + new_articles
                comanda.contenuto = combined_content
            else:
                # If pos is True, replace existing content with new content
                comanda.contenuto = new_content

            # Update comanda details
            comanda.cliente = customer_value
            comanda.status = 0 if customer_value == 1 else 1
            comanda.note = data.get('note', '')

        else:
            # Create a new comanda if none exists
            sezionaleCom = Sezionali.query.filter_by(id_azienda=azienda.id_azienda, documento="com").first()
            if not sezionaleCom:
                return jsonify({"error": "Sezionale not found"}), 404

            numeroCom = Numerazioni.query.filter_by(id_sezionale=sezionaleCom.id).first()
            if not numeroCom:
                return jsonify({"error": "Numerazione not found"}), 404

            comanda = Comande(
                table=data.get("tableId"),
                contenuto=new_content,
                cliente=customer_value,
                status=0,
                note=data.get('note', ''),
                id_azienda=azienda.id_azienda,
                numeroDoc="",
                numeroComanda=numeroCom.numero + 1
            )

            # Increment the document number
            numeroCom.numero += 1
            new_articles = new_content  # All articles are new in this case

        # Save comanda and updated numeration to the database
        db.session.add(comanda)
        db.session.commit()

        # If no new articles to print, return success response
        if not new_articles:
            return jsonify({"message": "No new articles to print"}), 200

        # Group new articles by category for printing
        grouped_new_articles = {}
        for article in new_articles:
            category = article['category']['description']
            printer_record = Categories.query.filter_by(description=category).first()
            printer = printer_record.repartolink.printer if printer_record else 'DefaultPrinter'
            article['printer'] = printer
            
            if category not in grouped_new_articles:
                grouped_new_articles[category] = []
            grouped_new_articles[category].append(article)

        # Prepare data for printing
        italy_timezone = pytz.timezone("Europe/Rome")
        current_utc_time = datetime.utcnow()
        italy_time = current_utc_time.astimezone(italy_timezone)
        formatted_time = italy_time.strftime("%d/%m/%Y %H:%M")
        table = Tables.query.filter_by(id=data.get("tableId")).first()

        new_data = {            
            "table": table.number,
            "corpo": grouped_new_articles,
            "cliente": customer_value,
            "printer_type": "Network",            
            "data": formatted_time,            
            "numdoc": comanda.numeroComanda,
            "carico": False,
            "totale": data.get('total')
        }

        # Emit print command via SocketIO for new articles
        socketio.emit('print_comanda', {'data': new_data}, room=azienda.id_azienda)
        handle_update_tables(azienda)

        return jsonify({"message": "Comanda updated and new articles printed"}), 200
    except Exception as e:
        print(f"Error deleting codiva: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting codiva", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup







    



def update_movimenti_comanda(newData, id_azienda):
    # Flag to check if any 'blocco_giacenze' is True
    any_blocco_giacenze = False

    # First, we check if any item has 'blocco_giacenze' as True
    for category, items in newData['corpo'].items():
        for art in items:
            articolo = Articoli.query.filter_by(id=art['id']).first()
            if articolo and articolo.blocco_giacenze:
                any_blocco_giacenze = True
                break

    # If no items have 'blocco_giacenze' as True, return early without adding Testmag
    if not any_blocco_giacenze:
        return 'No items with blocco_giacenze'

    # If at least one 'blocco_giacenze' is True, proceed to create and add Testmag entry
    testmag = Testmag(
        controparte_id=newData['cliente'],
        numero_doc=newData['numdoc'],
        sezionale="",
        date=newData['data'],
        totale=newData['totale'] if 'totale' in newData else 0,
        iva=newData['iva'] if 'iva' in newData else 0,
        id_azienda=id_azienda,
        carico=newData['carico']  # Determines whether we are adding or subtracting from giacenza
    )
    db.session.add(testmag)
    db.session.commit()

    # Iterate through the categories and items, adding Movmag entries only for items with blocco_giacenze
    for category, items in newData['corpo'].items():
        for art in items:
            articolo = Articoli.query.filter_by(id=art['id']).first()
            
            # Only process items where 'blocco_giacenze' is True
            if articolo and articolo.blocco_giacenze:
                # Safely retrieve 'iva' (it might be a dict or a string)
                iva_id = art['iva']['id'] if isinstance(art['iva'], dict) else art['iva']

                # Safely handle 'variante', which could be None
                variante_id = art['variante']['value'] if art.get('variante') and art['variante'].get('value') else None

                # Create and add Movmag entry
                movmag = Movmag(
                    articolo_id=art['id'],
                    descrizione=art['title'],
                    quantita=art['quantity'],
                    prezzo=art['price'],
                    iva=iva_id,
                    variante_id=variante_id,  # Handling None case for 'variante'
                    giacenza_id=art['giacenzaId'],
                    um=1,
                    testata_id=testmag.id,
                    id_azienda=id_azienda
                )
                db.session.add(movmag)

                # Retrieve the current giacenza and update it
                giacenza = Giacenze.query.filter_by(id=art['giacenzaId']).first()

                # Update giacenza based on the value of 'carico' in newData
                if newData['carico']:
                    giacenza.giacenza += art['quantity']  # Add quantity if carico is True
                else:
                    giacenza.giacenza -= art['quantity']  # Subtract quantity if carico is False

                db.session.commit()

    db.session.remove()

    return 'success'








@app.route('/comande/delete', methods=['DELETE'])
@token_required
def delete_comande():
    token = request.headers.get('Authorization')

    try:
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        data = request.json
        if not data or 'ids' not in data:
            return jsonify({"error": "No comanda ID(s) provided"}), 400

        comanda_ids = data.get("ids")

        # Ensure comanda_ids is a list, even if a single ID is provided
        if isinstance(comanda_ids, int):
            comanda_ids = [comanda_ids]
        
        if not isinstance(comanda_ids, list):
            return jsonify({"error": "Invalid format for comanda IDs"}), 400

        comande_to_delete = Comande.query.filter(Comande.id.in_(comanda_ids)).all()

        if not comande_to_delete:
            return jsonify({"error": "No comanda found with the provided IDs"}), 404

        for comanda in comande_to_delete:
            db.session.delete(comanda)

        db.session.commit()
        return jsonify({"success": "Comanda(s) deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting comanda: {e}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while deleting comanda", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup






def generate_unique_id():
    while True:
        # Generate a unique ID using UUID and hash it to ensure it's within 50 characters
        unique_string = uuid.uuid4().hex
        id_scontrino = hashlib.sha1(unique_string.encode()).hexdigest()[:50]
        
        # Check if the ID already exists in the database
        existing_comanda = Comande.query.filter_by(idScontrino=id_scontrino).first()
        db.session.remove()
        if not existing_comanda:
            return id_scontrino





@app.route('/scontrino/print', methods=['POST'])
@token_required
def print_comanda():
    token = request.headers.get('Authorization')
    
    try:
        # Decode token and get user and azienda
        user, azienda = decode_token_and_get_azienda(token)
        if not user or not azienda:
            return jsonify({"error": "Invalid token or user/azienda not found"}), 401

        # Validate and retrieve JSON data
        data = request.json
        articles = data.get("articles", [])
        table_id = data.get("tableId")
        customer = data.get('customer', {})
        total = data.get('total')
        
        if not total or not table_id:
            return jsonify({"error": "Missing required data: total or tableId"}), 400

        # Process iva and payment method
        total = float(total)
        iva = total - (total / 1.1)
        payment = {0: "Non Pagato", 1: "CONTANTI", 2: "PAGAMENTO ELETTRONICO"}.get(data.get('payment'), "Unknown")
        
        # Generate unique scontrino ID
        id_scontrino = generate_unique_id()

        # Query or create comanda
        comanda = Comande.query.filter_by(table=table_id, status=0).first()
        if comanda:
            comanda.contenuto = articles
            comanda.status = 2
            comanda.iva = iva
            comanda.totale = total
            comanda.pagamento = payment
        else:
            comanda = Comande(
                table=table_id,
                contenuto=articles,
                cliente=customer.get('value', 1) if customer != 1 else 1,
                status=2,
                id_azienda=azienda.id_azienda,
                idScontrino=id_scontrino,
                iva=iva,
                totale=total,
                pagamento=payment
            )
            db.session.add(comanda)

        db.session.commit()

        # Process scontrino data
        scontrino = {
            "corpo": articles,
            "total": total,
            "payment": data.get('payment'),
            "idScontrino": id_scontrino
        }

        # Send to appropriate function based on azienda's Sidae setting
        if azienda.sidae:
            status_code, numero_documento = invio_reale(azienda, scontrino)
        else:
            status_code, numero_documento = invio_test(azienda, scontrino)
        
        if status_code != 200:
            return jsonify({"error": "Failed to send data to the service", "details": numero_documento}), 500

        # Update comanda with numero_documento
        comanda.numeroDoc = numero_documento
        db.session.commit()

        # Retrieve client info
        cliente_name = "Nessun Nome"
        if customer != 1:
            cliente = Clienti.query.filter_by(id=customer.get('value'), id_azienda=azienda.id_azienda).first()
            if cliente:
                cliente_name = cliente.denominazione
        italy_timezone = pytz.timezone("Europe/Rome")
        current_utc_time = datetime.utcnow()
        italy_time = current_utc_time.astimezone(italy_timezone)

        # Format the Italy time
        formatted_time = italy_time.strftime("%d/%m/%Y %H:%M")
        

        # Generate data for the print socket
        new_data = {
            "azienda": {
                "denominazione": f"{azienda.nome_azienda} {azienda.forma_giuridica}" if azienda.nome_azienda else f"{azienda.cognome} {azienda.nome}",
                "indirizzo": azienda.sede_legale,
                "cap": azienda.cap,
                "comune": azienda.citta,
                "provincia": azienda.provincia,
                "partitaiva": azienda.partita_iva,
                "codicefiscale": azienda.codice_fiscale,
                "telefono": azienda.phone,
                "mail": azienda.mail
            },
            "cliente": {"denominazione": cliente_name},
            "corpo": articles,
            "printer_type": "Network",
            "totale": total,
            "iva": iva,
            "data": formatted_time,
            "payment": payment,
            "numdoc": numero_documento if numero_documento else id_scontrino[:14],
            "room":azienda.id_azienda
        }

        socketio.emit('print_scontrino', {'data': new_data}, room=azienda.id_azienda)
        return jsonify({"success": "PDF printed successfully."}), 200

    except ValueError as ve:
        print(f"ValueError: {ve}")
        db.session.rollback()
        return jsonify({"error": "Data format error", "details": str(ve)}), 400

    except Exception as e:
        print(f"Error printing comanda: {e}")
        db.session.rollback()
        return jsonify({"error": "An internal server error occurred", "details": str(e)}), 500

    finally:
        db.session.remove()  # Ensure session cleanup



@app.route('/clienti/add', methods=['POST'])
@token_required
def add_clienti():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    giuridica = bool(data.get('denominazione'))

    try:
          # Ensure we have the app context for session
        cliente = Clienti(
            denominazione=data.get('denominazione'),
            nome=data.get('nome'),
            cognome=data.get("cognome"),
            partitaiva=data.get('partitaiva'),
            codicefiscale=data.get('codicefiscale'),
            indirizzo=data.get('indirizzo'),
            citta=data.get('comune'),
            provincia=data.get('provincia'),
            SDI=data.get('SDI'),
            civico=data.get('civico'),
            nazione=data.get('nazione'),
            giuridica=giuridica,
            telefono=data.get('telefono'),
            email=data.get('email'),
            cellulare=data.get('cellulare'),
            pec=data.get('pec'),
            id_azienda=azienda.id_azienda,
            generico=data.get('generico'),
            news = data.get('news'),
            privacy = data.get('privacy')
        )
        db.session.add(cliente)
        db.session.commit()
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed

    return jsonify({"success": "Client added successfully"})


@app.route('/fornitori/add', methods=['POST'])
@token_required
def add_fornitori():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    giuridica = bool(data.get('denominazione'))
   
    # Ensure we have the app context for session
    fornitore = Fornitori(
        denominazione=data.get('denominazione'),
        nome=data.get('nome'),
        cognome=data.get("cognome"),
        partitaiva=data.get('partitaiva'),
        codicefiscale=data.get('codicefiscale'),
        indirizzo=data.get('indirizzo'),
        comune=data.get('comune'),
        provincia=data.get('provincia'),
        SDI=data.get('SDI'),
        civico=data.get('civico'),
        nazione=data.get('nazione'),
        giuridica=giuridica,
        telefono=data.get('telefono'),
        email=data.get('email'),
        cellulare=data.get('cellulare'),
        pec=data.get('pec'),
        id_azienda=azienda.id_azienda,
        generico = data.get('generico')
    )
    db.session.add(fornitore)
    db.session.commit()
    

    return jsonify({"success": "Supplier added successfully"})


@app.route("/clienti/edit", methods=['PATCH'])
def update_clienti():
    data = request.json
    customer_id = data.get("id")    
    try:       
        cliente = Clienti.query.filter_by(id=customer_id).first()
        if cliente:
            cliente.denominazione = data.get('denominazione', cliente.denominazione)
            cliente.nome = data.get('nome', cliente.nome)
            cliente.cognome = data.get('cognome', cliente.cognome)
            cliente.partitaiva = data.get('partitaiva', cliente.partitaiva)
            cliente.codicefiscale = data.get('codicefiscale', cliente.codicefiscale)
            cliente.indirizzo = data.get('indirizzo', cliente.indirizzo)
            cliente.civico = data.get('civico', cliente.civico)
            cliente.cap = data.get('cap', cliente.cap)
            cliente.citta = data.get('comune', cliente.citta)
            cliente.provincia = data.get('provincia', cliente.provincia)
            cliente.nazione = data.get('nazione', cliente.nazione)
            cliente.SDI = data.get('SDI', cliente.SDI)
            cliente.giuridica = data.get('giuridica', cliente.giuridica)
            cliente.email = data.get('email', cliente.email)
            cliente.pec = data.get('pec', cliente.pec)
            cliente.telefono = data.get('telefono', cliente.telefono)
            cliente.cellulare = data.get('cellulare', cliente.cellulare)
            cliente.generico = data.get('generico', cliente.generico)
            cliente.news = data.get('news', cliente.news)
            cliente.privacy = data.get('privacy', cliente.privacy)
            db.session.commit()
        else:
            return jsonify({"error": "Customer not found"}), 404
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed

    return jsonify({"success": "Customer updated successfully"})


@app.route('/clienti/delete', methods=['DELETE'])
@token_required
def delete_customer():
    data = request.json
    customer_id = data.get('id')
    customers_ids = data.get('ids')

    if not customer_id and not customers_ids:
        return jsonify({"error": "No customer ID(s) provided"}), 400

    try:
         # Ensure we have the app context for session
        if customers_ids:
            customers = Clienti.query.filter(Clienti.id.in_(customers_ids)).all()
            if not customers:
                return jsonify({"error": "No customer found with the provided IDs"}), 404
            for customer in customers:
                db.session.delete(customer)
        else:
            customer = Clienti.query.filter_by(id=customer_id).first()
            if not customer:
                return jsonify({"error": "Customer not found"}), 404
            db.session.delete(customer)

        db.session.commit()
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed

    return jsonify({"success": "Customer(s) deleted successfully"}), 200

@app.route('/fornitori/delete', methods=['DELETE'])
@token_required
def delete_supplier():
    data = request.json    
    supplier_id = data.get('id')
    suppliers_ids = data.get('ids')
    # Ensure we have the app context for session
    try:
        if suppliers_ids:
            suppliers = Fornitori.query.filter(Fornitori.id.in_(suppliers_ids)).all()
            if not suppliers:
                return jsonify({"error": "No supplier found with the provided IDs"}), 404
            for supplier in suppliers:
                db.session.delete(supplier)
        else:
            supplier = Fornitori.query.filter_by(id=supplier_id).first()
            if not supplier:
                return jsonify({"error": "Supplier not found"}), 404
            db.session.delete(supplier)

        db.session.commit()
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed    

    return jsonify({"success": "Supplier(s) deleted successfully"}), 200


@app.route("/fornitori/edit", methods=['PATCH'])
@token_required
def update_fornitori():
    data = request.json
    fornitore_id = data.get("id")
    try:        
        fornitore = Fornitori.query.filter_by(id=fornitore_id).first()
        if fornitore:
            fornitore.denominazione = data.get('denominazione', fornitore.denominazione)
            fornitore.nome = data.get('nome', fornitore.nome)
            fornitore.cognome = data.get('cognome', fornitore.cognome)
            fornitore.partitaiva = data.get('partitaiva', fornitore.partitaiva)
            fornitore.codicefiscale = data.get('codicefiscale', fornitore.codicefiscale)
            fornitore.indirizzo = data.get('indirizzo', fornitore.indirizzo)
            fornitore.civico = data.get('civico', fornitore.civico)
            fornitore.cap = data.get('cap', fornitore.cap)
            fornitore.citta = data.get('comune', fornitore.citta)
            fornitore.provincia = data.get('provincia', fornitore.provincia)
            fornitore.nazione = data.get('nazione', fornitore.nazione)
            fornitore.SDI = data.get('SDI', fornitore.SDI)
            fornitore.giuridica = data.get('giuridica', fornitore.giuridica)
            fornitore.email = data.get('email', fornitore.email)
            fornitore.pec = data.get('pec', fornitore.pec)
            fornitore.telefono = data.get('telefono', fornitore.telefono)
            fornitore.cellulare = data.get('cellulare', fornitore.cellulare)
            fornitore.generico = data.get('generico', fornitore.generico)
            db.session.commit()
        else:
            return jsonify({"error": "Supplier not found"}), 404
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed

    return jsonify({"success": "Supplier updated successfully"})


@app.route('/magazzino/movimenti', methods=['GET'])
@token_required
def movimenti_magazzino():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    try:      
        testmags = Testmag.query.filter_by(id_azienda=azienda.id_azienda).all()
        testmag_list = []

        for test in testmags:
            if test.carico:
                controparte = Fornitori.query.filter_by(id= test.controparte_id).first()
            else:
                controparte = Clienti.query.filter_by(id= test.controparte_id).first()

            movmags = Movmag.query.filter_by(testata_id=test.id).all()
            testmag_list.append({
                "id": test.id,
                "fornitore": controparte.denominazione if controparte.denominazione != "" else controparte.cognome + ' ' + controparte.nome,
                "date": test.date,
                "numero": test.numero_doc + "/" + test.sezionale,
                "totale": test.totale,
                "iva": test.iva,
                "corpo": [{"id": movmag.id, "articolo_id": movmag.articolo_id, "quantita": movmag.quantita, "prezzo": movmag.prezzo, "iva": movmag.iva} for movmag in movmags]
            })


        return jsonify({"data": testmag_list})
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed


@app.route("/movimenti/magazzino/add", methods=['POST'])
@token_required
def add_movimento_magazzino():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    print(data)

    try:  
        testmag = Testmag.query.filter_by(date=data.get("date"), numero_doc=data.get("numero"), sezionale=data.get('sezionale')).first()

        if testmag is None:
            testmag = Testmag(
                fornitore_id=data.get("fornitore")['value'],
                numero_doc=data.get('numero'),
                sezionale=data.get('sezionale'),
                date=data.get('data'),
                totale=data.get('totale'),
                iva=data.get('iva')
            )
            db.session.add(testmag)
            db.session.flush()  # Ensure the ID is available before adding Movmag

            for articolo in data.get('corpo'):
                art = Articoli.query.filter_by(id=articolo['articolo']).first()
                movmag = Movmag(
                    id_azienda=azienda.id_azienda,
                    articolo_id=articolo['articolo'],
                    quantita=articolo['qt'],
                    um=art.um,
                    prezzo=articolo['prezzo'],
                    iva=articolo['codiva'],
                    descrizione=art.description,
                    testata_id=testmag.id
                )
                db.session.add(movmag)
            db.session.commit()
        else:
            return jsonify({"error": "Document already exists"}), 400
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed

    return jsonify({"success": "Movement added successfully"})


@app.route("/movimenti/magazzino/delete", methods=['DELETE'])
@token_required
def delete_movimenti_magazzino():
    data = request.json    
    testata_ids = data.get('data', {}).get('ids')  # Extracting ids from the nested data

    if not testata_ids:
        return jsonify({"error": "No document ID(s) provided"}), 400

    try:        
        testate = Testmag.query.filter(Testmag.id.in_(testata_ids)).all()
        if not testate:
            return jsonify({"error": "No documents found with the provided IDs"}), 404

        for testata in testate:
            movimenti = Movmag.query.filter_by(testata_id=testata.id).all()
            for movimento in movimenti:
                db.session.delete(movimento)
            db.session.delete(testata)

        db.session.commit()
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure the session is removed

    return jsonify({"success": "Document(s) and associated movements deleted successfully"}), 200







@app.route("/sidae/add/utenza", methods=['POST', 'GET'])
def add_sidae_utenza():
    try:        
        azienda = Azienda.query.filter_by(id_azienda=2).first()
        if azienda:
            utenza_inserimento(azienda)
            return "success"
        else:
            return jsonify({"error": "Azienda not found"}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()

@app.route("/sidae/abilita/utenza", methods=['POST', 'GET'])
def abilita_sidae_utenza():
    try:        
        azienda = Azienda.query.filter_by(id_azienda=2).first()
        if azienda:
            utenza_abilita(azienda)
            return "success"
        else:
            return jsonify({"error": "Azienda not found"}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()

@app.route("/sidae/disabilita/utenza", methods=['POST', 'GET'])
def disabilita_sidae_utenza():
    try:        
        azienda = Azienda.query.filter_by(id_azienda=2).first()
        if azienda:
            utenza_disabilita(azienda)
            return "success"
        else:
            db.session.rollback()
            return jsonify({"error": "Azienda not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()


@app.route("/sidae/int/utenza", methods=['POST', 'GET'])
def edit_sidae_utenza():
    try:        
        azienda = Azienda.query.filter_by(id_azienda=2).first()
        if azienda:
            print(azienda.utenza_sidae)
            utenza_interrogazione(azienda)
            return "success"
        else:
            return jsonify({"error": "Azienda not found"}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()


@app.route("/pagamenti", methods=['GET'])
@token_required
def pagamenti():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        pagamenti = Pagamenti.query.filter_by(id_azienda=azienda.id_azienda).all()
        pagamenti_list = [
            {
                "id": b.id,
                "description": b.description,
                "tipo": b.tipo,
                "rate": b.rate,
                "banca": {"id": b.banca, "iban": b.banca_col.iban} if b.banca != 0 else {"id": b.banca, "iban": ""},
                "condizioni": b.condizioni
            } for b in pagamenti
        ]
        print(pagamenti_list)
        return jsonify({"data": pagamenti_list})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()
    



@app.route("/sezionali", methods=['GET'])
@token_required
def get_sezionali():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        sezionali = Sezionali.query.filter_by(id_azienda=azienda.id_azienda).all()
        sezionale_list = []

        for cat in sezionali:
            numero = Numerazioni.query.filter_by(id_sezionale=cat.id).first()
            numero = numero.numero if numero else "N/A"
            d = {
                "id": cat.id,
                "description": cat.descrizione,
                "numero": numero,
                "documento" : cat.documento
            }
            sezionale_list.append(d)
        return jsonify({"data": sezionale_list})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()


@app.route('/sezionali/add', methods=['POST'])
@token_required
def add_sezionale():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json

    try:        
        sezionale = Sezionali.query.filter_by(descrizione=data.get("description"), id_azienda=azienda.id_azienda, documento = data.get('documento')).first()
        if sezionale:
            return jsonify({"error": "Il documento esiste già"}), 400

        sezionale = Sezionali(descrizione=data.get("description"), id_azienda=azienda.id_azienda, documento = data.get('documento'))
        db.session.add(sezionale)
        db.session.flush()
        numerazione = Numerazioni(id_sezionale=sezionale.id, numero=data.get("numero"), id_azienda=azienda.id_azienda)
        db.session.add(numerazione)
        db.session.commit()
        return jsonify({"success": "success"})
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed


@app.route('/sezionali/delete', methods=['DELETE'])
@token_required
def delete_sezionale():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    sezionale_ids = data.get('ids')  # Extracting ids from the request data

    if not sezionale_ids:
        return jsonify({"error": "No Sezionale ID(s) provided"}), 400

    try:        
        sezionali = Sezionali.query.filter(Sezionali.id.in_(sezionale_ids)).all()
        if not sezionali:
            return jsonify({"error": "No Sezionali found with the provided IDs"}), 404

        for sezionale in sezionali:
            numerazioni = Numerazioni.query.filter_by(id_sezionale=sezionale.id).all()
            for numerazione in numerazioni:
                db.session.delete(numerazione)
            db.session.delete(sezionale)

        db.session.commit()
        return jsonify({"success": "Sezionali and associated Numerazioni deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed


@app.route('/sezionali/edit', methods=['PATCH'])
@token_required
def edit_sezionale():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    try:        
        sezionale = Sezionali.query.filter_by(id=data.get("id")).first()
        if not sezionale:
            return jsonify({"error": "Sezionale not found"}), 404

        sezionale.descrizione = data.get('description')
        sezionale.documento = data.get('documento')
        db.session.commit()

        numerazione = Numerazioni.query.filter_by(id_sezionale=sezionale.id).first()
        if not numerazione:
            return jsonify({"error": "Numerazione not found"}), 404

        numerazione.numero = data.get('numero')
        db.session.commit()
        return jsonify({"success": 'success'})
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed


@app.route("/pagamenti/add", methods=['POST'])
@token_required
def pagamenti_add():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    try:        
        if not data:
            return jsonify({"error": "No data provided"}), 400

        pagamento = Pagamenti(
            description=data.get('description'),
            tipo=data.get("tipo")['value'],
            rate=data.get('rate'),
            banca=data.get('banca')['value'] if data.get('banca') else 2,
            id_azienda=azienda.id_azienda,
            condizioni="TP02"
        )

        db.session.add(pagamento)
        db.session.commit()
        return jsonify({"success": 'success'})
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed


@app.route("/banche", methods=['GET'])
@token_required
def banche():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        banche = Banche.query.filter_by(id_azienda=azienda.id_azienda).all()
        banche_list = [
            {"id": b.id, "description": b.description, "IBAN": b.iban, "ABI": b.abi, "CAB": b.cab}
            for b in banche
        ]
        return jsonify({"data": banche_list})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()


@app.route("/banche/add", methods=['POST'])
@token_required
def banche_add():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    try:        
        if not data:
            return jsonify({"error": "No data provided"}), 400

        banca = Banche(
            description=data.get('description'),
            iban=data.get("IBAN"),
            abi=data.get('ABI'),
            cab=data.get('CAB'),
            id_azienda=azienda.id_azienda
        )

        db.session.add(banca)
        db.session.commit()
        return jsonify({"success": 'success'})
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed


@app.route("/doceasy/api/fattureattive/<int:year>", methods=['POST', 'GET'])
@token_required
def doceasy_attive(year):
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        azienda = Azienda.query.filter_by(id_azienda=azienda.id_azienda).first()
        if not azienda:
            return jsonify({"error": "Azienda not found"}), 404

        response = active_invoices(
            azienda.partita_iva,
            azienda.codice_fiscale,
            azienda.api_key_doceasy,
            azienda.api_secret_doceasy
        )
        invoices_list_str = response.content.decode('utf-8')
        invoices_list = json.loads(invoices_list_str)

        # Filter invoices by year if not 9999
        if year != 9999:
            invoices_list = [invoice for invoice in invoices_list if invoice['Data'].startswith(str(year))]

        # Sort invoices by date in descending order
        invoices_list.sort(key=lambda invoice: invoice['Data'], reverse=True)

        return jsonify({"data": invoices_list})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()

@app.route("/doceasy/api/fatturepassive/<int:year>", methods=['POST', 'GET'])
@token_required
def doceasy_passive(year):
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        azienda = Azienda.query.filter_by(id_azienda=azienda.id_azienda).first()
        if not azienda:
            return jsonify({"error": "Azienda not found"}), 404

        response = passive_invoices(
            azienda.partita_iva,
            azienda.codice_fiscale,
            azienda.api_key_doceasy,
            azienda.api_secret_doceasy
        )
        invoices_list_str = response.content.decode('utf-8')
        invoices_list = json.loads(invoices_list_str)

        # Filter invoices by year if not 9999
        if year != 9999:
            invoices_list = [invoice for invoice in invoices_list if invoice['Data'].startswith(str(year))]

        # Sort invoices by date in descending order
        invoices_list.sort(key=lambda invoice: invoice['Data'], reverse=True)

        return jsonify({"data": invoices_list})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()



@app.route("/doceasy/api/fatturavendita/new", methods=['POST'])
@token_required
def doceasy_new_attiva():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:        
        fattura = Fatture(
            id_azienda=azienda.id_azienda,
            inviato=False,
            cliente=data.get('cliente')['value'],
            Doceasy=1,
            numero=data.get('numero'),
            sezionale=data.get('sezionale'),
            pagamento=data.get("pagamento"),
            corpo=data.get('corpo'),
            date=data.get("data"),
            totale=data.get('totale')
        )
        db.session.add(fattura)
        db.session.commit()

        filename = f"IT{azienda.partita_iva}_{fattura.fileId}.xml"
        sezionale = Numerazioni.query.filter_by(id_sezionale=data.get('sezionale')['value']).first()
        if not sezionale:
            return jsonify({"error": "Sezionale not found"}), 404

        sezionale.numero += 1
        db.session.commit()

        fattura_id_response = upload_doceasy(azienda, data.get('xml'), filename)
        if fattura_id_response.status_code != 200:
            return jsonify({"error": "Failed to upload to Doceasy"}), 500

        fattura_id = fattura_id_response.content.decode('utf-8')
        fattura = Fatture.query.filter_by(id=fattura.id).first()
        if not fattura:
            return jsonify({"error": "Fattura not found"}), 404

        fattura.Doceasy = fattura_id
        db.session.commit()

        return jsonify({"data": "success"})
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed


@app.route("/doceasy/api/fattureattive/elimina/<int:id>", methods=['DELETE'])
@token_required
def elimina_fattura(id):
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        id_to_delete = str(id)  # Convert ID to string if needed

        # Call delete_doceasy if needed
        delete_doceasy(azienda, id_to_delete)

        # Fetch and delete the record
        fattura = Fatture.query.filter(Fatture.Doceasy.like(f"%{id_to_delete}%")).first()
        if fattura:
            db.session.delete(fattura)
            db.session.commit()
            return 'success'
        else:
            return 'Fattura not found', 404
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed


@app.route("/doceasy/api/fatturavendita/edit", methods=['POST'])
@token_required
def doceasy_edit_attiva():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:        
        id_to_edit = data.get('id')  # ID to identify the record

        # Call delete_doceasy if needed
        delete_doceasy(azienda, id_to_edit)

        # Fetch and delete the existing record
        fattura = Fatture.query.filter(Fatture.Doceasy.like(f"%{id_to_edit}%")).first()
        if fattura:
            db.session.delete(fattura)
            db.session.commit()

        # Add the updated record
        fattura = Fatture(
            id_azienda=azienda.id_azienda,
            inviato=False,
            cliente=data.get('cliente')['value'],
            Doceasy=1,
            numero=data.get('numero'),
            sezionale=data.get('sezionale'),
            pagamento=data.get("pagamento"),
            corpo=data.get('corpo'),
            date=data.get("data"),
            totale=data.get('totale')
        )
        db.session.add(fattura)
        db.session.commit()

        filename = f"IT{azienda.partita_iva}_{fattura.fileId}.xml"
        sezionale = Numerazioni.query.filter_by(id_sezionale=data.get('sezionale')['value']).first()
        if not sezionale:
            return jsonify({"error": "Sezionale not found"}), 404

        sezionale.numero += 1
        db.session.commit()

        fattura_id_response = upload_doceasy(azienda, data.get('xml'), filename)
        if fattura_id_response.status_code != 200:
            return jsonify({"error": "Failed to upload to Doceasy"}), 500

        fattura_id = fattura_id_response.content.decode('utf-8')
        fattura = Fatture.query.filter_by(id=fattura.id).first()
        if not fattura:
            return jsonify({"error": "Fattura not found"}), 404

        fattura.Doceasy = fattura_id
        db.session.commit()

        return jsonify({"data": "success"})
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()  # Ensure session is removed



    
    

@app.route("/doceasy/api/fattureattive/invia/<int:id>", methods=['GET'])
@token_required
def invia_fattura(id):
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        invia_doceasy(azienda, id)
        return 'success'
    except Exception as e:
        return jsonify({"error": str(e)}), 500





@app.route("/doceasy/api/fattureattive/anteprima/<int:id>", methods=['GET'])
@token_required
def anteprima_fattura(id):
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:        
        # Render XML content
        xml_content = render_doceasy(azienda, id)

        # Ensure the content is correctly returned as a string
        if not isinstance(xml_content, str):
            xml_content = xml_content.decode('utf-8')

        # Load XSL file from the static directory
        xsl_filename = "FoglioStileAssoSoftware.xsl"
        xsl_filepath = os.path.join(app.static_folder, xsl_filename)

        if not os.path.exists(xsl_filepath):
            return jsonify({"error": "XSL file not found"}), 404

        with open(xsl_filepath, 'r', encoding='utf-8') as file:
            xsl_content = file.read()

        # Return XML and XSL content as JSON
        return jsonify({
            "xmlString": xml_content,
            "xsl": xsl_content
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()


@app.route("/doceasy/api/fatturepassive/anteprima/<int:id>", methods=['GET'])
@token_required
def anteprima_fattura_passiva(id):
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    # Render XML content
    xml_content = render_doceasy_passive(azienda, id)

    # Check if the content is in P7M format
    with tempfile.NamedTemporaryFile(delete=False, suffix='.p7m') as temp_p7m_file:
        temp_p7m_file.write(xml_content)
        temp_p7m_file_path = temp_p7m_file.name

    # Attempt to check if it's a signed P7M file
    if is_p7m_file_signed(temp_p7m_file_path):
        # Create a temporary file for the output
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xml') as temp_output_file:
            output_file = temp_output_file.name  # Get the name of the temporary file

        # Remove signature to extract the XML content
        success = remove_signature_from_p7m_file(temp_p7m_file_path, output_file)

        if not success:
            return jsonify({"error": "Failed to extract XML from P7M file."}), 500

        # Read the extracted XML content from the output file
        with open(output_file, 'rb') as file:
            extracted_xml_content = file.read()

        # Decode the content
        xml_content = extracted_xml_content.decode('utf-8')  # Decode from bytes to string

    else:
        # If the content is not P7M, ensure it is a string
        if isinstance(xml_content, bytes):
            xml_content = xml_content.decode('utf-8', errors='replace')  # Use 'replace' to handle invalid bytes gracefully

    # Load XSL file from the static directory
    xsl_filename = "FoglioStileAssoSoftware.xsl"
    xsl_filepath = os.path.join(app.static_folder, xsl_filename)

    if not os.path.exists(xsl_filepath):
        return jsonify({"error": "XSL file not found"}), 404

    with open(xsl_filepath, 'r', encoding='utf-8') as file:
        xsl_content = file.read()

    # Return XML and XSL content as JSON
    return jsonify({
        "xmlString": xml_content,
        "xsl": xsl_content
    })

@app.route("/fattura/<int:id>", methods=['GET'])
@token_required
def get_fattura_edit(id):
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)

    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        
        fattura = Fatture.query.filter(Fatture.Doceasy.like(f"%{id}%")).first()
        if not fattura:
            return jsonify({"error": "Fattura not found"}), 404

        cliente = Clienti.query.filter_by(id=fattura.cliente).first()
        if not cliente:
            return jsonify({"error": "Cliente not found"}), 404

        cliente_data = {
            "value": cliente.id,
            "label": cliente.denominazione,
            "nome": cliente.nome,
            "cognome": cliente.cognome,
            "partitaiva": cliente.partitaiva,
            "codicefiscale": cliente.codicefiscale,
            "indirizzo": cliente.indirizzo,
            "civico": cliente.civico,
            "comune": cliente.citta,
            "provincia": cliente.provincia,
            "nazione": cliente.nazione,
            "SDI": cliente.SDI,
            "giuridica": cliente.giuridica,
            "email": cliente.email,
            "pec": cliente.pec,
            "telefono": cliente.telefono,
            "cellulare": cliente.cellulare,
            "cap": cliente.cap
        }

        return jsonify(data={
            "cliente": cliente_data,
            "sezionale": fattura.sezionale,
            "numero": fattura.numero,
            "corpo": fattura.corpo,
            "totale": fattura.totale,
            "date": fattura.date,
            "pagamento": fattura.pagamento
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()




@app.route('/lavineria/tables/<int:id>/<int:people>', methods=['GET'])
def lavineria_tables(id, people):
    try:
        if id == 1:
            id = 4
        elif id == 2:
            id = 7
        else:
            id = id        
        tables = Tables.query.filter_by(shop=id, id_azienda = 3).all()
        if not tables:
            return jsonify(data={}, message="No tables found for the given shop."), 200

        filtered_tables = {
            f'table-{table.number}': {
                "min": table.min_places,
                "max": table.max_places,
                'id': table.id,
                'number': table.number
            } for table in tables if table.min_places is not None and table.max_places is not None and table.min_places <= people <= table.max_places
        }

        return jsonify(data=filtered_tables), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify(error="Internal Server Error", message=str(e)), 500
    finally:
        db.session.remove()



@app.route('/lavineria/api/turns/data', methods=['POST'])
def api_la_vineria_turns():
    try:
        # Get selected date from request form data
        date_str = request.form.get("selectedDate")
        if not date_str:
            return jsonify({"error": "Selected date is missing"}), 400

        received_date = datetime.strptime(date_str, "%d/%m/%Y")
        formatted_date = received_date.strftime("%Y-%m-%d")
        day_of_week = received_date.weekday()

        # Get table ID and shop ID from request form data
        table_id = request.form.get("table")
        shop_id = request.form.get('shop')

        if not table_id or not shop_id:
            return jsonify({"error": "Table or shop ID is missing"}), 400

        # Map shop IDs
        shop_id = int(shop_id)
        if shop_id == 1:
            shop_id = 4
        elif shop_id == 2:
            shop_id = 7

        # Fetch table info
        table_info = Tables.query.filter_by(number=table_id, shop=shop_id).first()
        if not table_info:
            return jsonify({"error": "Table not found"}), 404

        # Fetch active schedule for the shop
        active_schedule = Schedules.query.filter_by(active=True, shop=table_info.shop).first()
        if not active_schedule:
            return jsonify({"error": "No active schedule found for the shop"}), 404

        # Map weekday to JSON column name
        day_attributes = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        day_attribute = day_attributes[day_of_week]

        # Get turns for the selected day
        day_turns = getattr(active_schedule, day_attribute, [])

        # Fetch reservations for the selected date and table
        reservations = Reservation.query.filter_by(date=formatted_date, table=table_info.id, id_azienda = 3).all()
        print(reservations)

        # Create dictionary for turns not in reservations
        turns_not_in_reservations = {}

        for turn in day_turns:
            turns_id = Turns.query.filter_by(id=turn).first()
            if not turns_id:
                continue  # Skip if turn not found

            turn_str = str(turns_id.description)

            # Check if this turn is already reserved
            turn_not_in_reservation = all(reservation.turn != turns_id.id for reservation in reservations)

            if turn_not_in_reservation:
                # Add turn details to the response dictionary
                turns_not_in_reservations[turn] = {
                    "turn_id": turn,
                    "turn_description": turn_str[:5],
                    "table_min": table_info.min_places,
                    "table_max": table_info.max_places
                }

        # Return the available turns as JSON response
        return jsonify(turns_not_in_reservations)
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()


@app.route("/lavineria/create-checkout-session", methods=['POST'])
def create_checkout_session():
    try:
        stripe.api_key = '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'
        customer_email = request.json.get('customer_email')
        customer_name = request.json.get('customer_name')
        customer_surname = request.json.get('customer_surname')  
        customer_phone = request.json.get('customer_phone')
        customer_news = request.json.get('customer_news')
        customer_privacy = request.json.get('customer_privacy')
        customer_table = request.json.get('customer_table')
        customer_date = request.json.get('customer_date')
        customer_turn = request.json.get('customer_turn')
        customer_people = request.json.get('customer_people')
        customer_payment = request.json.get('payment_method')
        customer_note = request.json.get('customer_note')
        if not customer_email:
            return jsonify({'error': 'Customer email is missing'}), 400
        customer = None
        
        try:
            customer = stripe.Customer.create(
                email=customer_email,
                name=customer_name + " " + customer_surname,
                phone=customer_phone,
            )
        except stripe.error.InvalidRequestError as e:
            pass
        impostazioni = Settings.query.first()
        importo = impostazioni.importo * 100 * int(request.json.get('customer_people'))
        
            
        # Create a Payment Intent
        payment_intent = stripe.PaymentIntent.create(
            amount=int(importo),  # Amount in cents
            currency='eur',
            payment_method_types=['card'],
            customer=customer.id if customer else None,
            description='Cauzione la Vineria di Montepulciano',
        )

        # Create a Checkout Session
        success_url = 'https://lavineriadimontepulciano-db83ac4548ab.herokuapp.com/order/success?session_id={CHECKOUT_SESSION_ID}&payment_intent_id='+ payment_intent.id
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='setup',
            customer=customer.id if customer else None,  
            success_url=success_url,
            cancel_url='https://lavineriadimontepulciano-db83ac4548ab.herokuapp.com',
        )

        # Save customer information in your database
        if customer:
            create_db_customer(
                customer.id,
                customer_name,
                customer_surname,
                customer_phone,
                customer_news,
                customer_privacy,
                customer_email,
                customer_table,
                customer_date,
                customer_turn,
                customer_people,
                customer_payment,
                payment_intent.id, 
                customer_note  # Pass Payment Intent ID to the database function
            )

        # Return the Session ID and Payment Intent ID to the client
        return jsonify({'sessionId': session.id, 'paymentIntentId': payment_intent.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()



def create_db_customer(code, name, surname, phone, news, privacy, mail, customer_table, customer_date, customer_turn, customer_people, customer_payment, payment_intent_id, customer_note):
    try:
        if news == 'on':
            news = True
        else:
            news = False
        if privacy == 'on':
            privacy = True
        else:
            privacy = False
        customer_date = datetime.strptime(customer_date, '%d/%m/%Y')
        customer = Clienti.query.filter_by(email = mail, id_azienda = 3).first()
        if not customer:
            customer = Clienti(
                
                nome=name,
                cognome=surname,
                news=news,
                privacy=privacy,
                email=mail,
                telefono=phone
            )
            db.session.add(customer)
            db.session.flush()

        table = Tables.query.filter_by(number=customer_table, id_azienda =3).first()
        turn = Turns.query.filter_by(id=customer_turn).first()

        reservation = Reservation(
            customer_id=customer.id,
            customer_payment = customer_payment,
            date=customer_date.date(),
            turn=turn.id,
            shop=table.shop,
            table=table.id,
            people=customer_people,
            note = customer_note,
            reservation_validated=False,
            charged=False,
            payment_id=payment_intent_id,  # Save Payment Intent ID here
            removed = False,
            locale= False,
            id_azienda = 3,
            time = turn.description[:5]
        )
        db.session.add(reservation)
        db.session.commit()
        return 'success'
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()




@app.route("/lavineria/send-confirm-email/<payment_id>", methods=['GET'])
def send_confirm_email(payment_id):    
    # Fetch the reservation based on the payment_id
    try:
        reservation = Reservation.query.filter_by(payment_id=payment_id).first()
        if not reservation:
            return jsonify({"error": "Reservation not found!"}), 404
        
        # Retrieve the email account to be used for sending the confirmation email
        account = Settings.query.filter_by(mail='lavineriadimontepulciano@gmail.com').first()
        if not account:
            return jsonify({"error": "Email account not found!"}), 404

        # Set the email account credentials for this request
        app.config['MAIL_USERNAME'] = account.mail
        app.config['MAIL_PASSWORD'] = account.password

        # Render the HTML body for the email
        html_body = render_template('email_template.html', customer=reservation.customer, reservation=reservation)

        # Create the email message
        msg = Message(subject='Prenotazione Confermata',
                        sender=account.mail,
                        recipients=[reservation.customer.email])
        msg.html = html_body
        
        # Send the email
        mail.send(msg)

        return jsonify({"message": "Confirmation email sent successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()



# Utility function to calculate revenues based on a specific time frame and optional payment method
def calculate_revenue(time_filter, payment_method=None):
    """
    A utility function that calculates revenue based on a specific time frame and optional payment method.
    :param time_filter: A SQLAlchemy filter for the date
    :param payment_method: Payment method to filter (e.g., 'CONTANTI' for cash payments), or None for all payments
    :return: The total revenue for the time frame
    """
    query = db.session.query(func.sum(Comande.totale)).filter(time_filter, Comande.annullato == False)
    if payment_method:
        query = query.filter(Comande.pagamento == payment_method)
    revenue = query.scalar()
    return revenue if revenue else 0

# Utility function to calculate percentage change
def calculate_percentage_change(current, previous):
    """
    Calculate the percentage change between current and previous revenue.
    :param current: Current period's revenue
    :param previous: Previous period's revenue
    :return: Percentage change as a string with 2 decimal places
    """
    if previous == 0:
        return "N/A"  # Avoid division by zero, could show as "N/A" or 100% if you prefer
    return f"{((current - previous) / previous) * 100:.2f} %"


@app.route('/api/widgets/<date>', methods=['GET'])
def get_widgets(date):
    # Parse the date and set timezone
        # Parse the date without timezone, using only the year-month-day format
    parsed_date = datetime.strptime(date, '%Y-%m-%d')

    # Localize to Italian timezone
    italy_tz = pytz.timezone('Europe/Rome')
    localized_date = italy_tz.localize(parsed_date)

    # Now check if the localized time is before 5 AM, shift to 5 AM of the same day if needed
    if localized_date.hour < 5:
        # Shift to 5 AM of the same day
        today = localized_date.replace(hour=5, minute=0, second=0, microsecond=0)
    else:
        # Otherwise, keep the date as is, but set the time to 5 AM of that day
        today = localized_date.replace(hour=5, minute=0, second=0, microsecond=0)

    # Retrieve user and azienda from token
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401

    try:
        # Determine 5 AM start time for today, week, and month
        if today.hour < 5:
            start_of_day = (today - timedelta(days=1)).replace(hour=5, minute=0, second=0, microsecond=0)
        else:
            start_of_day = today.replace(hour=5, minute=0, second=0, microsecond=0)

        # Define the start of the week and month at 5 AM
        start_of_week = (start_of_day - timedelta(days=start_of_day.weekday())).replace(hour=5)
        start_of_month = today.replace(day=1, hour=5, minute=0, second=0, microsecond=0)

        # Calculate previous periods from the same 5 AM boundary
        previous_day = start_of_day - timedelta(days=1)
        previous_week = start_of_week - timedelta(weeks=1)
        previous_month = (start_of_month - timedelta(days=1)).replace(day=1, hour=5, minute=0, second=0, microsecond=0)

        # Set filtering criteria
        filter_criteria = (
            (Comande.pagamento != "Non Pagato") &
            (Comande.status == 2) &
            (Comande.id_azienda == azienda.id_azienda)

        )

        # Calculate current and previous revenues with the additional filter
        daily_revenue = calculate_revenue((Comande.date >= start_of_day) & (Comande.date < start_of_day + timedelta(days=1)) & filter_criteria)

        # Daily cash revenue with time boundaries and cash payment method
        daily_cash_revenue = calculate_revenue(
            (Comande.date >= start_of_day) &
            (Comande.date < start_of_day + timedelta(days=1)) &
            (Comande.pagamento != "Non Pagato") &
            (Comande.status == 2) &
            (Comande.id_azienda == azienda.id_azienda),
            payment_method='CONTANTI'
        )

        
        previous_day_revenue = calculate_revenue((Comande.date >= previous_day) & filter_criteria)
        previous_day_cash_revenue = calculate_revenue((Comande.date >= previous_day) & filter_criteria, payment_method='CONTANTI')

        weekly_revenue = calculate_revenue((Comande.date >= start_of_week) & filter_criteria)
        weekly_cash_revenue = calculate_revenue((Comande.date >= start_of_week) & filter_criteria, payment_method='CONTANTI')
        
        previous_week_revenue = calculate_revenue((Comande.date >= previous_week) & filter_criteria)
        previous_week_cash_revenue = calculate_revenue((Comande.date >= previous_week) & filter_criteria, payment_method='CONTANTI')

        monthly_revenue = calculate_revenue((Comande.date >= start_of_month) & filter_criteria)
        monthly_cash_revenue = calculate_revenue((Comande.date >= start_of_month) & filter_criteria, payment_method='CONTANTI')
        
        previous_month_revenue = calculate_revenue((Comande.date >= previous_month) & filter_criteria)
        previous_month_cash_revenue = calculate_revenue((Comande.date >= previous_month) & filter_criteria, payment_method='CONTANTI')

        # Calculate percentage changes
        daily_percentage_change = calculate_percentage_change(daily_revenue, previous_day_revenue)
        daily_cash_percentage_change = calculate_percentage_change(daily_cash_revenue, previous_day_cash_revenue)

        weekly_percentage_change = calculate_percentage_change(weekly_revenue, previous_week_revenue)
        weekly_cash_percentage_change = calculate_percentage_change(weekly_cash_revenue, previous_week_cash_revenue)

        monthly_percentage_change = calculate_percentage_change(monthly_revenue, previous_month_revenue)
        monthly_cash_percentage_change = calculate_percentage_change(monthly_cash_revenue, previous_month_cash_revenue)

        # Structure data for widgets
        projects_widgets = [
            {
                "id": 1,
                "feaIcon": "dollar-sign",
                "feaIconClass": "primary",
                "label": "Incassi Giornalieri",
                "badgeClass": "danger" if daily_percentage_change.startswith("-") else "success",
                "icon": "ri-arrow-down-s-line" if daily_percentage_change.startswith("-") else "ri-arrow-up-s-line",
                "percentage": daily_percentage_change,
                "caption": "Incassi di oggi",
                "subCounter": [
                    {"id": 1, "counter": f"{daily_revenue:.2f}", "suffix": "€"},
                    {"id": 2, "counter": f"{daily_cash_revenue:.2f}", "suffix": "€", "label": "Contanti"}
                ],
                "cashPercentage": daily_cash_percentage_change
            },
            
        ]

        return jsonify(projects_widgets)

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()


@app.route("/apertura/open", methods = ['GET'])
@token_required
def apertura():
    token = request.headers.get('Authorization')
    user, azienda = decode_token_and_get_azienda(token)
    if not user or not azienda:
        return jsonify({"error": "Invalid token or user/azienda not found"}), 401
    try:
        now = datetime.now()
        new_time = now + timedelta(hours=2)
        formatted_time = new_time.strftime("%d/%m/%Y %H:%M")
        apertura = Aperture(aperta = formatted_time)
        db.session.add(apertura)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.session.remove()



@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal Server Error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Sorry! The data you are looking for could not be found'}), 404




if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)

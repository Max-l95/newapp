from email.policy import default
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import pytz
import random, string

db = SQLAlchemy()

# Database models

italy_timezone = pytz.timezone("Europe/Rome")

# Function to get the current Italy time
def italy_now():
    return datetime.now(italy_timezone)

class Azienda(db.Model):
    __tablename__ = 'azienda'

    id_azienda = db.Column(db.Integer, primary_key=True)
    nome_azienda = db.Column(db.String(100), nullable=False)
    forma_giuridica = db.Column(db.String(50), nullable=False)
    codice_fiscale = db.Column(db.String(16), nullable=False, unique=True)
    partita_iva = db.Column(db.String(11), nullable=False, unique=True)
    sede_legale = db.Column(db.String(255), nullable=False)
    citta = db.Column(db.String(100))
    civico = db.Column(db.String(10))
    cap = db.Column(db.String(10))
    provincia = db.Column(db.String(2))
    phone = db.Column(db.String(20))
    mail = db.Column(db.String(100))
    api_key_doceasy = db.Column(db.String(255))
    api_secret_doceasy = db.Column(db.String(255))
    nome = db.Column(db.String(50))
    cognome = db.Column(db.String(50))
    rfiscale = db.Column(db.String(16))
    utenza_sidae = db.Column(db.String(50))
    sidae = db.Column(db.Boolean, default=False)
    ae_user = db.Column(db.String(50))
    ae_password = db.Column(db.String(50))
    ae_pin = db.Column(db.String(50))
    res = db.Column(db.Boolean, default=False)
    pos = db.Column(db.Boolean, default=False)
    logo = db.Column(db.String(255))


class Ruolo(db.Model):
    __tablename__ = 'ruolo'

    id_ruolo = db.Column(db.Integer, primary_key=True)
    nome_ruolo = db.Column(db.String(50), nullable=False)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Utente(db.Model):
    __tablename__ = 'utente'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(100))
    password = db.Column(db.String(512))  # Ensure this size matches your database schema
    city = db.Column(db.String(100))
    address = db.Column(db.String(100))
    provincia = db.Column(db.String(50))
    cap = db.Column(db.String(10))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    id_ruolo = db.Column(db.Integer, db.ForeignKey('ruolo.id_ruolo'))
    shop = db.Column(db.Integer)
    
    # Define relationships if needed
    ruolo = db.relationship('Ruolo', backref='utenti')
    




class Check(db.Model):
    __tablename__ = 'checks'

    uuid = db.Column(db.String(255), primary_key=True)
    checktype = db.Column(db.Integer, nullable=False)
    checktime = db.Column(db.DateTime, nullable=False)
    device_serial_number = db.Column(db.String(255), nullable=False)
    device_name = db.Column(db.String(255), nullable=False)
    employee_first_name = db.Column(db.String(50), nullable=False)
    employee_last_name = db.Column(db.String(50), nullable=False)
    employee_workno = db.Column(db.String(20), nullable=False)
    employee_department = db.Column(db.String(100), nullable=False)
    employee_job_title = db.Column(db.String(100))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Shops(db.Model):
    __tablename__ = "shops"

    id = db.Column(db.Integer, primary_key=True)
    descrizione = db.Column(db.String(255))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    name = db.Column(db.String(255))
    location_link = db.Column(db.String(400))
    address = db.Column(db.String(255))
    city = db.Column(db.String(255))
    cap = db.Column(db.String(255))
    provincia = db.Column(db.String(255))

class Turns(db.Model):
    __tablename__ = "turns"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    description = db.Column(db.String(255))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))

    def __init__(self, description, id_azienda):
        self.description = description
        self.id_azienda = id_azienda

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'id_azienda': self.id_azienda
        }


class Settings(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key = True)
    importo = db.Column(db.Integer)
    mail = db.Column(db.String(45))
    password = db.Column(db.String(45))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Schedules(db.Model):
    __tablename__ = 'schedules'
    id = db.Column(db.Integer, primary_key=True,  autoincrement=True)
    name = db.Column(db.String(255))
    monday = db.Column(db.JSON)
    tuesday = db.Column(db.JSON)
    wednesday = db.Column(db.JSON)
    thursday = db.Column(db.JSON)
    friday = db.Column(db.JSON)
    saturday = db.Column(db.JSON)
    sunday = db.Column(db.JSON)
    shop = db.Column(db.Integer,  db.ForeignKey('shops.id'))
    active = db.Column(db.Boolean)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))




class Tables(db.Model):
    __tablename__ = "tables"

    id = db.Column(db.Integer, primary_key=True)
    shop = db.Column(db.Integer, db.ForeignKey('shops.id'))
    number = db.Column(db.String(50))
    status = db.Column(db.Integer)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    banco = db.Column(db.Boolean)
    min_places = db.Column(db.Integer)
    max_places = db.Column(db.Integer)


    negozio = db.relationship('Shops', backref="negozio", lazy="subquery")


class Categories(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    reparto = db.Column(db.Integer, db.ForeignKey('reparti.id'))
    repartolink = db.relationship('Reparti', backref=db.backref('categories', lazy='dynamic'))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    descrizione_agg = db.Column(db.String(255))
    ordinamento = db.Column(db.Integer)
    menu = db.Column(db.Boolean, default=False)

class Festivita(db.Model):
    __tablename__ = 'festivita'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)    
    days = db.Column(db.String(5))  # List of days for the holiday    
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))  # Optional foreign key for azienda

    def __init__(self,days, id_azienda=None):       
        self.days = days       
        self.id_azienda = id_azienda



class Products(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    category = db.Column(db.Integer, db.ForeignKey('categories.id'))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Um(db.Model):
    __tablename__ = "um"

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Articoli(db.Model):
    __tablename__ = 'articoli'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(255))
    description = db.Column(db.String(255))
    um = db.Column(db.String(255), db.ForeignKey('um.id'))
    iva = db.Column(db.Integer, db.ForeignKey('codiva.id'))
    img = db.Column(db.String(255))
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    prezzo = db.Column(db.Float)
    id_azienda = db.Column(db.Integer)  # Ensure this matches the data type of 'id_azienda' in 'azienda'
    ingredienti = db.Column(db.JSON)
    vegetariano = db.Column(db.Boolean)
    vegano = db.Column(db.Boolean)
    celiaco = db.Column(db.Boolean)
    menu = db.Column(db.Boolean)
    varianti = db.Column(db.Boolean)
    varianti_list = db.Column(db.JSON)
    blocco_giacenze = db.Column(db.Boolean, default = False)
    giacenza_varianti = db.Column(db.Boolean, default = False)
    prezzi_varianti = db.Column(db.Boolean, default = False)
    
    # Define Foreign Keys
    db.ForeignKeyConstraint(['um'], ['um.id'])
    db.ForeignKeyConstraint(['iva'], ['codiva.id'])
    db.ForeignKeyConstraint(['category_id'], ['categories.id'])
    db.ForeignKeyConstraint(['id_azienda'], ['azienda.id_azienda'])

    
    unitmeasure = db.relationship('Um', backref= db.backref('um', lazy='dynamic'))
    category = db.relationship('Categories', backref=db.backref('articoli', lazy='dynamic'))
    aliva = db.relationship('Codiva', backref=db.backref('articoli', lazy='dynamic'))



class Varianti(db.Model):
    __tablename__ = "varianti"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(255))
    description = db.Column(db.String(255))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    ingredienti = db.Column(db.JSON)


class Ingredienti(db.Model):
    __tablename__ = "ingredienti"

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Codiva(db.Model):
    __tablename__ = "codiva"

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    aliquota = db.Column(db.Float)
    natura = db.Column(db.String(255))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Reparti(db.Model):
    __tablename__= "reparti"

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    printer = db.Column(db.String(255))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Comande(db.Model):
    __tablename__ = "comande"

    id = db.Column(db.Integer, primary_key=True)
    table = db.Column(db.Integer)
    note = db.Column(db.String(255))
    contenuto = db.Column(db.JSON)
    cliente = db.Column(db.Integer, db.ForeignKey('clienti.id'))
    status = db.Column(db.Integer)
    date = db.Column(db.DateTime,  default=italy_now, nullable=False)
    customer = db.relationship('Clienti', backref=db.backref('customer', lazy='dynamic'))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    idScontrino = db.Column(db.String(50), unique=True)
    numeroDoc = db.Column(db.String(50))
    annullato = db.Column(db.Boolean, default=False)
    iva = db.Column(db.Float)
    totale = db.Column(db.Float)
    pagamento = db.Column(db.String(255))
    giacenze = db.Column(db.Boolean, default = False)
    numeroComanda = db.Column(db.Integer)


class Clienti(db.Model):
    __tablename__ = 'clienti'

    id = db.Column(db.Integer, primary_key=True)
    denominazione = db.Column(db.String(255))
    nome = db.Column(db.String(50))
    cognome = db.Column(db.String(50))
    partitaiva = db.Column(db.String(11))
    codicefiscale = db.Column(db.String(16))
    indirizzo = db.Column(db.String(255))
    cap = db.Column(db.String(10))
    citta = db.Column(db.String(100))
    provincia = db.Column(db.String(2))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(100))
    pec = db.Column(db.String(100))
    SDI = db.Column(db.String(7))
    civico = db.Column(db.String(10))
    nazione = db.Column(db.String(2))
    giuridica = db.Column(db.Boolean, default=False) 
    cellulare = db.Column(db.String(20))
    generico = db.Column(db.Boolean, default=False) 
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    news = db.Column(db.Boolean, default = False)
    privacy = db.Column(db.Boolean, default = False)


class Fornitori(db.Model):
    __tablename__ = 'fornitori'
    id = db.Column(db.Integer, primary_key=True)    
    denominazione = db.Column(db.String(255))
    nome = db.Column(db.String(50))
    cognome = db.Column(db.String(50))
    partitaiva = db.Column(db.String(11))
    codicefiscale = db.Column(db.String(16))
    indirizzo = db.Column(db.String(255))
    civico = db.Column(db.String(10))
    cap = db.Column(db.String(10))
    comune = db.Column(db.String(100))
    provincia = db.Column(db.String(2))
    nazione = db.Column(db.String(50))
    SDI = db.Column(db.String(7))  # Codice Destinatario for Italian electronic invoicing
    giuridica = db.Column(db.Boolean, default=False)    
    email = db.Column(db.String(100))
    pec = db.Column(db.String(100))
    telefono = db.Column(db.String(20))
    cellulare = db.Column(db.String(20))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    generico = db.Column(db.Boolean, default= False)


class Testmag(db.Model):
    __tablename__ = 'testmag'
    id = db.Column(db.Integer, primary_key=True)
    controparte_id = db.Column(db.Integer)
    numero_doc = db.Column(db.String(50))
    sezionale = db.Column(db.String(50))
    date = db.Column(db.String(50))  # Ideally, you should use DateTime or Date type
    totale = db.Column(db.Float)
    iva = db.Column(db.Float)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    carico = db.Column(db.Boolean, default = False)

    
    


class Movmag(db.Model):
    __tablename__ = 'movmag'
    id = db.Column(db.Integer, primary_key=True)
    articolo_id = db.Column(db.Integer, db.ForeignKey('articoli.id'))
    quantita = db.Column(db.Integer)
    um = db.Column(db.Integer, db.ForeignKey('um.id'))
    prezzo = db.Column(db.Float)
    iva = db.Column(db.Integer, db.ForeignKey('codiva.id'))
    descrizione = db.Column(db.String(255))
    testata_id = db.Column(db.Integer, db.ForeignKey('testmag.id'))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    variante_id = db.Column(db.Integer)
    giacenza_id = db.Column(db.Integer)

    articolo = db.relationship('Articoli', backref=db.backref('movimenti', lazy='dynamic'))
    unitmov = db.relationship('Um', backref=db.backref('movimenti', lazy='dynamic'))
    aliva = db.relationship('Codiva', backref=db.backref('movimenti', lazy='dynamic'))
    testata = db.relationship('Testmag', backref=db.backref('movimenti', lazy='dynamic'))


class Sezionali(db.Model):
    __tablename__ = "sezionali"
    id = db.Column(db.Integer, primary_key=True)
    descrizione = db.Column(db.String(255))
    documento = db.Column(db.String(3))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Numerazioni(db.Model):
    __tablename__ = "numerazioni"
    id = db.Column(db.Integer, primary_key=True)
    id_sezionale = db.Column(db.Integer, db.ForeignKey('sezionali.id'))
    numero = db.Column(db.Integer)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Pagamenti(db.Model):
    __tablename__ = 'pagamenti'
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    tipo = db.Column(db.String(50))
    rate = db.Column(db.Integer)
    banca = db.Column(db.Integer, db.ForeignKey('banche.id'))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    condizioni = db.Column(db.String(255))

    banca_col = db.relationship('Banche', backref=db.backref('pagamenti', lazy='dynamic'))


class Banche(db.Model):
    __tablename__ = 'banche'
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    iban = db.Column(db.String(34))  # Standard IBAN length
    abi =  db.Column(db.String(5))
    cab =  db.Column(db.String(5))
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))


class Giacenze(db.Model):
    __tablename__ = "giacenze"
    id = db.Column(db.Integer, primary_key=True)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    id_articolo = db.Column(db.Integer, db.ForeignKey('articoli.id'))
    giacenza = db.Column(db.Float)
    id_variante = db.Column(db.Integer, db.ForeignKey('varianti.id'))

    articolo = db.relationship('Articoli', backref=db.backref('giacenze', lazy='dynamic'))
    variante = db.relationship('Varianti', backref=db.backref('giacenze', lazy='dynamic'))

class Listino(db.Model):
    __tablename__ = "listino"
    id = db.Column(db.Integer, primary_key=True)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    id_articolo = db.Column(db.Integer, db.ForeignKey('articoli.id'))
    prezzo = db.Column(db.Float)
    id_variante = db.Column(db.Integer, db.ForeignKey('varianti.id'))

    articolo = db.relationship('Articoli', backref=db.backref('listino', lazy='dynamic'))
    variante = db.relationship('Varianti', backref=db.backref('listino', lazy='dynamic'))


def generate_unique_code():
    max_attempts = 100  # Limit the number of attempts to prevent infinite loops
    attempts = 0

    while attempts < max_attempts:
        try:
            # Generate a random 5-character string
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
            
            # Check if the code already exists in the database
            existing_code = Fatture.query.filter_by(Doceasy=code).first()
            
            if not existing_code:
                return code

        except SQLAlchemyError as e:
            print(f"Database error: {e}")
            return None

        finally:
            # Remove the session after each attempt to avoid session leaks
            db.session.remove()

        attempts += 1

    # If we reach here, no unique code was generated within the allowed attempts
    raise ValueError("Could not generate a unique code after multiple attempts.")


class Fatture(db.Model):
    __tablename__ = 'fatture'
    
    id = db.Column(db.Integer, primary_key=True)
    id_azienda = db.Column(db.Integer, db.ForeignKey('azienda.id_azienda'))
    inviato = db.Column(db.Boolean, default=False)
    Doceasy = db.Column(db.String(20), nullable=False, default=generate_unique_code)
    cliente = db.Column(db.Integer, db.ForeignKey('clienti.id'))
    fileId = db.Column(db.String(255), default=generate_unique_code)
    corpo = db.Column(db.JSON)  # Use db.JSON if using SQLAlchemy 1.4+ or JSON type for older versions
    pagamento = db.Column(db.JSON)
    sezionale = db.Column(db.JSON)
    numero = db.Column(db.Integer)
    date = db.Column(db.String(50))  # Prefer DateTime type for dates
    totale = db.Column(db.Float)

    def __init__(self, id_azienda=None, inviato=None, Doceasy=None, cliente=None, fileId=None, corpo=None, pagamento=None, sezionale=None, numero=None, date=None, totale=None):
        self.id_azienda = id_azienda
        self.inviato = inviato if inviato is not None else False  # Default to False if not provided
        self.Doceasy = Doceasy or generate_unique_code()
        self.cliente = cliente
        self.fileId = fileId or generate_unique_code()  # Generate default code if not provided
        self.corpo = corpo
        self.pagamento = pagamento
        self.sezionale = sezionale
        self.numero = numero
        self.date = date
        self.totale = totale

class Reservation(db.Model):
    __tablename__ = "reservation"
    
    # Columns
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('clienti.id'))  # ForeignKey to 'clienti' table
    customer_payment = db.Column(db.String(45))
    date = db.Column(db.String(20))
    turn = db.Column(db.Integer)
    shop = db.Column(db.Integer, db.ForeignKey('shops.id'))  # ForeignKey to 'shops' table
    table = db.Column(db.Integer, db.ForeignKey('tables.id'))  # ForeignKey to 'tables' table
    people = db.Column(db.Integer)
    reservation_validated = db.Column(db.Boolean, default=False)
    charged = db.Column(db.Boolean, default=False)
    note = db.Column(db.String(45))
    payment_id = db.Column(db.String(255))
    removed = db.Column(db.Boolean, default=False)
    locale = db.Column(db.Boolean, default=False)
    time = db.Column(db.String(45))
    id_azienda = db.Column(db.Integer)
    reservation_col = db.Column(db.String(45))
    
    # Relationships
    customer = db.relationship('Clienti', backref=db.backref('reservations', lazy='dynamic'))
    table_rel = db.relationship('Tables', backref=db.backref('reservations', lazy='dynamic'))  # Use 'table' instead of 'tavolo'
    shop_rel = db.relationship('Shops', backref=db.backref('reservations', lazy='dynamic'))  # Use 'shop' instead of 'negozio'



class Aperture(db.Model):
    __tablename__ = "aperture"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    aperta = db.Column(db.DateTime, default=italy_now, nullable=False)
    chiusa = db.Column(db.DateTime,  default=italy_now, nullable=False)
    



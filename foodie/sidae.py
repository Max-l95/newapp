import requests
import json
import os

URL_API = os.getenv('REACT_APP_SIDAE_ENDPOINT', "https://www.sidae.it/ae/interscambio52.php")

def utenza_inserimento(azienda):
    # Creazione del dizionario della sezione utenza
    utenza = {
        "ae_denominazione": "",
        "ae_cognome": azienda.cognome,
        "ae_nome": azienda.nome,        
        "ae_indirizzo": azienda.sede_legale if azienda.sede_legale else "",
        "ae_numeroCivico": azienda.civico if azienda.civico else "",
        "ae_cap": azienda.cap if azienda.cap else "",
        "ae_comune": azienda.comune if azienda.comune else "",
        "ae_provincia": azienda.provincia if azienda.provincia else "",
        "ae_partitaIva": azienda.partita_iva if azienda.partita_iva else "",
        "ae_codiceFiscale": ""
        
    }

    # Creazione del dizionario principale con la struttura indicata
    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "utenzaInserimento"
        },
        "utenza": utenza
    }

    # Stampa del contenuto della richiesta prima dell'invio
    print("Request JSON:")
    print(json.dumps(utenza_data, indent=4))

    # Invio della richiesta POST
    response = requests.post(URL_API, json=utenza_data)

    # Stampa della risposta del server
    print("Response content:")
    print(response.content)

    return response.status_code, response.json()

def utenza_modifica(azienda):
    
    # Creazione del dizionario della sezione utenza
    utenza = {
        "ae_indirizzo": azienda.sede_legale,
        "ae_numeroCivico": azienda.civico,
        "ae_cap": azienda.cap,
        "ae_comune": azienda.comune,
        "ae_provincia": azienda.provincia,
        "ae_partitaIva": azienda.partita_iva,
        "ae_codiceFiscale": ""
    }

    # Se esistono nome e cognome, non includere denominazione
    if azienda.nome and azienda.cognome:
        utenza["ae_nome"] = azienda.nome
        utenza["ae_cognome"] = azienda.cognome
    else:
        # Altrimenti includere solo la denominazione
        utenza["ae_denominazione"] = azienda.nome_azienda
    
    # Creazione del dizionario principale con la struttura indicata
    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "utenzaModifica",
            "id_utenza" : azienda.utenza_sidae
        },
        "utenza": utenza
    }

    # Invio della richiesta POST
    response = requests.post(URL_API, json=utenza_data)
    print(response.content)
    return response.status_code, response.json()


def utenza_interrogazione(azienda):
    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "utenzaInterrogazione",
            "id_utenza" : azienda.utenza_sidae
        },
        
    }

    # Invio della richiesta POST
    response = requests.post(URL_API, json=utenza_data)
    print(response.content)
    return response.status_code, response.json()

def utenza_disabilita(azienda):
    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "utenzaDisabilita",
            "id_utenza" : azienda.utenza_sidae,
            "abilitata": "false"
        },
        
    }
    response = requests.post(URL_API, json=utenza_data)
    
    return response.status_code, response.json()

def utenza_abilita(azienda):
    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "utenzaAbilita",
            "id_utenza" : azienda.utenza_sidae,
            "abilitata": "true"
        },
        
    }
    response = requests.post(URL_API, json=utenza_data)
    print(response.content)
    return response.status_code, response.json()

def invio_test(azienda, scontrino):
    righe_data = [
        {
            "rigaProgressivo": index + 1,  # Index starts from 0, so add 1
            "quantita": riga['quantity'],
            "descrizione": riga['title'],
            "importoUnitario": riga['price'],
            "sconto": "0",
            "aliquota": riga['iva']['aliquota']
        }
        for index, riga in enumerate(scontrino['corpo'])
    ]

    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "invio",
            "id_utenza": azienda.utenza_sidae,
            "abilitata": "false",
            "test": "2"
        },
        "utente": {
            "ae_user": azienda.ae_user,
            "ae_password": azienda.ae_password,
            "ae_pin": azienda.ae_pin
        },
        "impostazioni": {
            "dettaglio": "1"
        },
        "dati": {
            "righe": righe_data,
            "pagamenti": [
                {
                    "pagamentoTipo": scontrino['payment'],
                    "pagamentoImporto": scontrino['total'],
                    "pagamentoNumTicket": ""
                }
            ],
            "detrazioni": {
                "importoDetraibile": ""
            },
            "altri_dati": {
                "codiceLotteria": "",
                "sconto_a_pagare": "",
                "idScontrino": "",
                "numeroRiferimento": ""
            }
        },
    }
    
    response = requests.post(URL_API, json=utenza_data)
    response_json = response.json()
    
    # Extract 'numeroDocumento' from the response
    numero_documento = response_json.get('head', {}).get('numeroDocumento', 'N/A')
    
    
    return response.status_code, numero_documento

def invio_reale(azienda, scontrino):
    righe_data = [
        {
            "rigaProgressivo": index + 1,  # Index starts from 0, so add 1
            "quantita": riga['quantity'],
            "descrizione": riga['title'],
            "importoUnitario": riga['price'],
            "sconto": "0",
            "aliquota": riga.get('iva', {}).get('aliquota', 10)
        }
        for index, riga in enumerate(scontrino['corpo'])
    ]

    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "invio",
            "id_utenza": azienda.utenza_sidae,
            "abilitata": "false",            
        },
        "utente": {
            "ae_user": azienda.ae_user,
            "ae_password": azienda.ae_password,
            "ae_pin": azienda.ae_pin
        },
        "impostazioni": {
            "dettaglio": "1"
        },
        "dati": {
            "righe": righe_data,
            "pagamenti": [
                {
                    "pagamentoTipo": scontrino['payment'],
                    "pagamentoImporto": scontrino['total'],
                    "pagamentoNumTicket": ""
                }
            ],
            "detrazioni": {
                "importoDetraibile": ""
            },
            "altri_dati": {
                "codiceLotteria": "",
                "sconto_a_pagare": "",
                "idScontrino": "",
                "numeroRiferimento": ""
            }
        },
    }
    
    response = requests.post(URL_API, json=utenza_data)
    response_json = response.json()
    
    # Extract 'numeroDocumento' from the response
    numero_documento = response_json.get('head', {}).get('numeroDocumento', 'N/A')
    print(response.content)
    
    return response.status_code, numero_documento


def annullo_scontrino_sidae(azienda, id):
    utenza_data = {
        "auth": {
            "sa_nome": os.getenv('REACT_APP_SIDAE_NOME'),
            "sa_chiave": os.getenv('REACT_APP_SIDAE_CHIAVE'),
            "command": "annullo",
            "id_utenza" : azienda.utenza_sidae,
            "abilitata": "false"
        },
        "utente": {
            "ae_user": azienda.ae_user,
            "ae_password": azienda.ae_password,
            "ae_pin": azienda.ae_pin,
            "ae_partitaIva":azienda.partita_iva,
            "ae_codiceFiscale": ""
            

        },
        "numeroRiferimento": id

        
    }
    response = requests.post(URL_API, json=utenza_data)
    response_json = response.json()
    errore = response_json.get('head', {}).get('errore', '')

    return errore






    

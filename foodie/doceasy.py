import requests, base64

def active_invoices(partitaIva, codiceFiscale, apiKey, apiSecret):
    s = requests.session()  
    s.headers = {
                    'Accept': 'application/json',       
                    'PartitaIva': 'IT'+ partitaIva,
                    'CodiceFiscale' : codiceFiscale,
                    'APIKey' : apiKey,
                    'APISecret' : apiSecret,
                }
    
    file_response = s.get("https://webapi.doceasy.it/api/documentoattivo/elenco")
    return file_response

def passive_invoices(partitaIva, codiceFiscale, apiKey, apiSecret):
    s = requests.session()  
    s.headers = {
                    'Accept': 'application/json',       
                    'PartitaIva': 'IT'+ partitaIva,
                    'CodiceFiscale' : codiceFiscale,
                    'APIKey' : apiKey,
                    'APISecret' : apiSecret,
                }
    
    file_response = s.get("https://webapi.doceasy.it/api/documentopassivo/elenco")
    return file_response


def upload_doceasy(azienda, xml_content, filename):
    s = requests.session()  
    s.headers = {
                    'Accept': 'application/json',       
                    'PartitaIva': 'IT'+ azienda.partita_iva,
                    'CodiceFiscale' : azienda.codice_fiscale,
                    'APIKey' : azienda.api_key_doceasy,
                    'APISecret' : azienda.api_secret_doceasy,
                }

    # Ensure xml_content is Base64 encoded
    encoded_xml = base64.b64encode(xml_content.encode('utf-8')).decode('utf-8')

    body = {
            "nomeFile": filename,
            "datiDocumento": encoded_xml,            
            "stato": 0
            }
    
    response = s.post("https://webapi.doceasy.it/api/documentoattivo", json=body)
    print(response.content)
    return response


def delete_doceasy(azienda, id_to_delete):
    s = requests.session()  
    s.headers = {
                    'Accept': 'application/json',       
                    'PartitaIva': 'IT'+ azienda.partita_iva,
                    'CodiceFiscale' : azienda.codice_fiscale,
                    'APIKey' : azienda.api_key_doceasy,
                    'APISecret' : azienda.api_secret_doceasy,
                }    
    
    response = s.delete(f"https://webapi.doceasy.it/api/documentoattivo/{id_to_delete}")
    
    return response


def invia_doceasy(azienda, id_to_send):
    s = requests.session()  
    s.headers = {
                    'Accept': 'application/json',       
                    'PartitaIva': 'IT'+ azienda.partita_iva,
                    'CodiceFiscale' : azienda.codice_fiscale,
                    'APIKey' : azienda.api_key_doceasy,
                    'APISecret' : azienda.api_secret_doceasy,
                }    
    
    response = s.get(f"https://webapi.doceasy.it/api/documentoattivo/{id_to_send}/invia")
   
    return response


def render_doceasy(azienda, id_to_render):
    s = requests.session()  
    s.headers = {
        'Accept': 'application/json',       
        'PartitaIva': 'IT' + azienda.partita_iva,
        'CodiceFiscale': azienda.codice_fiscale,
        'APIKey': azienda.api_key_doceasy,
        'APISecret': azienda.api_secret_doceasy,
    }
    
    response = s.get(f"https://webapi.doceasy.it/api/documentoattivo/{id_to_render}/file")
    
    if response.status_code == 200:
        return response.content  # Return the binary content of the file
    else:
        response.raise_for_status()  # Handle errors by raising an exception


def render_doceasy_passive(azienda, id_to_render):
    s = requests.session()  
    s.headers = {
        'Accept': 'application/json',       
        'PartitaIva': 'IT' + azienda.partita_iva,
        'CodiceFiscale': azienda.codice_fiscale,
        'APIKey': azienda.api_key_doceasy,
        'APISecret': azienda.api_secret_doceasy,
    }
    
    response = s.get(f"https://webapi.doceasy.it/api/documentopassivo/{id_to_render}/file")
    
    if response.status_code == 200:
        return response.content  # Return the binary content of the file
    else:
        response.raise_for_status()  # Handle errors by raising an exception
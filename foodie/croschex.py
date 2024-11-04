from datetime import datetime
import requests
import json


def get_token(api_url, api_key, api_secret, request_id, timestamp):
    # Construct the headers and payload
    headers = {
        "nameSpace": "authorize.token",
        "nameAction": "token",
        "version": "1.0",
        "requestId": request_id,
        "timestamp": timestamp
    }

    payload = {
        "api_key": api_key,
        "api_secret": api_secret
    }

    # Construct the request body
    body = {
        "header": headers,
        "payload": payload
    }

    # Convert the body to JSON format
    body_json = json.dumps(body)

    # Send the POST request
    response = requests.post(api_url, data=body_json, headers={'Content-Type': 'application/json'})   

    # Check if the request was successful
    if response.status_code == 200:
        return response.json()  # Return the response as a JSON object
    else:
        return {"error": "Request failed", "status_code": response.status_code, "response": response.text}

def get_records(token, api_url, request_id, timestamp, start_date, end_date, page, limit):
    if start_date is None:
        start_date = datetime.utcnow().isoformat() + "Z"
    if end_date is None:
        end_date = datetime.utcnow().isoformat() + "Z"
        
    headers = {
        "nameSpace": "attendance.record",
        "nameAction": "getrecord",
        "version": "1.0",
        "requestId": request_id,
        "timestamp": timestamp
    }

    authorize = {
        "type": "token",
        "token": token
    }

    payload = {
        "begin_time": start_date,
        "end_time": end_date,
        "order": "asc",
        "page": page,
        "per_page": limit
    }

    body = {
        "header": headers,
        "authorize": authorize,
        "payload": payload
    }

    body_json = json.dumps(body)
    response = requests.post(api_url, data=body_json, headers={'Content-Type': 'application/json'})
    return response


    





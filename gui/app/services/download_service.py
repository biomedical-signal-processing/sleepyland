import requests
from flask import jsonify

manager_nsrr_downlaod_url = "http://manager-api:8989/download_data"


def send_to_download_service(token, selected_datasets):
    response = requests.post(manager_nsrr_downlaod_url, data={'token': token, 'selected_datasets': selected_datasets})

    if response.status_code == 200:
        return jsonify({
            'message': 'Processing complete'
        }), 200

    else:
        return jsonify(
            {'error': f'failed with status code: {response.status_code}'}), response.status_code

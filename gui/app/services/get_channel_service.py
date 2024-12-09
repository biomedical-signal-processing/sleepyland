import requests
from flask import jsonify

manager_get_channels_url = "http://manager-api:8989/get_channels"


def get_channels_from_hparam(dataset_selected):
    """Get channels from the manager API."""
    try:
        response = requests.post(manager_get_channels_url, params={'dataset': dataset_selected})
        if response.status_code == 200:
            return response.json()
        else:
            return jsonify(
                {'error': f'Failed to get channels with status code: {response.status_code}'}), response.status_code
    except Exception as e:
        return jsonify({'error': f'An error occurred: {e}'}), 500

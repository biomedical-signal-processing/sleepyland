import requests

manager_predict_url = "http://manager-api:8989/auto_predict"

manager_predict_one_url = "http://manager-api:8989/predict_one"


def send_to_prediction_service(folder_root_name, folder_name, eeg_channels, eog_channels, emg_channels, dataset,
                               models_selected):
    return requests.post(manager_predict_url, data={
        'folder_root_name': folder_root_name,
        'folder_name': folder_name,
        'eeg_channels': eeg_channels,
        'eog_channels': eog_channels,
        'emg_channels': emg_channels,
        'dataset': dataset,
        'models': models_selected
    })

def sent_to_prediction_one_service(folder_root_name, folder_name, channels, models_selected):
    return requests.post(manager_predict_one_url, data={
        'folder_root_name': folder_root_name,
        'folder_name': folder_name,
        'channels': channels,
        'models': models_selected
    })

def handle_download_block(dataset, folder_name, eeg_channels, eog_channels, emg_channels, models_selected):
    return requests.post(manager_predict_url, data={'folder_root_name': dataset, 'folder_name': folder_name,
                                                    'eeg_channels': eeg_channels, 'eog_channels': eog_channels,
                                                    'emg_channels': emg_channels, 'dataset': dataset,
                                                    'models': models_selected})

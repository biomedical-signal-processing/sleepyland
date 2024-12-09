import requests
import os
import tempfile
import shutil
import numpy as np

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

WTFANCY_HARMONIZE_URL = "http://wild-to-fancy:6666/harmonize"
EVALUATION_URL = "http://usleepyland:7777/evaluate"
PREDICT_ONE_URL = "http://usleepyland:7777/predict_one"
ENSEMBLE_URL = "http://usleepyland:7777/ensemble"
ENSEMBLE_ONE_URL = "http://usleepyland:7777/ensemble_one"

def harmonize_service(dataset_name: str):
    harmonize_data = False

    input_folder = "/app/input"

    if not os.path.exists(input_folder):
        raise FileNotFoundError(f"Input folder {input_folder} not found")

    folders_to_process = []

    # Walk through the directory to find folders containing .edf files
    for root, dirs, files in os.walk(input_folder):
        edf_files = [f for f in files if f.endswith('.edf') or f.endswith('.EDF')]
        if edf_files:
            folders_to_process.append(root)

    # Process each folder that contains .edf files
    for folder_path in folders_to_process:
        folder_name = os.path.basename(folder_path)

        response = requests.post(WTFANCY_HARMONIZE_URL, data={'folder_name': folder_name, 'dataset': dataset_name})

        if response.status_code == 200:
            print("Response OK")
            harmonize_data = True
        else:
            raise Exception(f"Harmonization failed with status code: {response.status_code}")

    print("Harmonization finished")
    return harmonize_data


def predict_service(folder_root_name, folder_name, eeg_channels, eog_channels, emg_channels, dataset, models):
    responses = []
    response = None
    ensemble_checked = False
    models_generated = models[0].split(',')

    #if model_generated containes 'ensemble' then remove it
    if 'ensemble' in models_generated:
        models_generated.remove('ensemble')
        ensemble_checked = True


    logger.debug(f"Models: {models}")
    logger.debug(f"models_generated: {models_generated}")

    for model in models_generated:

        response = requests.post(EVALUATION_URL,
                                 data={'folder_root_name': folder_root_name, 'folder_name': folder_name,
                                       'eeg_channels': eeg_channels, 'eog_channels': eog_channels,
                                       'emg_channels': emg_channels, 'dataset': dataset, 'model': model})


        base_dir = '/app/output/' + folder_name + '/' + model

        true_folder_path = os.path.join(base_dir, "TRUE_files")

        os.makedirs(true_folder_path, exist_ok=True)

        for root, dirs, files in os.walk(base_dir):
            for file in files:
                logger.debug(f"File found: {file}")
                if file.endswith("_TRUE.npy"):
                    source_path = os.path.join(root, file)
                    dest_path = os.path.join(true_folder_path, file)
                    shutil.move(source_path, dest_path)

        if response.status_code == 200:
            try:
                # Parse the JSON response
                response_json = response.json()

                # Append the model name and its metrics to the responses list
                responses.append({
                    f"{model}": response_json.get(f"${model}", {})
                })

                logger.debug(f"Response for model {model}: {responses}")
            except Exception as e:
                logger.error(f"Error parsing response for model {model}: {e}")
        else:
            logger.error(f"Failed to get response for model {model}. Status code: {response.status_code}")

    if ensemble_checked:
        response = requests.post(ENSEMBLE_URL,
                                 data={'folder_name': folder_name, 'models': models_generated})

        if response.status_code == 200:
            try:
                # Parse the JSON response
                response_json = response.json()

                # Append the model name and its metrics to the responses list
                responses.append({
                    "ensemble": response_json.get("ensemble", {})
                })

            except Exception as e:
                logger.error(f"Error parsing response for model ensemble: {e}")
        else:
            logger.error(f"Failed to get response for model ensemble. Status code: {response.status_code}")

    return {"message": "Prediction completed successfully.", "metrics": responses} if responses else {
        "message": "Prediction failed", "metrics": []}

def predict_one_service(folder_root_name, folder_name, channels, models):
    responses = []
    response = None
    ensemble_checked = False

    models_generated = models[0].split(',')

    if 'ensemble' in models_generated:
        models_generated.remove('ensemble')
        ensemble_checked = True

    for model in models_generated:
        response = requests.post(PREDICT_ONE_URL,
                                 data={'folder_root_name': folder_root_name,'folder_name': folder_name, 'channels': channels, 'model': model})

        if response.status_code == 200:
            try:
                logger.debug(f"Response for model {model}")
            except Exception as e:
                logger.error(f"Error parsing response for model {model}: {e}")
        else:
            logger.error(f"Failed to get response for model {model}. Status code: {response.status_code}")

    if ensemble_checked:
        requests.post(ENSEMBLE_ONE_URL,
                                 data={'folder_name': folder_name, 'models': models_generated})

    return {"message": "Prediction completed successfully."} if responses else {
        "message": "Prediction failed", "metrics": []}

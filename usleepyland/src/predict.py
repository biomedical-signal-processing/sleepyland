from collections import defaultdict
from fastapi import FastAPI, File, UploadFile, Response, Form, Query
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Dict
import sklearn.metrics as metrics
import subprocess
import os
import shutil
import yaml
import logging
import numpy as np

app = FastAPI()

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def process_channels(channels):
    if len(channels) == 0 or channels[0] == '':
        return []
    return channels[0].split(',') if len(channels) == 1 else channels


def determine_folder(project_dirs, model, channels):
    eeg_non_empty = "eeg" in channels and len(channels["eeg"]) > 0
    eog_non_empty = "eog" in channels and len(channels["eog"]) > 0

    # If EEG is non-empty and EOG is empty, return EEG folder
    if eeg_non_empty and not eog_non_empty:
        return project_dirs[model].get("eeg", project_dirs[model]["default"])

    # If EOG is non-empty and EEG is empty, return EOG folder
    if eog_non_empty and not eeg_non_empty:
        return project_dirs[model].get("eog", project_dirs[model]["default"])

    # If both are non-empty, return default folder
    return project_dirs[model]["default"]


def get_project_dir(model: str, channels: Dict[str, List[str]]) -> str:
    """Determine the project directory based on the model and available channels."""
    project_dirs = {
        "deepresnet": {
            "eeg": "./deepresnet-nsrr-2022_eeg",
            "eog": "./deepresnet-nsrr-2022_eog",
            "default": "./deepresnet-nsrr-2022"
        },
        "usleep": {
            "eeg": "./u-sleep-nsrr-2022_eeg",
            "eog": "./u-sleep-nsrr-2022_eog",
            "default": "./u-sleep-nsrr-2022"
        },
        "yasa": {
            "eeg": "./yasa_eeg",
            "default": "./yasa"
        },
        "transformer": {
            "eeg": "./sleeptransformer-nsrr-2022_eeg",
            "eog": "./sleeptransformer-nsrr-2022_eog",
            "default": "./sleeptransformer-nsrr-2022"
        }
    }

    if model not in project_dirs:
        raise ValueError(f"Unsupported model: {model}")

    return determine_folder(project_dirs, model, channels)


async def run_command_for_evaluation(
        model: str, folder_regex: str, predictions_folder: str, dataset: str, channels: Dict[str, List[str]]
) -> str:
    """Run the prediction command for a specific model."""
    project_dir = get_project_dir(model, channels)

    base_command = [
        "python", "./utime/bin/ut.py", "predict", "--num_gpus", "0",
        "--folder_regex", folder_regex,
        "--dataset", dataset,
        "--project_dir", project_dir,
        "--save_true",
        "--data_split", "test_data",
        "--strip_func", "strip_to_match",
        "--majority",
        "--no_argmax",
        "--out_dir", predictions_folder,
        "--overwrite"
    ]

    # Add channels to the command
    if channels["eeg"]:
        base_command += ["--eeg_channels"] + channels["eeg"]
    if channels["eog"]:
        base_command += ["--eog_channels"] + channels["eog"]

    # Model-specific flags
    if model == "yasa":
        base_command += ["--model_external", "yasa"]
    if model == "usleep" or model == "deepresnet":
        base_command += ["--one_shot"]

    logger.debug(f"Running command: {base_command}")
    # Execute the command
    result = subprocess.run(base_command, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"Command failed: {base_command} | Error: {result.stderr.strip()}")
        return result.stderr
    return result.stdout


async def run_command_for_prediction_one(model: str, folder_regex: str, predictions_folder: str, channels: List[str]):
    if len(channels) == 1 and channels[0] == '':
        channels = []

    # Define the project directory mapping for each model and channel
    project_dirs = {
        "deepresnet": {
            "EEG": "./deepresnet-nsrr-2022_eeg",
            "EOG": "./deepresnet-nsrr-2022_eog",
            "default": "./deepresnet-nsrr-2022"
        },
        "usleep": {
            "EEG": "./u-sleep-nsrr-2022_eeg",
            "EOG": "./u-sleep-nsrr-2022_eog",
            "default": "./u-sleep-nsrr-2022"
        },
        "yasa": {
            "EEG": "./yasa_eeg",
            "default": "./yasa"
        },
        "transformer": {
            "EEG": "./sleeptransformer-nsrr-2022_eeg",
            "EOG": "./sleeptransformer-nsrr-2022_eog",
            "default": "./sleeptransformer-nsrr-2022"
        }
    }

    # Check if the model is valid and the channels are not empty
    if model in project_dirs:
        if len(channels) == 1:
            # If only one channel is selected, use it directly or default if no match
            project_dir = project_dirs[model].get(channels[0], project_dirs[model]["default"])
        else:
            # If no specific channel is selected, use the default
            project_dir = project_dirs[model]["default"]

    # Base command
    command = [
                  "python", "./utime/bin/ut.py", "predict_one", "--num_gpus", "0",
                  "-f", folder_regex,
                  "--seed", "123",
                  "--auto_channel_grouping"] + channels + ["MASTOID",
                                                           "--auto_reference_types"] + channels + [
                  "--project_dir", project_dir,
                  "--strip_func", "trim_psg_trailing",
                  "--majority",
                  "--no_argmax",
                  "--out_dir", predictions_folder,
                  "--overwrite"
              ]

    # Add specific flag for Yasa model if needed
    if model == "yasa":
        command.append("--model_external")
        command.append("yasa")

    logger.debug(f"Running command: {command}")

    # Execute command
    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        logger.error(f"Command failed: {command} | Error: {result.stderr.strip()}")
        return result.stderr

    return result.stdout


def calculate_metrics_for_files(predictions_folder: str, model: str):
    results = []
    majorities_folder = os.path.join(predictions_folder, "majority")

    if model == "ensemble":
        predictions_folder = os.path.join(predictions_folder, "TRUE_files")

    # Find all true label files in the folder
    for file_name in os.listdir(predictions_folder):
        if not file_name.endswith("_TRUE.npy"):
            continue

        base_name = file_name.replace("_TRUE.npy", "")
        true_path = os.path.join(predictions_folder, file_name)
        predicted_path = os.path.join(majorities_folder, f"{base_name}_PRED.npy")

        if not os.path.exists(predicted_path):
            continue

        true_labels = np.load(true_path).astype(int)
        predicted_labels = np.load(predicted_path).argmax(-1).astype(int)

        # Compute metrics
        results.append({
            "file": base_name,
            "metrics": {
                "f1_score": metrics.f1_score(true_labels, predicted_labels, average='macro'),
                "f1_score_per_class": metrics.f1_score(true_labels, predicted_labels, average=None).tolist(),
                "cohen_kappa": metrics.cohen_kappa_score(true_labels, predicted_labels),
                "accuracy": metrics.accuracy_score(true_labels, predicted_labels),
                "recall": metrics.recall_score(true_labels, predicted_labels, average='macro'),
                "precision": metrics.precision_score(true_labels, predicted_labels, average='macro'),
                "cm": (metrics.confusion_matrix(true_labels, predicted_labels, normalize='true') * 100).tolist()
            }
        })
    return results


async def run_evaluation(
        model: str, folder_root_name: str, folder_name: str, eeg_channels: List[str], eog_channels: List[str],
        dataset: str
) -> JSONResponse:
    """Run a complete prediction for a given model."""
    predictions_folder = f"/app/output/{folder_name}/{model}"
    logger.debug(f"Running {model} prediction for {folder_root_name}")
    try:
        upload_dir = "/app/input"
        folder_path = os.path.join(upload_dir, folder_root_name, "[a-zA-Z]*")

        # Clear previous predictions
        if os.path.exists(predictions_folder):
            shutil.rmtree(predictions_folder)

        # Prepare channels
        channels = {
            "eeg": process_channels(eeg_channels),
            "eog": process_channels(eog_channels),
        }

        # Run the command
        result = await run_command_for_evaluation(model, folder_path, predictions_folder, dataset, channels)

        # Post-process and calculate metrics
        os.chmod(predictions_folder, 0o777)
        metrics = calculate_metrics_for_files(predictions_folder, model)

        return JSONResponse(content={"message": "Prediction completed successfully.", f"${model}": metrics},
                            status_code=200)

    except Exception as e:
        logger.error(f"An error occurred in {model} prediction: {e}", exc_info=True)
        return Response(content=f"An error occurred: {e}", status_code=500)


async def run_prediction_one(model: str, folder_root_name: str, folder_name: str, channels: List[str]):
    predictions_folder = f"/app/output/{folder_name}/{model}"

    try:
        upload_dir = "/app/input"
        full_extract_path = os.path.join(upload_dir, folder_root_name) + '/*.edf'

        # Log found files
        for root, dirs, files in os.walk(full_extract_path):
            for file in files:
                file_path = os.path.join(root, file)

        # Remove existing prediction folder if exists
        if os.path.exists(predictions_folder):
            shutil.rmtree(predictions_folder)

        logger.debug(f"Running {model} prediction for {full_extract_path}")
        logger.debug(f"Predictions will be saved in {predictions_folder}")

        await run_command_for_prediction_one(model, full_extract_path, predictions_folder, channels)
        # Set folder permissions
        os.chmod(predictions_folder, 0o777)

        # metrics = calculate_metrics_for_files(predictions_folder, model)

        return JSONResponse(content={"message": "Prediction completed successfully."},
                            status_code=200)

    except Exception as e:
        error_message = f"An error occurred in {model} prediction: {e}"
        logger.error(error_message, exc_info=True)
        return Response(content=error_message, status_code=500)


async def run_ensemble(folder_name: str, models: List[str]):
    # for each subject in folder_name
    folder_path = '/app/output/' + folder_name

    ensemble_dir = os.path.join(folder_path, "ensemble")
    os.makedirs(ensemble_dir, exist_ok=True)

    grouped_files = defaultdict(lambda: {'npy': [], 'TRUE': []})

    for model in models:
        majority_dir = os.path.join(folder_path, model, "majority")
        true_dir = os.path.join(folder_path, model, "TRUE_files")

        if not os.path.exists(majority_dir):
            logger.warning(f"Directory not found: {majority_dir}")
            continue

        for file in os.listdir(majority_dir):
            if file.endswith('.npy') and 'TRUE' not in file:
                base_name = file.replace('_PRED.npy', '')
                grouped_files[base_name]['npy'].append(os.path.join(majority_dir, file))

        if os.path.exists(true_dir):
            for file in os.listdir(true_dir):
                if file.endswith('TRUE.npy'):
                    base_name = file.replace('_TRUE.npy', '')
                    grouped_files[base_name]['TRUE'].append(os.path.join(true_dir, file))

    for key, file_groups in grouped_files.items():
        npy_data = [np.load(f) for f in file_groups['npy']]

        true_data = [np.load(f) for f in file_groups['TRUE']]

        ensemble_pred = unweighted_predict_proba_ensemble(npy_data)

        ensemble_majority_dir = os.path.join(ensemble_dir, "majority")
        os.makedirs(ensemble_majority_dir, exist_ok=True)

        ensemble_file_path = os.path.join(ensemble_majority_dir, f"{key}_PRED.npy")
        np.save(ensemble_file_path, ensemble_pred)

        ensemble_true_dir = os.path.join(ensemble_dir, "TRUE_files")
        os.makedirs(ensemble_true_dir, exist_ok=True)

        true_file_path = os.path.join(ensemble_true_dir, f"{key}_TRUE.npy")
        np.save(true_file_path, true_data[0])

    metrics = calculate_metrics_for_files(ensemble_dir, 'ensemble')

    return JSONResponse(content={"message": "Prediction completed successfully.", "ensemble": metrics},
                        status_code=200)


async def run_ensemble_one(folder_name: str, models: List[str]):
    # for each subject in folder_name
    folder_path = '/app/output/' + folder_name

    ensemble_dir = os.path.join(folder_path, "ensemble")
    os.makedirs(ensemble_dir, exist_ok=True)
    logger.debug(f"Running ensemble prediction for {folder_name}")
    logger.debug(f"Predictions will be saved in {ensemble_dir}")
    grouped_files = defaultdict(lambda: {'npy': []})

    for model in models:
        majority_dir = os.path.join(folder_path, model, "majority")

        if not os.path.exists(majority_dir):
            logger.warning(f"Directory not found: {majority_dir}")
            continue

        for file in os.listdir(majority_dir):
            if file.endswith('.npy'):
                logger.debug(f"File found: {file}")
                base_name = file.replace('_PRED.npy', '')
                grouped_files[base_name]['npy'].append(os.path.join(majority_dir, file))
                logger.debug(f"Added file: {base_name}")

    for key, file_groups in grouped_files.items():
        npy_data = [np.load(f) for f in file_groups['npy']]

        ensemble_pred = unweighted_predict_proba_ensemble(npy_data)

        ensemble_majority_dir = os.path.join(ensemble_dir, "majority")
        os.makedirs(ensemble_majority_dir, exist_ok=True)

        ensemble_file_path = os.path.join(ensemble_majority_dir, f"{key}_PRED.npy")
        np.save(ensemble_file_path, ensemble_pred)

    return JSONResponse(content={"message": "Prediction completed successfully."},
                        status_code=200)


@app.post("/evaluate")
async def evaluate(folder_root_name: str = Form(...), folder_name: str = Form(...),
                   eeg_channels: List[str] = Form(...), eog_channels: List[str] = Form(...),
                   emg_channels: List[str] = Form(...), dataset: str = Form(...), model: str = Form(...)):
    return await run_evaluation(model, folder_root_name, folder_name, eeg_channels, eog_channels,
                                dataset)


@app.post("/predict_one")
async def prediction(folder_root_name: str = Form(...), folder_name: str = Form(...),
                     channels: List[str] = Form(...), model: str = Form(...)):
    return await run_prediction_one(model, folder_root_name, folder_name, channels)


@app.post("/ensemble")
async def ensemble(folder_name: str = Form(...), models: List[str] = Form(...)):
    return await run_ensemble(folder_name, models)


@app.post("/ensemble_one")
async def ensemble_one(folder_name: str = Form(...), models: List[str] = Form(...)):
    return await run_ensemble_one(folder_name, models)


@app.post("/get_channels")
async def get_channels_from_hparam(dataset: str = Query(...)):
    yaml_path = f"/app/uSLEEPYLAND/u-sleep-nsrr-2022/hyperparameters/dataset_configurations/{dataset}.yaml"
    try:
        with open(yaml_path, "r") as f:
            hparam_content = yaml.safe_load(f)

        load_time_channel_sampling_groups = hparam_content.get("channel_sampling_groups", [])

        eeg_channels = load_time_channel_sampling_groups[0] if len(load_time_channel_sampling_groups) > 0 else []
        eog_channels = load_time_channel_sampling_groups[1] if len(load_time_channel_sampling_groups) > 1 else []
        emg_channels = load_time_channel_sampling_groups[2] if len(load_time_channel_sampling_groups) > 2 else []

        return JSONResponse(
            content={"eeg_channels": eeg_channels, "eog_channels": eog_channels, "emg_channels": emg_channels})

    except Exception as e:
        error_message = f"An error occurred: {e}"
        logger.error(error_message, exc_info=True)
        return Response(content=error_message, status_code=500)


@app.post("/init_models")
async def init_models():
    try:
        result = subprocess.run(
            ["python", "./utime/bin/ut.py", "init", "--name", "deepresnet-nsrr-2022", "--model", "deepresnet",
             "--overwrite"],
            capture_output=True, text=True)

        result = subprocess.run(
            ["python", "./utime/bin/ut.py", "init", "--name", "usleep-nsrr-2022", "--model", "usleep", "--overwrite"],
            capture_output=True, text=True)

        if result.returncode != 0:
            logger.error(f"Command failed: {result.stderr.strip()}")
            return Response(content=result.stderr, status_code=500)

        return JSONResponse(content={"message": "Models initialized successfully."}, status_code=200)

    except Exception as e:
        error_message = f"An error occurred: {e}"
        logger.error(error_message, exc_info=True)
        return Response(content=error_message, status_code=500)


def _prepare_predictions(predictions):
    """
    Stacks the predictions from multiple classifiers into a single numpy array.

    Args:
        predictions:
            list of numpy arrays of shape [n_samples, n_classes] containing the predicted probabilities

    Returns:
        A numpy array of shape [n_samples, n_classifiers, n_classes] containing the predicted probabilities
        from multiple classifiers.

    """
    if not isinstance(predictions, list):
        raise ValueError('predictions must be a list of numpy arrays')

    stacked_predictions = np.stack(predictions, axis=1)
    n_classes = stacked_predictions.shape[2]
    assert n_classes == 5

    return stacked_predictions


def _check_predictions(predictions):
    """Check if the predictions array has the correct size.

    Raises a value error if the array do not contain exactly 3 dimensions:
    [n_samples, n_classifiers, n_classes]

    """
    if predictions.ndim != 3:
        raise ValueError(
            'predictions must contain 3 dimensions: '
            '[n_samples, n_classifiers, n_classes]. Currently'
            'predictions has {} dimensions'.format(predictions.ndim))


def unweighted_predict_proba_ensemble(predictions):
    """
    Calculate the unweighted average (i.e. all classifiers are equally important) of the predicted probabilities from multiple classifiers.

    Args:
        predictions:
            A list of numpy arrays of shape [n_samples, n_classes] containing the predicted probabilities

    Returns:
        A numpy array of shape [n_samples, n_classes] containing the unweighted average of the predicted probabilities
        from multiple classifiers.
    """

    # read the predictions from the models

    predictions = _prepare_predictions(predictions)
    _check_predictions(predictions)
    ensemble_proba = np.mean(predictions, axis=1)

    return ensemble_proba


def weighted_predict_proba_ensemble(predictions, weights):
    """
    Calculate the weighted average of the predicted probabilities from multiple classifiers.

    Args:
        predictions:
            A list of numpy arrays of shape [n_samples, n_classes] containing the predicted probabilities
        weights:
            A numpy array of shape [n_classifiers] containing the weights to apply to each classifier.

    Returns:
        A numpy array of shape [n_samples, n_classes] containing the weighted average of the predicted probabilities
        from multiple classifiers.

    """
    predictions = _prepare_predictions(predictions)
    _check_predictions(predictions)
    ensemble_proba = np.average(predictions, axis=1, weights=weights)

    return ensemble_proba

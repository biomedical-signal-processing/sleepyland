from flask import Blueprint, request, render_template, send_file
from app.services.prediction_service import send_to_evaluation_service, handle_download_block, sent_to_prediction_one_service
from app.services.download_service import send_to_download_service
from app.services.graph_service import create_hypnogram, create_hypnodensity_graph
from app.services.metrics_service import compute_metrics
from app.services.get_channel_service import get_channels_from_hparam
from app.utils.file_validation import validate_files
from app.utils.file_handling import clear_directory, save_uploaded_files, save_edf_file
from app.utils.logging_config import configure_logging
from flask import jsonify
import pandas as pd
import os
import shutil

log = configure_logging()

bp = Blueprint('main', __name__)


@bp.route('/')
def index():
    return render_template('index.html')


@bp.route('/create_heatmap', methods=['POST'])
def create_heatmap():
    # Heatmap creation logic here
    pass


@bp.route('/get_studies', methods=['GET'])
def get_studies():
    output_folder = '/app/output'

    studies = [name for name in os.listdir(output_folder) if os.path.isdir(os.path.join(output_folder, name))]

    return jsonify(studies), 200


@bp.route('/get_channels', methods=['POST'])
def get_channels():
    dataset_selected = request.json.get('dataset-select')
    channels = get_channels_from_hparam(dataset_selected)
    return jsonify(channels), 200

@bp.route('/get_reference_metrics', methods=['POST'])
def get_reference_metrics():
    model = request.json.get("model")
    metrics_df = pd.read_csv("utils/all_models_metrics.csv", index_col=[0, 1])
    means = metrics_df.xs("mean", level=1).loc[:, [col for col in metrics_df.columns if "Global" in col or "F1" in col]].loc[model,:]
    stds = metrics_df.xs("std", level=1).loc[:,[col for col in metrics_df.columns if "Global" in col or "F1" in col]].loc[model,:]

    return jsonify({"means": means.to_dict(), "stds": stds.to_dict()}), 200


@bp.route('/download_data', methods=['POST'])
def download_data():
    data = request.get_json()

    token = data.get('token')
    selected_datasets = data.get('subjectsList')

    response = send_to_download_service(token, selected_datasets)

    return response


@bp.route('/output/<path:filename>', methods=['GET'])
def download_csv(filename):
    return send_file(f'/app/output/{filename}', as_attachment=True)


@bp.route('/<study>/directories', methods=['GET'])
def get_directories(study):
    dynamics_path = f'/app/output/{study}/dynamics'

    if not os.path.exists(dynamics_path):
        # return free list of directories
        return jsonify([])

    try:
        directories = [d for d in os.listdir(dynamics_path) if os.path.isdir(os.path.join(dynamics_path, d))]
        return jsonify(directories)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/reset-directories")
async def reset_directories():
    try:
        input_directory = "./input"
        output_directory = "./output"

        clear_directory(input_directory)
        clear_directory(output_directory)

        return {"message": "Directories reset successfully"}
    except Exception as e:
        return {"error": f"An error occurred: {e}"}

@bp.post("/quit")
async def quit_system():
    try:
        os.system("docker compose down")
        return {"message": "Server stopped successfully"}
    except Exception as e:
        return {"error": f"An error occurred: {e}"}

@bp.route('/process', methods=['POST'])
def process():
    folder_name = request.form.get('folderName')
    files = request.files.getlist('files')
    dataset = request.form.get('dataset-select')
    download_dataset = request.form.get('dataset-select-download')
    eeg_channels = request.form.get('eeg-channels')
    eog_channels = request.form.get('eog-channels')
    # emg_channels = request.form.get('emg-channels')
    emg_channels = ['']
    download_block = request.form.get('downloadBlock')
    models_selected = request.form.get('models')

    try:

        if download_block == "true":
            response = handle_download_block(download_dataset, folder_name, eeg_channels, eog_channels, emg_channels,
                                             models_selected)
        else:
            is_valid, error_response, status_code = validate_files(files)
            if not is_valid:
                return jsonify(error_response), status_code

            if dataset == "learn":
                source_folder = "/app/learn_edfs"

                destination_folder = "/app/input/learn"

                if not os.path.exists(destination_folder):
                    os.makedirs(destination_folder)

                for file_name in os.listdir(source_folder):
                    source_file = os.path.join(source_folder, file_name)
                    destination_file = os.path.join(destination_folder, file_name)

                    if os.path.isfile(source_file):
                        shutil.copy2(source_file, destination_file)

                folder_root_name = "learn"

            else:
                is_valid, error_response, status_code = validate_files(files)
                if not is_valid:
                    return jsonify(error_response), status_code

                folder_root_name = save_uploaded_files(files)

            response = send_to_evaluation_service(folder_root_name, folder_name, eeg_channels, eog_channels,
                                                  emg_channels,
                                                  dataset, models_selected)

        if response.status_code == 500:
            return jsonify(
                {'error': f'Prediction failed with status code: {response.status_code}'}), response.status_code

        metrics = response.json()

        json_metrics = compute_metrics(metrics, log)

        models_selected = models_selected.split(",")
        create_hypnogram(folder_name, models_selected, False, log)
        create_hypnodensity_graph(folder_name, models_selected, log)

        return jsonify({
            'message': 'Processing complete',
            'metrics': json_metrics
        }), 200

    except Exception as e:
        log.error(f"An error occurred: {str(e)}")
        return jsonify({'error': f'An error occurred app.py: {e}'}), 500


@bp.route('/process_one', methods=['POST'])
def process_one():
    folder_name = request.form.get('folderName')
    uploaded_file = request.files.get('edf-file')
    models_selected = request.form.get('models')
    channels_selected = request.form.get('channels')

    log.debug(f"folder_name: {folder_name}")
    log.debug(f"file: {uploaded_file}")
    log.debug(f"models_selected: {models_selected}")
    log.debug(f"channels_selected: {channels_selected}")

    channels_selected = channels_selected.split(",")

    #to upper case
    channels_selected = [x.upper() for x in channels_selected]

    try:

        #is_valid, error_response, status_code = validate_files(files)
        #if not is_valid:
        #   return jsonify(error_response), status_code

        folder_root_name = save_edf_file(uploaded_file)

        log.debug(f"folder_root_name: {folder_root_name}")

        response = sent_to_prediction_one_service(folder_root_name, folder_name, channels_selected, models_selected)

        if response.status_code == 500:
            return jsonify(
                {'error': f'Prediction failed with status code: {response.status_code}'}), response.status_code


        models_selected = models_selected.split(",")
        create_hypnogram(folder_name, models_selected, True, log)


        create_hypnodensity_graph(folder_name, models_selected, log)

        return jsonify({
            'message': 'Processing complete',
        }), 200

    except Exception as e:
        log.error(f"An error occurred: {str(e)}")
        return jsonify({'error': f'An error occurred app.py: {e}'}), 500
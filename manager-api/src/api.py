from fastapi import FastAPI, File, UploadFile, Form, Query
from fastapi.responses import StreamingResponse, Response, JSONResponse
from utils import harmonize_service, predict_service, predict_one_service
import os, shutil
import requests
import logging
import subprocess

app = FastAPI()
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

U_SLEEP_GET_CHANNELS_URL = "http://usleepyland:7777/get_channels"
NSRR_DOWNLOAD_URL = "http://nsrr-download:8500/download_data"
DYNAMICS_URL = "http://dynamics:8850/dynamics"


@app.post("/get_channels")
async def get_all_channels(dataset: str = Query(...)):
    response = requests.post(U_SLEEP_GET_CHANNELS_URL, params={'dataset': dataset})

    if response.status_code == 200:
        data = response.json()
        return JSONResponse(content=data, media_type="application/json")

    return JSONResponse(content={"error": "An error occurred while fetching channels."}, media_type="application/json",
                        status_code=500)


@app.post("/download_data")
async def download_data(token: str = Form(...), selected_datasets: list[str] = Form(...)):
    try:
        response = requests.post(NSRR_DOWNLOAD_URL, data={'token': token, 'selected_datasets': selected_datasets})

        if response.status_code != 200:
            return JSONResponse(content={"error": "An error occurred while downloading data. Token may be invalid."},
                                media_type="application/json",
                                status_code=500)

        return JSONResponse(content={"message": "Data downloaded successfully."}, media_type="application/json")

    except subprocess.CalledProcessError as e:
        return JSONResponse(content={"error": f"An error occurred in download_data: {e}"},
                            media_type="application/json",
                            status_code=500)


@app.post("/harmonize")
async def harmonize_data(dataset: str = Form(...)):
    try:
        harmonize_service(dataset)
        return JSONResponse(content={"message": "Data harmonized successfully."}, media_type="application/json")

    except Exception as e:
        return JSONResponse(content={"error": f"An error occurred in harmonize_data: {e}"},
                            media_type="application/json",
                            status_code=500)


async def handle_prediction_response(response):
    """Handles response from the prediction service."""
    metrics = response.get("metrics", [])

    if not metrics:  # Check if the metrics array is empty
        return JSONResponse(content={"message": "Prediction failed"}, status_code=500)

    return JSONResponse(content=metrics, status_code=200)


async def perform_evaluation(folder_root_name, folder_name, eeg_channels, eog_channels, emg_channels, dataset, models, resolution):
    """Performs evaluation using the predict_service and handles exceptions."""
    try:
        response = predict_service(folder_root_name, folder_name, eeg_channels, eog_channels, emg_channels, dataset,
                                   models, resolution)
        return await handle_prediction_response(response)
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return JSONResponse(content={"error": f"An error occurred in api.py: {e}"}, status_code=500)


async def perform_prediction_one(folder_root_name, folder_name, channels, models, resolution):
    """Performs prediction using the predict_service and handles exceptions."""
    try:
        response = predict_one_service(folder_root_name, folder_name, channels, models, logger, resolution)
        return response
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return JSONResponse(content={"error": f"An error occurred in api.py: {e}"}, status_code=500)


@app.post("/evaluate")
async def evaluate(folder_root_name: str = Form(...), folder_name: str = Form(...),
                  eeg_channels: list[str] = Form(...), eog_channels: list[str] = Form(...),
                  emg_channels: list[str] = Form(...), dataset: str = Form(...),
                  models: list[str] = Form(...), resolution: str | None = Form(None)):
    return await perform_evaluation(folder_root_name, folder_name, eeg_channels, eog_channels, emg_channels, dataset,
                                    models, resolution)


@app.post("/predict_one")
async def predict(folder_root_name: str = Form(...), folder_name: str = Form(...), channels: list[str] = Form(...),
                  models: list[str] = Form(...), resolution: str | None = Form(None)):
    return await perform_prediction_one(folder_root_name, folder_name, channels,
                                        models, resolution)


@app.post("/auto_evaluate")
async def auto_evaluate(folder_root_name: str = Form(...), folder_name: str = Form(...),
                       eeg_channels: list[str] = Form(...), eog_channels: list[str] = Form(...),
                       emg_channels: list[str] = Form(...), dataset: str = Form(...),
                       models: list[str] = Form(...), resolution: str | None = Form(None)):
    try:
        harmonization_done = harmonize_service(dataset)
        actual_folder_root_name = dataset if harmonization_done else folder_root_name
        return await perform_evaluation(actual_folder_root_name, folder_name, eeg_channels, eog_channels, emg_channels,
                                        dataset, models, resolution)
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return JSONResponse(content={"error": f"An error occurred in api.py: {e}"}, status_code=500)


@app.post("/process_dynamics")
async def process_dynamics(age: str = Form(...), gender: str = Form(...), study: str = Form(...)):
    try:

        requests.post(DYNAMICS_URL, data={'age': age, 'gender': gender, 'study': study})

        return JSONResponse(content={"message": "Dynamics completed successfully."}, media_type="application/json",
                            status_code=200)

    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return JSONResponse(content={"error": f"An error occurred in api.py (process dynamics): {e}"},
                            media_type="application/json",
                            status_code=500)

from fastapi import FastAPI, File, UploadFile, Response, Form, Query
from fastapi.responses import FileResponse, JSONResponse
from typing import List
import subprocess
import os
import shutil
import logging

app = FastAPI()

logger = logging.getLogger(__name__)

SCRIPT_PATH = '/app/nsrr_download.sh'

def run_command(command: list) -> subprocess.CompletedProcess:
    """Run a command and return the result."""
    try:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"Command failed: {command} | Error: {result.stderr.strip()}")
            raise RuntimeError(f"Command failed with error: {result.stderr.strip()}")
        return result
    except Exception as e:
        logger.exception("An error occurred while running the command.")
        raise e


def create_input_folder(edf_file: str) -> str:
    """Create an input folder for the EDF file."""
    input_folder = os.path.join('/app/input', os.path.splitext(os.path.basename(edf_file))[0])
    os.makedirs(input_folder, exist_ok=True)
    return input_folder


def move_file(src: str, dest: str):
    """Move a file from src to dest."""
    try:
        shutil.move(src, dest)
        logger.info(f"Moved file from {src} to {dest}")
    except Exception as e:
        logger.exception(f"Error moving file from {src} to {dest}.")
        raise e


def clean_up(folder_name: str):
    """Remove the folder specified."""
    try:
        shutil.rmtree(os.path.join('/app', folder_name))
        logger.info(f"Cleaned up folder: /app/{folder_name}")
    except Exception as e:
        logger.exception(f"Error cleaning up folder: /app/{folder_name}.")
        raise e


@app.post("/download_data")
async def download_data(token: str = Form(...), selected_datasets: List[str] = Form(...)):
    """Download datasets based on the selected datasets."""

    for dataset in selected_datasets:
        try:
            edf_file, xml_file = dataset.split("+")

            folder_name = edf_file.split('/')[0]

            run_command(["expect", SCRIPT_PATH, token, edf_file])

            input_folder = create_input_folder(edf_file)

            if not os.path.exists(f'/app/{edf_file}'):
                raise FileNotFoundError(f"EDF file not found at /app/{edf_file}")
            else:
                move_file(f'/app/{edf_file}', os.path.join(input_folder, os.path.basename(edf_file)))

                clean_up(folder_name)

                run_command([SCRIPT_PATH, token, xml_file])

                move_file(f'/app/{xml_file}', os.path.join(input_folder, os.path.basename(xml_file)))

                clean_up(folder_name)

        except Exception as e:
            return JSONResponse(content={"error": str(e)}, status_code=500)

    return JSONResponse(content={"message": "Data downloaded successfully."}, status_code=200)


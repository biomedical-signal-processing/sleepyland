import json
import os
import shutil
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException, Form

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)
app = FastAPI()


def run_command(command):
    result = subprocess.run(command, capture_output=True)
    if result.returncode != 0:
        raise Exception(f"Command failed: {result.stderr.decode()}")


def find_file_recursively(directory, file_extension=None, file_contains=None):
    for root, _, files in os.walk(directory):
        for file in files:
            if file_extension and file.endswith(file_extension):
                return os.path.join(root, file)
            if file_contains and file_contains in file:
                return os.path.join(root, file)
    return None


def get_command_from_json(json_file, dataset_name, file_regex, out_dir):
    with open(json_file, 'r') as f:
        data = json.load(f)

    for jsonObject in data['datasets']:
        if jsonObject['name'] == dataset_name:
            command = [arg.replace("{file_regex}", file_regex).replace("{out_dir}", out_dir) for arg in
                       jsonObject['command_template']]
            return command

    return None


@app.post("/harmonize")
async def harmonize(folder_name: str = Form(...), dataset: str = Form(...)):
    input_base_dir = "/app/input"
    os.makedirs(input_base_dir, exist_ok=True)

    extract_dir = os.path.join(input_base_dir, folder_name)

    logger.debug(f"Extracting to: {extract_dir}")

    os.makedirs(extract_dir, exist_ok=True)

    extracted_items = os.listdir(extract_dir)

    edf_files = []
    xml_files = []

    for file in extracted_items:
        if file.endswith('.edf') or file.endswith('.EDF'):
            edf_files.append(file)
        elif file.endswith('.xml') or file.endswith('.STA') or file.endswith('.annot') or file.endswith('.tsv') or file.endswith('.txt') or file.endswith('.ids'):
            xml_files.append(file)

    if not edf_files and not xml_files:
        raise HTTPException(status_code=400, detail="No EDF or XML file found.")

    processed_output_dir = os.path.join(input_base_dir, dataset)

    for edf_file in edf_files:
        edf_path = os.path.join(extract_dir, edf_file)

        dataset_json_file = '/app/wild-to-fancy/src/dataset_commands.json'

        command = get_command_from_json(dataset_json_file, dataset, edf_path, processed_output_dir)

        run_command(command)
        os.remove(edf_path)

    for xml_file in xml_files:
        xml_path = os.path.join(extract_dir, xml_file)

        annotations_json_file = '/app/wild-to-fancy/src/annotation_commands.json'

        command = get_command_from_json(annotations_json_file, dataset, xml_path, processed_output_dir)

        run_command(command)
        os.remove(xml_path)

    log_dir = os.path.join(processed_output_dir, "logs")
    if os.path.exists(log_dir):
        shutil.rmtree(log_dir)

    shutil.rmtree(extract_dir)

    processed_files = os.listdir(processed_output_dir)

    if processed_files:
        return {"message": "Files processed successfully", "files": processed_files}
    else:
        raise HTTPException(status_code=500, detail="No processed files found.")
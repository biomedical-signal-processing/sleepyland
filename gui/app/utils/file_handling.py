import os
import shutil


def save_uploaded_files(files):
    folder_root_name = ""
    for file in files:
        relative_path = file.filename
        folder_root_name = relative_path.split("/")[0]

        save_path = os.path.join('/app/input', relative_path)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        file.save(save_path)
    return folder_root_name

def save_edf_files(files, log):
    save_dir = '/app/input/myedf'
    os.makedirs(save_dir, exist_ok=True)  # Ensure the directory exists

    for file in files:
        log.debug(f"Processing file: {file.filename}")

        # Construct full file path
        file_path = os.path.join(save_dir, file.filename)
        log.debug(f"Saving to: {file_path}")

        try:
            file.save(file_path)
            log.info(f"File saved: {file_path}")
        except Exception as e:
            log.error(f"Error saving file {file.filename}: {e}")


def clear_directory(directory: str):
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

def delete_file_performance():
    folder = '/app/static/performances/'
    for filename in os.listdir(folder):
        if filename == 'models_performances.csv':
            continue
        file_path = os.path.join(folder, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")
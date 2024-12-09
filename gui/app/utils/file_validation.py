def validate_files(files):
    if not files or any(file.filename == '' for file in files):
        return False, {'error': 'No files provided or empty filenames'}, 400
    return True, None, None

export const toggleUploadContainerVisibility = (isUpload) => {
    document.getElementById('upload-container').style.display = isUpload ? 'block' : 'none';
    document.getElementById('folderName-container').style.display = isUpload ? 'block' : 'none';
    document.getElementById('channels-container').style.display = isUpload ? 'block' : 'none';
    document.getElementById('download-container').style.display = isUpload ? 'none' : 'block';
    document.getElementById('nsrrData-container').style.display = isUpload ? 'none' : 'block';
};

export const reset_directories = async () => {
    const response = await fetch('/reset-directories', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        const data = await response.json();
    } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
    }
};
export const handleFileInputChange = (event) => {
    const files = event.target.files;
    const folderPaths = new Set();

    for (const file of files) {
        const path = file.webkitRelativePath || file.name;
        const folderPath = path.substring(0, path.lastIndexOf('/'));
        if (folderPath) folderPaths.add(folderPath);
    }

    document.getElementById('folderCount').textContent = `${folderPaths.size} Sleep Studies`;
};

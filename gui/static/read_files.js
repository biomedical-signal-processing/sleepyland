document.addEventListener('DOMContentLoaded', () => {
    // Get references to the dataset and file select elements
    const datasetSelect = document.getElementById('dataset-select-download');
    const fileSelect = document.getElementById('file-select-download');

    // Function to get the list of files for download
    const getFileList = async () => {
        return [
            "abc_edf_files.txt", "apoe_edf_files.txt", "apples_edf_files.txt",
            "ccshs_edf_files.txt", "cfs_edf_files.txt", "chat_edf_files.txt",
            "homepap_edf_files.txt", "mesa_edf_files.txt", "mnc_cnc_edf_files.txt",
            "mnc_dhc_edf_files.txt", "mnc_ssc_edf_files.txt", "mros_edf_files.txt",
            "msp_edf_files.txt", "nchsdb_edf_files.txt", "shhs_edf_files.txt",
            "sof_edf_files.txt", "wsc_edf_files.txt"
        ];
    };

    // Function to fetch the content of a specified file
    const fetchFileContent = async (file) => {
        try {
            const response = await fetch(`./static/nsrr_file_path/${file}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error(`Error fetching file ${file}:`, error);
            return ''; // Return empty string in case of an error
        }
    };

    // Function to parse file content into an array of lines
    const parseFileContent = (text) => {
        return text.split('\n')
            .map(line => line.trim().replace(/^\//, '')) // Remove leading slashes
            .filter(line => line !== ''); // Filter out empty lines
    };

    // Function to read content from a file and its associated annotation file
    const readFileContent = async (file) => {
        const dataset = file.split('_')[0]; // Extract the dataset prefix

        // Fetch file and annotation content concurrently
        const [fileContent, annotationContent] = await Promise.all([
            fetchFileContent(file),
            fetchFileContent(`${dataset}_annotation_files.txt`)
        ]);

        // Parse the contents of both files
        const lines = parseFileContent(fileContent);
        const annotations = parseFileContent(annotationContent);

        // Combine file names and annotations into an array of objects
        return lines.map((line, index) => {
            const fileName = line.split('/').pop().split('.').shift(); // Extract the file name

            if (line.split(',')[1] === '*' && line.split(',')[2] === '+')
                return {value: `${line.split(',')[0]}+${annotations[index]}`, name: fileName + ' † *'}
            else if (line.split(',')[1] === '*')
                return {value: `${line.split(',')[0]}+${annotations[index]}`, name: fileName + ' †'}
            else if (line.split(',')[2] === '+')
                return {value: `${line.split(',')[0]}+${annotations[index]}`, name: fileName + ' *'}
            else
                return {value: `${line.split(',')[0]}+${annotations[index]}`, name: fileName};
        });
    };

    // Function to update the file select options based on fetched data
    const updateFileSelect = (options) => {
        document.getElementById('file-select-download-button').textContent = '- Select Recordings -';
        fileSelect.innerHTML = ''; // Clear existing options
        options.forEach(option => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <label class="form-check ms-2">
                    <input class="form-check-input subject-checkbox" type="checkbox" value="${option.value}" name="${option.name.toLowerCase()}"> 
                    <span 
                        class="file-name" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="right" 
                        title="Dataset in train e val per DL e yasa">
                        ${option.name}
                    </span>
                </label>`;
            fileSelect.appendChild(listItem); // Append new option to the list
        });

        const checkboxes = document.querySelectorAll('.subject-checkbox');
        const button = document.getElementById('file-select-download-button');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                updateButtonLabel();
            });
        });

        const updateButtonLabel = () => {
            const selectedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;

            if (selectedCount === 0) {
                button.textContent = '- Select Recordings -';
            } else {
                button.textContent = `${selectedCount} Recordings Selected`;
            }
        }

        const items = document.querySelectorAll('.file-name');

        items.forEach(item => {
            const text = item.textContent;

            if (text.includes('†') && text.includes('*')) {
                item.setAttribute('title', 'Recording used for training in DL models and YASA');
            } else if (text.includes('*')) {
                item.setAttribute('title', 'Recording used for training in DL models');
            } else if (text.includes('†')) {
                item.setAttribute('title', 'Recording used for training in YASA');
            } else {
                item.setAttribute('title', '');
            }

            new bootstrap.Tooltip(item);
        });
    };

    // Function to process the selected dataset and update the file options
    const processSelectedDataset = async (dataset) => {
        const fileList = await getFileList(); // Get the list of files
        const fileToRead = fileList.find(file => file.startsWith(dataset)); // Find the relevant file

        if (fileToRead) {
            const options = await readFileContent(fileToRead); // Read file content
            updateFileSelect(options); // Update the file select options
        }
    };

    // Event listener for dataset selection change
    datasetSelect.addEventListener('change', (event) => {
        const selectedDataset = event.target.value; // Get the selected dataset
        processSelectedDataset(selectedDataset); // Process the new selection
    });

    // Initial call to process a default dataset
    processSelectedDataset('abc');
});
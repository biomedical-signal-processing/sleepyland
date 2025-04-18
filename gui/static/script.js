let isDarkMode = false; // Flag to determine if dark mode is enabled
let currentSlide = 0; // Index of the current slide
let totalSlides = 0; // Total number of slides

// Initialize theme and UI settings after DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    const datasetSelect = document.getElementById('dataset-select');
    const filesInput = document.getElementById('files');
    const filesLabel = document.getElementById('files-label');


    if (datasetSelect && filesInput) {
        filesInput.style.display = datasetSelect.value === 'learn' ? 'none' : 'block';
        filesLabel.style.display = datasetSelect.value === 'learn' ? 'none' : 'block';
        datasetSelect.addEventListener('change', function () {
            filesInput.style.display = this.value === 'learn' ? 'none' : 'block';
            filesLabel.style.display = this.value === 'learn' ? 'none' : 'block';
        });
    }

    // Button groups by style
    const buttonGroups = {
        primary: [
            'tutorialButton',
            'nsrrButton',
            'uploadButton',
            'downloadNsrrButton',
            'openSourceButton',
            'proprietaryDataButton',
            'submitButton',
            'submitSleepDynamics',
            'predictButton'
        ],
        secondary: [
            'download-nsrr-files',
            'errorDynamicsCloseButton',
            'resetButton',
            'next',
            'prev',
            'nextHypno',
            'prevHypno',
            'nextPerformance',
            'prevPerformance',
        ],
        warning: ['notebookButton'],
    };

    // Detects and applies dark mode settings
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled');

    document.getElementById('download-card').style.backgroundColor = isDarkMode ? '#272a2e' : '#f7f7f7';
    document.getElementById('card-uploader').style.backgroundColor = isDarkMode ? '#272a2e' : '#f7f7f7';
    document.getElementById('channels-card').style.backgroundColor = isDarkMode ? '#272a2e' : '#f7f7f7';
    document.getElementById('algorithms-select').style.backgroundColor = isDarkMode ? '#272a2e' : '#f7f7f7';
    document.getElementById('file-select-download-button').style.backgroundColor = isDarkMode ? '#222529' : '#ffffff';

    document.getElementById('dropdownMenuButtonEEG').style.backgroundColor = isDarkMode ? '#222529' : '#ffffff';
    document.getElementById('dropdownMenuButtonEOG').style.backgroundColor = isDarkMode ? '#222529' : '#ffffff';
    document.getElementById('dropdown-menu-button-proprietary-channels').style.backgroundColor = isDarkMode ? '#222529' : '#ffffff';

    document.getElementById('pops-link').style.color = isDarkMode ? '#ffffff' : '#000000';
    document.getElementById('yasa-link').style.color = isDarkMode ? '#ffffff' : '#000000';
    document.getElementById('usleep-link').style.color = isDarkMode ? '#ffffff' : '#000000';
    document.getElementById('deepresnet-link').style.color = isDarkMode ? '#ffffff' : '#000000';
    document.getElementById('transformer-link').style.color = isDarkMode ? '#ffffff' : '#000000';
    document.getElementById('ensemble-link').style.color = isDarkMode ? '#ffffff' : '#000000';
    document.getElementById('lseqsleepnet-link').style.color = isDarkMode ? '#ffffff' : '#000000';

    // Adjust logo and theme based on mode
    document.getElementById('logo').src = isDarkMode
        ? '../static/images/sleepyland_logo_dark.png'
        : '../static/images/sleepyland_logo_light.png';
    document.body.dataset.bsTheme = isDarkMode ? 'dark' : 'light';

    // Apply styles to button groups based on mode
    Object.entries(buttonGroups).forEach(([style, buttons]) => {
        const lightStyle = `btn-${style}`;
        const darkStyle = `btn-outline-${style}`;
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            button.classList.toggle(lightStyle, !isDarkMode);
            button.classList.toggle(darkStyle, isDarkMode);
        });
    });

    updateProprietaryChannelsButton();

    // Populate channels if dataset is pre-selected
    if (datasetSelect.value === 'learn') {
        await fetchAndPopulateChannels('learn');
    }

    // Update channels menu on dataset selection change
    datasetSelect.addEventListener('change', async () => {
        clearChannelMenus();
        if (datasetSelect.value === 'learn') {
            removeRequiredAttribute('files');
        }else {
            addRequiredAttribute('files');
        }
        await fetchAndPopulateChannels(datasetSelect.value);
    });
});

// Event listener for checkbox ensemble
document.addEventListener('DOMContentLoaded', () => {
    const ensembleCheckbox = document.getElementById('ensemble');
    const algorithms = document.querySelectorAll('#algorithms-select input[type="checkbox"]');

    const updateEnsembleCheckboxState = () => {
        let checkedCount = Array.from(algorithms).filter(algorithm => algorithm.checked).length;

        if (ensembleCheckbox.checked) {
            checkedCount = Array.from(algorithms).filter(algorithm => algorithm.checked).length - 1;
        }

        ensembleCheckbox.disabled = checkedCount < 2;

        if (ensembleCheckbox.disabled) {
            ensembleCheckbox.checked = false;
        }
    };

    algorithms.forEach(algorithm => {
        algorithm.addEventListener('change', updateEnsembleCheckboxState);
    });

    // Sync all checkboxes with the "ensemble" checkbox when it changes
    ensembleCheckbox.addEventListener('change', () => {
        updateEnsembleCheckboxState(); // Ensure state consistency
    });

    // Initialize the state on page load
    updateEnsembleCheckboxState();
});

const updateProprietaryChannelsButton = () => {
    //get checkbox of dropdown-menu-button-proprietary-channels
    const button = document.getElementById('dropdown-menu-button-proprietary-channels');
    const checkboxes = document.querySelectorAll('#proprietary-channels-selection-container input[type="checkbox"]:checked');

    // Update button label based on selected channels
    const updateButtonLabel = () => {
        const checkboxes = document.querySelectorAll('#proprietary-channels-selection-container input[type="checkbox"]:checked');
        const selectedChannels = Array.from(checkboxes).map(checkbox => checkbox.value.toUpperCase());

        if (selectedChannels.length === 0) {
            button.textContent = '- Select channels type -';
        } else {
            button.textContent = selectedChannels.join(', ');
        }
    };

    // Adjust selection based on individual checkbox changes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.value === 'eeg') {
                document.getElementById('yasa').disabled = !checkbox.checked;
                document.getElementById('yasa').checked = false;
            }
            updateButtonLabel();
        });
    });

    updateButtonLabel();
}

const addRequiredAttribute = (elementId) => {
    document.getElementById(elementId).required = true;
}

const removeRequiredAttribute = (elementId) => {
    document.getElementById(elementId).required = false;
}

// Clears the content of all channel menus
const clearChannelMenus = () => {
    // ['eegChannelMenu', 'eogChannelMenu', 'emgChannelMenu'].forEach(id => {
    //     document.getElementById(id).innerHTML = '';
    // });
    document.getElementById('dropdownMenuButtonEEG').textContent = 'All channels';
    document.getElementById('dropdownMenuButtonEOG').textContent = 'All channels';
    ['eegChannelMenu', 'eogChannelMenu'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
}

// Populates the channel menu with options from a channel list
const populateMenu = (menuElement, channelList, buttonElement, selectAllId, selectNoneId) => {
    menuElement.innerHTML = '';

    if (channelList.length === 0) {
        // If no channels available, show placeholder text
        menuElement.innerHTML = `<li><label class="form-check ms-2"> No channels</label></li>`;
    } else {
        // Add "All" and "None" selection option
        menuElement.innerHTML = `
            <li><label class="form-check ms-2"><input type="checkbox" class="form-check-input" id="${selectAllId}" checked> All</label></li>
            <li><label class="form-check ms-2"><input type="checkbox" class="form-check-input" id="${selectNoneId}"> None</label></li>
            <li><hr class="dropdown-divider"></li>
        `;
        // Add each channel as a selectable checkbox
        channelList.forEach(channel => {
            menuElement.insertAdjacentHTML('beforeend', `
                <li><label class="form-check ms-2"><input type="checkbox" class="form-check-input" value="${channel}" name="channel" checked> ${channel}</label></li>
            `);
        });
        addCheckboxListeners(menuElement, buttonElement, selectAllId, selectNoneId);
    }
}

// Function to fetch and populate channel menus based on selected dataset
const fetchAndPopulateChannels = async (dataset) => {
    const channelMenus = {
        EEG: {
            button: document.getElementById('dropdownMenuButtonEEG'),
            menu: document.getElementById('eegChannelMenu'),
            selectAllId: 'selectAllEegChannels',
            selectNoneId: 'selectNoneEegChannels'
        },
        EOG: {
            button: document.getElementById('dropdownMenuButtonEOG'),
            menu: document.getElementById('eogChannelMenu'),
            selectAllId: 'selectAllEogChannels',
            selectNoneId: 'selectNoneEogChannels'
        },
        // EMG: {
        //     button: document.getElementById('dropdownMenuButtonEMG'),
        //     menu: document.getElementById('emgChannelMenu'),
        //     selectAllId: 'selectAllEmgChannels',
        //     selectNoneId: 'selectNoneEmgChannels'
        // }
    };

    try {
        const response = await fetch('/get_channels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({'dataset-select': dataset}) // Send the selected dataset to the server
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching channels:', errorData.error);
            return;
        }

        const channels = await response.json(); // Get channels data from response

        // Populate each channel menu
        for (const [key, {menu, button, selectAllId, selectNoneId}] of Object.entries(channelMenus)) {
            populateMenu(menu, channels[`${key.toLowerCase()}_channels`], button, selectAllId, selectNoneId);
        }

    } catch (error) {
        console.error('An error occurred while fetching channels:', error);
    }
}

// Adds listeners to manage individual channel selections and "All" option
const addCheckboxListeners = (menuElement, buttonElement, selectAllId, selectNoneId) => {
    const checkboxes = Array.from(menuElement.querySelectorAll('.form-check-input'));
    const selectAll = menuElement.querySelector(`#${selectAllId}`);
    const selectNone = menuElement.querySelector(`#${selectNoneId}`);

    const standardCheckboxes = checkboxes.filter(checkbox => checkbox !== selectNone && checkbox !== selectAll);

    // Update button label based on selected channels
    const updateButtonLabel = () => {
        const selectedChannels = standardCheckboxes
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        if (selectAll.checked) {
            buttonElement.textContent = 'All channels';
        } else if (selectNone.checked) {
            buttonElement.textContent = 'None';
        } else {
            buttonElement.textContent = selectedChannels.join(', ') || '- Select Channels -';
        }
    };

    // Adjust selection based on individual checkbox changes
    standardCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectNone.checked = false;
                document.getElementById('yasa').disabled = false;
                selectAll.checked = standardCheckboxes.every(cb => cb.checked);
            } else {
                selectAll.checked = false;
            }
            updateButtonLabel();
        });
    });

    selectAll.addEventListener('change', () => {
        const isChecked = selectAll.checked;
        standardCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        selectNone.checked = false;
        if (selectAllId === 'selectAllEegChannels') {
            document.getElementById('yasa').disabled = !selectAll.checked;
        }
        updateButtonLabel();
    });

    selectNone.addEventListener('change', () => {
        if (selectNone.checked) {
            standardCheckboxes.forEach(checkbox => (checkbox.checked = false));
            selectAll.checked = false;
        }
        if (selectNoneId === 'selectNoneEegChannels') {
            document.getElementById('yasa').disabled = selectNone.checked;
            document.getElementById('yasa').checked = false;
        }
        updateButtonLabel();
    });
}

// Event listener for file input change
document.getElementById('files').addEventListener('change', (event) => {
    const files = event.target.files;
    const folderPaths = new Set();
    let edfCounter = 0;

    // Extract folder paths from selected files
    for (let file of files) {
        const path = file.webkitRelativePath || file.name;
        const folderPath = path.substring(0, path.lastIndexOf('/'));

        if (file.name.split('.').pop() === 'edf')
            edfCounter++;

        if (folderPath)
            folderPaths.add(folderPath); // Add unique folder paths to the Set

    }

    // Update the display with the number of unique folders
    if (edfCounter !== 0)
        document.getElementById('folderCount').textContent = `${edfCounter} Sleep Studies`;
    else
        document.getElementById('folderCount').textContent = `${folderPaths.size} Sleep Studies`;
});

// Event listener to show NSRR data container
document.getElementById('nsrrButton').addEventListener('click', () => {
    document.getElementById('nsrrData-container').style.display = 'block';
});

// Event listener to display upload related containers
document.getElementById('uploadButton').addEventListener('click', () => {
    toggleUploadContainerVisibility(true);
    addRequiredAttribute('folderName');
    document.getElementById('transformer').disabled = false;
    document.getElementById('deepresnet').disabled = false;
    const checkboxes = document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    resetUploadForm(); // Reset form fields
    $('#dataModal').modal('hide'); // Hide modal
});

// Event listener for download button
document.getElementById('downloadNsrrButton').addEventListener('click', () => {
    toggleUploadContainerVisibility(false);
    document.getElementById('transformer').disabled = false;
    document.getElementById('deepresnet').disabled = false;
    const checkboxes = document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    resetDownloadForm(); // Reset form fields
    $('#dataModal').modal('hide'); // Hide modal
});

document.getElementById('proprietaryDataButton').addEventListener('click', () => {
    document.getElementById('download-container').style.setProperty('display', 'none', 'important');
    document.getElementById('uploader-container').style.setProperty('display', 'none', 'important');
    document.getElementById('notebookResetButtonsContainer').style.display = 'flex';
    document.getElementById('input-form-container').style.display = 'block';
    document.getElementById('card-uploader').style.display = 'block';
    document.getElementById('proprietary-uploader-container').style.display = 'block';
    document.getElementById('folderName-container').style.display = 'block';
    document.getElementById('channel-selection-container').style.display = 'none';
    document.getElementById('proprietary-channels-selection-container').style.display = 'block';
    document.getElementById('algorithms-select').style.display = 'block';
    document.getElementById('submitButton').disabled = true;
    document.getElementById('predictButton').disabled = false;
    document.getElementById('validationBadgeChannels').classList.add('d-none');
    document.getElementById('validationBadgeAlgorithms').classList.add('d-none');
    document.getElementById('folderName').value = '';

    const checkboxes = document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    removeRequiredAttribute('files');
});

// Function to toggle visibility of upload and related containers
const toggleUploadContainerVisibility = (isUpload) => {
    document.getElementById('proprietary-uploader-container').style.display = 'none';
    document.getElementById('input-form-container').style.display = isUpload ? 'block' : 'none';
    document.getElementById('submitButton').disabled = false;
    document.getElementById('predictButton').disabled = true;
    document.getElementById("validationBadgeEdf").classList.add("d-none");
    document.getElementById("validationBadgeOutputFolder").classList.add("d-none");
    isUpload ? document.getElementById('card-uploader').style.display = 'block' : document.getElementById('card-uploader').style.setProperty('display', 'none', 'important');
    document.getElementById('uploader-container').style.display = isUpload ? 'block' : 'none';
    document.getElementById('folderName-container').style.display = isUpload ? 'block' : 'none';
    document.getElementById('channel-selection-container').style.display = isUpload ? 'block' : 'none';
    document.getElementById('proprietary-channels-selection-container').style.display = 'none';
    document.getElementById('download-container').style.display = isUpload ? 'none' : 'block';
    document.getElementById('nsrrData-container').style.display = isUpload ? 'none' : 'block';
    document.getElementById('algorithms-select').style.display = isUpload ? 'block' : 'none';
    document.getElementById('notebookResetButtonsContainer').style.display = isUpload ? 'flex' : 'none';
    document.getElementById('validationBadgeAlgorithms').classList.add('d-none');
    document.getElementById('validationBadgeTypeChannels').classList.add('d-none');
    document.getElementById('validationBadgeChannels').classList.add('d-none');
}

// Function to reset the upload form fields
const resetUploadForm = () => {
    document.getElementById('folderName').value = '';
    document.getElementById('files').value = '';
    document.getElementById('nsrrToken').required = false;
    // disableElements(['nsrrToken']); // Disable the token and files elements initially
}

// Function to reset the download form fields
const resetDownloadForm = () => {
    document.getElementById('folderName').value = '';
    document.getElementById('nsrrToken').value = '';
    document.getElementById('files').required = false; // No files required for download
    document.getElementById('nsrrToken').required = true; // Ensure token is required
    document.getElementById('nsrrToken').disabled = false; // Enable the token field
    // disableElements(['files']); // Disable fields not required for download
}

// Event listener for downloading NSRR files
document.getElementById('download-nsrr-files').addEventListener('click', async () => {

     const dataset = document.getElementById('dataset-select-download').value;

    // Collect selected datasets from checkboxes
    const selectedDatasets = Array.from(document.querySelectorAll('#file-select-download input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value)
        .filter(value => value !== "on"); // Filter out "on" values

    const token = document.getElementById('nsrrToken').value;

    const validationBadgeToken = document.getElementById("validationBadgeToken");
    const validationBadgeSubjects = document.getElementById("validationBadgeSubjects");

    const isAnySelected = selectedDatasets.length > 0;
    const isTokenValid = token.length > 0;

    validationBadgeSubjects.classList.toggle("d-none", isAnySelected);
    validationBadgeToken.classList.toggle("d-none", isTokenValid);

    if (isAnySelected && isTokenValid) {

        document.getElementById('loading-gif-container').style.display = 'block';
        document.getElementById('download-nsrr-files').disabled = true;
        document.getElementById('file-select-download-button').disabled = true;
        document.getElementById('dataset-select-download').disabled = true;
        document.getElementById('nsrrToken').disabled = true;
        document.getElementById('file-select-download').classList.remove('show');

        await downloadData(token, selectedDatasets, dataset); // Download data
    }
});

// Event listener to show upload container from open source button
document.getElementById('openSourceButton').addEventListener('click', () => {
    toggleUploadContainerVisibility(true);
    document.getElementById('download-container').style.display = 'none';
    document.getElementById('nsrrData-container').style.display = 'none';
});

// Sends a download request for data, updates UI elements, and populates channel options based on dataset
const downloadData = async (token, subjectsList, dataset) => {
    const validationBadgeTokenSubmission = document.getElementById("validationBadgeTokenSubmission");

    try {
        validationBadgeTokenSubmission.classList.toggle("d-none", true);
        // Send POST request to download data with provided token and subjectsList
        const response = await fetch('/download_data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token, subjectsList})
        });

        if (response.ok) {
            // Hide loading indicator and display relevant UI containers
            //toggleDisplay(['loading-gif-container'], 'none');
            toggleDisplay(['folderName-container', 'input-form-container', 'channel-selection-container', 'algorithms-select'], 'block');

            document.getElementById('loading-gif-container').style.setProperty('display', 'none', 'important');
            document.getElementById('notebookResetButtonsContainer').style.display = 'flex'
            document.getElementById('download-nsrr-files').disabled = false;
            document.getElementById('file-select-download-button').disabled = false;
            document.getElementById('dataset-select-download').disabled = false;
            document.getElementById('nsrrToken').disabled = false;

            // Disable UI inputs to prevent further changes during download
            disableElements(['dataset-select-download', 'nsrrToken', 'file-select-download-button', 'download-nsrr-files']);

            // Fetch and populate channels for the specified dataset
            await fetchAndPopulateChannels(dataset);
        } else {
            document.getElementById('loading-gif-container').style.setProperty('display', 'none', 'important');
            document.getElementById('download-nsrr-files').disabled = false;
            document.getElementById('file-select-download-button').disabled = false;
            document.getElementById('dataset-select-download').disabled = false;
            document.getElementById('nsrrToken').disabled = false;
            validationBadgeTokenSubmission.classList.toggle("d-none", false);
        }
    } catch (error) {
        console.error('An error occurred while downloading:', error);
    }
}

// Helper function to toggle display style of multiple elements
const toggleDisplay = (elementIds, displayStyle) => {
    elementIds.forEach(id => {
        document.getElementById(id).style.display = displayStyle;
    });
}

// Helper function to disable multiple elements
const disableElements = (elementIds) => {
    elementIds.forEach(id => {
        document.getElementById(id).disabled = true;
    });
}

// Retrieves selected channels for a given type (eeg, eog, emg) by getting all checked checkboxes in the specified channel menu.
const getSelectedChannels = (type) =>
    [...document.querySelectorAll(`#${type}ChannelMenu input[type="checkbox"]:checked`)]
        .map(c => c.value).filter(v => v !== 'on');  // 'on' check in case default value is present in HTML

// Sends an asynchronous request with form data to the server
async function sendRequest() {
    const button = document.getElementById('submitButton');
    const status = document.getElementById('status');
    const statusHypno = document.getElementById('statusHypno');
    const statusPerformance = document.getElementById('statusPerformance');
    const form = document.getElementById('uploadForm');
    const formData = new FormData(form);

    const checkboxes = document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked');
    const validationBadgeAlgorithms = document.getElementById("validationBadgeAlgorithms");
    const validationBadgeChannels = document.getElementById("validationBadgeChannels");

    const isAnyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    const isAnyChannelSelected = getSelectedChannels('eeg').length > 0 || getSelectedChannels('eog').length > 0;

    validationBadgeChannels.classList.toggle("d-none", isAnyChannelSelected);
    validationBadgeAlgorithms.classList.toggle("d-none", isAnyChecked);

    if (isAnyChannelSelected && isAnyChecked) {
        // Append custom data to formData
        formData.append('downloadBlock', document.getElementById('download-container').style.display === 'block');
        formData.append('dataset-select-download', document.getElementById('dataset-select-download').value);

        // Append selected channels for each type to formData
        // ['eeg', 'eog', 'emg'].forEach(type => {
        //     formData.append(`${type}-channels`, getSelectedChannels(type).join(','));
        // });
        ['eeg', 'eog'].forEach(type => {
            formData.append(`${type}-channels`, getSelectedChannels(type).join(','));
        });

        // Collect all checked algorithms
        const checkedAlgorithms = [...document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked')]
            .map(checkbox => checkbox.id);
        formData.append('models', checkedAlgorithms.join(','));

        // Disable submit button and hide navigation buttons during processing
        button.disabled = true;
        document.getElementById('nextPrevButtonDiv').style.setProperty('display', 'none', 'important');
        document.getElementById('nextPrevButtonDivHypno').style.setProperty('display', 'none', 'important');
        document.getElementById('nextPrevButtonDivPerformance').style.setProperty('display', 'none', 'important');

        // Set status to processing, open sleep-stages tab, and scroll to top
        status.textContent = 'Processing...';
        statusHypno.textContent = 'Processing...';
        statusPerformance.textContent = 'Processing...';

        //clear the cards
        document.getElementById('card-container').innerHTML = '';
        document.getElementById('card-container-hypno').innerHTML = '';
        document.getElementById('card-container-performance').innerHTML = '';

        new bootstrap.Tab(document.getElementById('sleep-stages-tab')).show();
        window.scrollTo(0, 0);

        try {
            // Send formData via POST request
            const response = await fetch('/process', {method: 'POST', body: formData});
            const data = await response.json();

            let singleChannelEEG = false;
            let singleChannelEOG = false;

            ['eeg', 'eog'].forEach(type => {
                if (getSelectedChannels(type).length === 0) {
                    if (type === 'eeg') {
                        singleChannelEOG = true;
                    } else {
                        singleChannelEEG = true;
                    }
                }
            });

            // Handle server response
            await handleProcessingResponse(response, data, checkedAlgorithms, singleChannelEEG, singleChannelEOG);
        } catch (error) {
            // Display error message in case of request failure
            status.textContent = 'An error occurred: ' + error;
            statusHypno.textContent = 'An error occurred: ' + error;
            statusPerformance.textContent = 'An error occurred: ' + error;
        } finally {
            // Re-enable submit button
            button.disabled = false;
        }
    }
}

// Updates the status and triggers the slide and card generation functions based on server response
const handleProcessingResponse = async (response, data, checkedAlgorithms, singleChannelEEG, singleChannelEOG) => {
    const status = document.getElementById('status');
    const statusHypno = document.getElementById('statusHypno');
    const statusPerformance = document.getElementById('statusPerformance');
    if (response.ok) {
        status.textContent = '';
        statusHypno.textContent = '';
        statusPerformance.textContent = '';

        createCards(checkedAlgorithms);  // Display cards for selected algorithms
        await createCardsForConfMatrix(checkedAlgorithms, singleChannelEEG, singleChannelEOG);  // Display cards for confusion matrix
        loadTotalSlides(false);               // Load and display total slide count

        if (document.getElementById('nsrrToken').disabled === true) {
            document.getElementById('nsrrToken').disabled = false;
            document.getElementById('file-select-download-button').disabled = false;
            document.getElementById('dataset-select-download').disabled = false;
            document.getElementById('download-nsrr-files').disabled = false;
        }
    } else {
        status.textContent = data.error || 'An error occurred.';  // Show error from response or a generic message
        statusHypno.textContent = data.error || 'An error occurred.';  // Show error from response or a generic message
        statusPerformance.textContent = data.error || 'An error occurred.';  // Show error from response or a generic message
    }
};

const handleProcessingResponsePredictOne = (response, data, checkedAlgorithms) => {
    const status = document.getElementById('status');
    const statusHypno = document.getElementById('statusHypno');
    if (response.ok) {
        status.textContent = '';
        statusHypno.textContent = '';

        createCards(checkedAlgorithms);  // Display cards for selected algorithms
        loadTotalSlides(true);               // Load and display total slide count

    } else {
        status.textContent = data.error || 'An error occurred.';  // Show error from response or a generic message
        statusHypno.textContent = data.error || 'An error occurred.';  // Show error from response or a generic message
        statusPerformance.textContent = data.error || 'An error occurred.';  // Show error from response or a generic message
    }
}

// Dynamically creates and appends cards to display algorithm results in a card container
const createCards = (checkedAlgorithm) => {
    const cardContainer = document.getElementById('card-container');
    const cardContainerHypno = document.getElementById('card-container-hypno');
    cardContainer.innerHTML = '';  // Clear existing content
    cardContainerHypno.innerHTML = '';  // Clear existing content

    const createCard = (algorithm, container, type) => {
        const card = document.createElement('div');
        card.classList.add('card', 'm-3', 'shadow-sm', 'rounded');

        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header', 'text-center', 'd-flex', 'justify-content-between', 'align-items-center');

        // Create text span and arrow icon for the header
        const headerText = document.createElement('span');

        if (algorithm.toLowerCase() === 'yasa') {
            headerText.textContent = 'YASA';
        } else if (algorithm.toLowerCase() === 'usleep') {
            headerText.textContent = 'USleep';
        } else if (algorithm.toLowerCase() === 'deepresnet') {
            headerText.textContent = 'DeepResNet';
        } else if (algorithm.toLowerCase() === 'transformer') {
            headerText.textContent = 'Transformer';
        } else if (algorithm.toLowerCase() === 'ensemble') {
            headerText.textContent = 'Ensemble';
        }

        const arrowIcon = document.createElement('span');
        arrowIcon.classList.add('arrow-icon');
        arrowIcon.textContent = '▲';

        // Append text and icon to the header
        cardHeader.appendChild(headerText);
        cardHeader.appendChild(arrowIcon);

        // Toggle display of card body on click
        cardHeader.addEventListener('click', () => {
            const cardBody = card.querySelector('.card-body');
            cardBody.style.display = cardBody.style.display === 'none' ? 'block' : 'none';
            arrowIcon.textContent = cardBody.style.display === 'none' ? '▼' : '▲';
        });

        card.appendChild(cardHeader);

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        cardBody.style.height = '500px';
        cardBody.style.width = '100%';

        const chartDiv = document.createElement('div');
        chartDiv.id = `${type}-container-${algorithm}`;
        chartDiv.classList.add('border', 'rounded', 'overflow-hidden');
        chartDiv.style.cssText = 'border: 2px solid #636161; border-radius: 15px; height: 450px; width: 100%;';
        chartDiv.style.backgroundColor = isDarkMode ? '#272a2e' : '#f8f9fa';

        cardBody.appendChild(chartDiv);
        card.appendChild(cardBody);
        container.appendChild(card);
    };

    checkedAlgorithm.forEach(algorithm => {
        createCard(algorithm, cardContainer, 'hypnogram_combined');
        createCard(algorithm, cardContainerHypno, 'hypnodensity');
    });
};

const getMetricsFromCsv = async (model) => {
     try {
        const response = await fetch('/get_reference_metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 'model': model })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log(jsonData);
        return jsonData;
    } catch (error) {
        console.error("Error fetching CSV:", error);
        throw error;
    }
}

const createCardsForConfMatrix = async (checkedAlgorithm, singleChannelEEG, singleChannelEOG) => {
    const cardContainer = document.getElementById('card-container');
    const cardContainerPerformance = document.getElementById('card-container-performance');


    const createCardForConfMatrix = async (algorithm, container, type, singleChannelEEG, singleChannelEOG) => {
        const card = document.createElement('div');
        card.classList.add('card', 'm-3', 'shadow-sm', 'rounded');

        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header', 'text-center', 'd-flex', 'justify-content-between', 'align-items-center');

        const headerText = document.createElement('span');

        if (algorithm.toLowerCase() === 'yasa') {
            headerText.textContent = 'YASA';
        } else if (algorithm.toLowerCase() === 'usleep') {
            headerText.textContent = 'USleep';
        } else if (algorithm.toLowerCase() === 'deepresnet') {
            headerText.textContent = 'DeepResNet';
        } else if (algorithm.toLowerCase() === 'transformer') {
            headerText.textContent = 'Transformer';
        } else if (algorithm.toLowerCase() === 'ensemble') {
            headerText.textContent = 'Ensemble';
        }

        const arrowIcon = document.createElement('span');
        arrowIcon.classList.add('arrow-icon');
        arrowIcon.textContent = '▲';

        cardHeader.appendChild(headerText);
        cardHeader.appendChild(arrowIcon);

        cardHeader.addEventListener('click', () => {
            const cardBody = card.querySelector('.card-body');
            cardBody.style.display = cardBody.style.display === 'none' ? '' : 'none';
            arrowIcon.textContent = cardBody.style.display === 'none' ? '▼' : '▲';
        });

        card.appendChild(cardHeader);

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        cardBody.style.cssText = 'height: 550px; width: 100%;';

        const titleRow = document.createElement('div');
        titleRow.classList.add('row', 'mb-3'); // Margin-bottom for spacing
        titleRow.style.cssText = 'width: 100%; margin:0; padding: 0;';

        const titleColumn = document.createElement('div');
        titleColumn.classList.add('col-12', 'border', 'rounded');

        if (isDarkMode)
            titleColumn.style.cssText = 'height: 50px; display: flex; align-items: center; justify-content: left; background-color: #272a2e; color: white;';
        else
            titleColumn.style.cssText = 'height: 50px; display: flex; align-items: center; justify-content: left; background-color: #f7f7f7; color: black;';

        const title = document.createElement('h6');
        title.style.cssText = 'margin: 5px;';
        title.classList.add('text-center');
        title.id = `title-${algorithm}`;

        titleColumn.appendChild(title);
        titleRow.appendChild(titleColumn);
        cardBody.appendChild(titleRow);

        const dataRow = document.createElement('div');
        dataRow.classList.add('row', 'mb-3'); // Margin-bottom for spacing
        dataRow.style.cssText = 'height: 400px; width: 100%; margin: 0; display: flex; justify-content: space-between; align-items: stretch; padding: 0;';

        const metricsColumn = document.createElement('div');
        metricsColumn.classList.add('col-12', 'col-md-4', 'border', 'rounded');
        if (isDarkMode)
            metricsColumn.style.cssText = 'display: flex; justify-content: center; align-items: stretch; margin: 0; padding: 0; background-color: #272a2e;';
        else
            metricsColumn.style.cssText = 'display: flex; justify-content: center; align-items: stretch; margin: 0; padding: 0; background-color: #f7f7f7;';
        const insideMetricsRow = document.createElement('div');
        insideMetricsRow.classList.add('row');

        const insidePredictionMetricsColumn = document.createElement('div');
        insidePredictionMetricsColumn.classList.add('col-6', 'col-md-6');

        const insideTrueMetricsColumn = document.createElement('div');
        insideTrueMetricsColumn.classList.add('col-6', 'col-md-6');
        insideTrueMetricsColumn.style.cssText = 'border-left:1px solid #495057;';

        const metricsDiv = document.createElement('div');
        metricsDiv.id = `metrics-${algorithm}`;
        metricsDiv.classList.add('metrics-container');
        metricsDiv.style.cssText = 'width: 100%; padding: 20px; border-radius: 15px; margin-right: 20px; height: 450px;';

        const overallMetricsDiv = document.createElement('div');
        overallMetricsDiv.id = `overall-metrics-${algorithm}`;
        overallMetricsDiv.classList.add('metrics-container');
        overallMetricsDiv.style.cssText = 'width: 100%; padding: 20px; margin-right: 20px; height: 450px;';

        let metricsAlgorithm;

        if (algorithm.toLowerCase() === 'deepresnet' && singleChannelEEG) {
            metricsAlgorithm = 'deepresnet EEG';
        }else if (algorithm.toLowerCase() === 'deepresnet' && singleChannelEOG) {
            metricsAlgorithm = 'deepresnet EOG';
        }else if (algorithm.toLowerCase() === 'deepresnet') {
            metricsAlgorithm = 'deepresnet EEG/EOG';
        }else if (algorithm.toLowerCase() === 'transformer' && singleChannelEEG) {
            metricsAlgorithm = 'sleeptransformer EEG';
        }else if (algorithm.toLowerCase() === 'transformer' && singleChannelEOG) {
            metricsAlgorithm = 'sleeptransformer EOG';
        }else if (algorithm.toLowerCase() === 'transformer') {
            metricsAlgorithm = 'sleeptransformer EEG/EOG';
        }else if (algorithm.toLowerCase() === 'usleep' && singleChannelEEG) {
            metricsAlgorithm = 'u-sleep EEG';
        }else if (algorithm.toLowerCase() === 'usleep' && singleChannelEOG) {
            metricsAlgorithm = 'u-sleep EOG';
        }else if (algorithm.toLowerCase() === 'usleep') {
            metricsAlgorithm = 'u-sleep EEG/EOG';
        }else if (algorithm.toLowerCase() === 'ensemble' && singleChannelEEG) {
            metricsAlgorithm = 'SUV EEG';
        }else if (algorithm.toLowerCase() === 'ensemble' && singleChannelEOG) {
            metricsAlgorithm = 'SUV EOG';
        }else if (algorithm.toLowerCase() === 'ensemble') {
            metricsAlgorithm = 'SUV EEG/EOG';
        }else{
            metricsAlgorithm = 'u-sleep EEG/EOG';
        }
        const data = await getMetricsFromCsv(metricsAlgorithm);

        overallMetricsDiv.innerHTML = `
            <p class="h3 text-body">References</p>
            <p class="text-body">${data.values["Macro F1"]}</p>
            <p class="text-body">${data.values["Wake F1"]}</p>
            <p class="text-body">${data.values["N1 F1"]}</p>
            <p class="text-body">${data.values["N2 F1"]}</p>
            <p class="text-body">${data.values["N3 F1"]}</p>
            <p class="text-body">${data.values["REM F1"]}</p>
            <p class="text-body">${data.values["Accuracy"]}</p>
            <p class="text-body">${data.values["Macro Recall"]}</p>
            <p class="text-body">${data.values["Macro Precision"]}</p>
        `;

        insidePredictionMetricsColumn.appendChild(metricsDiv);
        insideTrueMetricsColumn.appendChild(overallMetricsDiv);
        insideMetricsRow.appendChild(insidePredictionMetricsColumn);
        insideMetricsRow.appendChild(insideTrueMetricsColumn);
        metricsColumn.appendChild(insideMetricsRow);
        dataRow.appendChild(metricsColumn);

        const chartColumn = document.createElement('div');
        chartColumn.classList.add('col-12', 'col-md-7'); // Full width column
        chartColumn.style.cssText = 'display: flex; justify-content: center; align-items: stretch; margin: 0; padding:0; width:65%;';

        const chartDiv = document.createElement('div');
        chartDiv.id = `${type}-container-${algorithm}`;
        chartDiv.classList.add('border', 'rounded', 'overflow-hidden');

        if (isDarkMode)
            chartDiv.style.cssText = 'border: 2px solid #636161; border-radius: 15px; height: 450px; width: 100%; background-color: #272a2e;';
        else
            chartDiv.style.cssText = 'border: 2px solid #636161; border-radius: 15px; height: 450px; width: 100%; background-color: #f7f7f7;';

        chartColumn.appendChild(chartDiv);

        dataRow.appendChild(chartColumn);

        cardBody.appendChild(dataRow);

        card.appendChild(cardBody);
        container.appendChild(card);
    };

    for (const algorithm of checkedAlgorithm) {
        await createCardForConfMatrix(algorithm, cardContainerPerformance, 'metrics_results', singleChannelEEG, singleChannelEOG);
    }
};

// Function to load the total number of slides from a JSON file
const loadTotalSlides = (is_predict_one) => {
    fetch('../static/total_slides.json')
        .then(response => response.json())
        .then(data => {
            totalSlides = data.total_slides; // Update totalSlides with data from the response

            loadData(currentIndex, 'hypnogram_combined');
            loadData(currentIndex, 'hypnodensity');

            if (!is_predict_one) {
                loadPerformanceData(currentIndex);
            }

            //createConfusionMatrix();
        })
        .catch(error => console.error('Error loading total slides:', error));
}

const loadPerformanceData = (slideIndex) => {
    const checkedAlgorithms = Array.from(document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.id); // Get the IDs of checked checkboxes

    if (totalSlides === 1 && slideIndex === 1) {
        slideIndex -= 1;
    }

    // Determine file paths based on the type
    const files = checkedAlgorithms.map(algorithm =>
        `../static/performances/metrics_${slideIndex}.json`
    );

    // Set up elements based on type
    const resultsDiv = document.getElementById('resultsPerformance');
    const buttonsDiv = document.getElementById('nextPrevButtonDivPerformance');
    const cardContainer = document.getElementById('card-container-performance');

    // Clear previous results while keeping buttons and card container
    Array.from(resultsDiv.children).forEach(child => {
        if (child !== buttonsDiv && child !== cardContainer) {
            resultsDiv.removeChild(child);
        }
    });


    // Fetch and plot each file
    files.forEach(file => {
        fetch(file)
            .then(response => response.json())
            .then(data => {

                for (const algorithm in data) {
                    const metricsDiv = document.getElementById(`metrics-${algorithm}`);

                    const algorithmMetrics = data[algorithm];

                    if (algorithmMetrics.subject === 'Average') {
                        document.getElementById(`title-${algorithm}`).textContent = `Average respective to all subjects`;
                    } else {
                        document.getElementById(`title-${algorithm}`).textContent = `${algorithmMetrics.subject}`;
                    }

                    metricsDiv.innerHTML = `
                    <p class="h3 text-body">Metrics</p>
                    <p class="text-body"><strong>MF1 Score:</strong> ${algorithmMetrics.Mf1_score.toFixed(2)}</p>
                    <p class="text-body"><strong>F1 Wake:</strong> ${algorithmMetrics.f1_score_wake.toFixed(2)}</p>
                    <p class="text-body"><strong>F1 N1:</strong> ${algorithmMetrics.f1_score_n1.toFixed(2)}</p>
                    <p class="text-body"><strong>F1 N2:</strong> ${algorithmMetrics.f1_score_n2.toFixed(2)}</p>
                    <p class="text-body"><strong>F1 N3:</strong> ${algorithmMetrics.f1_score_n3.toFixed(2)}</p>
                    <p class="text-body"><strong>F1 REM:</strong> ${algorithmMetrics.f1_score_rem.toFixed(2)}</p>
                    <p class="text-body"><strong>Accuracy:</strong> ${algorithmMetrics.accuracy.toFixed(2)}</p>
                    <p class="text-body"><strong>Recall:</strong> ${algorithmMetrics.recall.toFixed(2)}</p>
                    <p class="text-body"><strong>Precision:</strong> ${algorithmMetrics.precision.toFixed(2)}</p>
                `;

                    //plot cm with plotly
                    const labels = ["Wake", "N1", "N2", "N3", "REM"];

                    // Constructing the zValues
                    const zValues = labels.map((trueLabel, i) => {
                        return labels.map((predLabel, j) => {
                            // Access the confusion matrix values using the indices of trueLabel and predLabel
                            return parseFloat(algorithmMetrics.cm[i][j].toFixed(2));  // Round to 2 decimal places
                        });
                    });

                    const colorscaleValue = [
                        [0, '#A9C4D8'],
                        [0.5, '#558C9A'],
                        [1, '#2C3E50']
                    ];

                    const data1 = [{
                        x: labels,
                        y: labels,
                        z: zValues,
                        type: 'heatmap',
                        colorscale: colorscaleValue,
                        showscale: false
                    }];

                    const layout = {
                        plot_bgcolor: isDarkMode ? '#272a2e' : '#f7f7f7',
                        paper_bgcolor: isDarkMode ? '#272a2e' : '#f7f7f7',
                        annotations: [],
                        xaxis: {
                            ticks: '',
                            title: 'Predicted Label',
                            titlefont: {
                                size: 16,
                                color: isDarkMode ? '#dfe2e6' : '#000000'
                            },
                            tickfont: {
                                size: 14,
                                color: isDarkMode ? '#dfe2e6' : '#000000'
                            },
                            side: 'top',
                            ticklen: 10
                        },
                        yaxis: {
                            ticks: '',
                            title: 'True Label',
                            titlefont: {
                                size: 16,
                                color: isDarkMode ? '#dfe2e6' : '#000000'
                            },
                            tickfont: {
                                size: 14,
                                color: isDarkMode ? '#dfe2e6' : '#000000'
                            },
                            ticksuffix: ' ',
                            width: 700,
                            height: 700,
                            autosize: false,
                            ticklen: 10,
                            autorange: 'reversed'
                        }
                    }

                    for (let i = 0; i < labels.length; i++) {
                        for (let j = 0; j < labels.length; j++) {
                            const currentValue = zValues[i][j];
                            let textColor = currentValue !== 0.0 ? 'white' : 'black';

                            const annotation = {
                                xref: 'x1',
                                yref: 'y1',
                                x: labels[j],
                                y: labels[i],
                                text: `${(currentValue).toFixed(2)}%`,
                                font: {
                                    family: 'Arial',
                                    size: 12,
                                    color: textColor
                                },
                                showarrow: false,
                                yanchor: 'middle',
                                xanchor: 'center',
                                yshift: 5,
                                xshift: 0
                            };
                            layout.annotations.push(annotation);
                        }
                    }

                    const divId = `metrics_results-container-${algorithm}`;

                    Plotly.newPlot(divId, data1, layout, {responsive: true});

                    const resizeObserver = new ResizeObserver(() => {
                        Plotly.Plots.resize(document.getElementById(divId));
                    });
                    resizeObserver.observe(document.getElementById(divId));
                }

                if (buttonsDiv.style.display === 'none') {
                    buttonsDiv.style.display = 'block';
                }


            })
            .catch(error => console.error(`Error loading metrics results from ${file}:`, error));
    });
}

// Function to load data from JSON files based on slide index and type
const loadData = (slideIndex, type) => {
    const checkedAlgorithms = Array.from(document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.id); // Get the IDs of checked checkboxes

    // Determine file paths based on the type
    const files = checkedAlgorithms.map(algorithm =>
        `../static/${algorithm}/${type}_${algorithm}_${slideIndex}.json`
    );

    // Set up elements based on type
    const resultsDiv = document.getElementById(type === 'hypnogram_combined' ? 'results' : 'resultsHypno');
    const buttonsDiv = document.getElementById(type === 'hypnogram_combined' ? 'nextPrevButtonDiv' : 'nextPrevButtonDivHypno');
    const cardContainer = document.getElementById(type === 'hypnogram_combined' ? 'card-container' : 'card-container-hypno');

    // Clear previous results while keeping buttons and card container
    Array.from(resultsDiv.children).forEach(child => {
        if (child !== buttonsDiv && child !== cardContainer) {
            resultsDiv.removeChild(child);
        }
    });

    // Fetch and plot each file
    files.forEach(file => {
        fetch(file)
            .then(response => response.json())
            .then(data => {
                const plotData = JSON.parse(data);
                applyThemeToPlot(plotData); // Apply the current theme to the plot


                let algorithm;

                // Extract algorithm name based on type
                if (type === 'hypnogram_combined') {
                    algorithm = file.split('/').pop().split('.')[0].split('_')[2];
                } else {
                    algorithm = file.split('/').pop().split('.')[0].split('_')[1];
                }

                Plotly.newPlot(`${type}-container-${algorithm}`, plotData.data, plotData.layout, {responsive: true});

                // Style the container
                const container = document.getElementById(`${type}-container-${algorithm}`);
                container.style.borderRadius = '15px';
                container.style.overflow = 'hidden';

                // Show navigation buttons if hidden
                if (buttonsDiv.style.display === 'none') {
                    buttonsDiv.style.display = 'block';
                }
                const resizeObserver = new ResizeObserver(() => {
                    Plotly.Plots.resize(container);
                });
                resizeObserver.observe(container);
            })
            .catch(error => console.error(`Error loading ${type} from ${file}:`, error));
    });
};

// Function to apply theme to a Plotly plot
const applyThemeToPlot = (plotData) => {
    const isDark = isDarkMode ? '#dfe2e6' : '#000000'; // Set font color based on theme
    const bgColor = isDarkMode ? '#272a2e' : '#f7f7f7'; // Set background color based on theme

    // Apply theme colors to the plot data
    plotData.layout.plot_bgcolor = bgColor;
    plotData.layout.paper_bgcolor = bgColor;
    plotData.layout.font = {color: isDark};
    plotData.layout.xaxis.tickfont = {color: isDark};
    plotData.layout.yaxis.tickfont = {color: isDark};
    plotData.layout.xaxis.gridcolor = isDark;
    plotData.layout.yaxis.gridcolor = isDark;
    plotData.layout.xaxis.title.font = {color: isDark};
    plotData.layout.yaxis.title.font = {color: isDark};
    plotData.layout.autosize = true;
    //100% width
    //plotData.layout.width = 850;
    //plotData.layout.margin = {l: 0, r: 0, t: 0, b: 0};
}

// Event listeners for navigation buttons
document.getElementById('prev').addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; // Navigate to the previous slide
    loadData(currentSlide, 'hypnogram_combined'); // Load the new hypnogram
});
document.getElementById('next').addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % totalSlides; // Navigate to the next slide
    loadData(currentSlide, 'hypnogram_combined'); // Load the new hypnogram
});

// Event listeners for navigation buttons
document.getElementById('prevHypno').addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; // Navigate to the previous slide
    loadData(currentSlide, 'hypnodensity'); // Load the new hypnogram
});
document.getElementById('nextHypno').addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % totalSlides; // Navigate to the next slide
    loadData(currentSlide, 'hypnodensity'); // Load the new hypnogram
});

// Event listeners for navigation buttons
document.getElementById('prevPerformance').addEventListener('click', () => {

    if (currentSlide === 0) {
        currentSlide = totalSlides;
    } else {
        currentSlide = currentSlide - 1; // Navigate to the previous slide
    }

    loadPerformanceData(currentSlide);
});
document.getElementById('nextPerformance').addEventListener('click', () => {

    if (currentSlide === totalSlides) {
        currentSlide = 0;
    } else {
        currentSlide = currentSlide + 1; // Navigate to the next slide
    }

    loadPerformanceData(currentSlide);
});

// Event listener for the reset button
document.getElementById('resetButton').addEventListener('click', async () => {

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
});

// Function to get checked checkboxes
function getCheckedChannels() {
    // Select all checkboxes with the name "select-channels-proprietary"
    const checkboxes = document.querySelectorAll('input[name="select-channels-proprietary"]:checked');
    // Map over the NodeList to extract their values
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

document.getElementById('predictButton').addEventListener('click', async () => {
    const button = document.getElementById('predictButton');
    const status = document.getElementById('status');
    const statusHypno = document.getElementById('statusHypno');
    const statusPerformance = document.getElementById('statusPerformance');
    const validationBadgeTypeChannels = document.getElementById("validationBadgeTypeChannels");
    const validationBadgeAlgorithms = document.getElementById("validationBadgeAlgorithms");
    const validationBadgeEdf = document.getElementById("validationBadgeEdf");
    const validationBadgeFolderName = document.getElementById("validationBadgeOutputFolder");
    const formData = new FormData();
    const files = document.getElementById('edf-files').files;

    for (let i = 0; i < files.length; i++) {
        formData.append('edf-files', files[i]);
    }

    const folderName = document.getElementById('folderName').value;
    formData.append('folderName', folderName);

    const checkboxes = document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked');

    const isAnyAlgorithmChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    const isAnyChannelSelected = Array.from(getCheckedChannels()).length > 0;
    const isAnyFileSelected = true;
    const isFolderNameValid = folderName.length > 0;

    validationBadgeTypeChannels.classList.toggle("d-none", isAnyChannelSelected);
    validationBadgeAlgorithms.classList.toggle("d-none", isAnyAlgorithmChecked);
    validationBadgeEdf.classList.toggle("d-none", isAnyFileSelected);
    validationBadgeFolderName.classList.toggle("d-none", isFolderNameValid);

    if (isAnyChannelSelected && isAnyAlgorithmChecked && isAnyFileSelected && isFolderNameValid) {

        // Append selected channels for each type to formData
        formData.append('channels', getCheckedChannels())

        // Collect all checked algorithms
        const checkedAlgorithms = [...document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked')]
            .map(checkbox => checkbox.id);

        formData.append('models', checkedAlgorithms.join(','));

        // Disable submit button and hide navigation buttons during processing
        button.disabled = true;
        document.getElementById('nextPrevButtonDiv').style.setProperty('display', 'none', 'important');
        document.getElementById('nextPrevButtonDivHypno').style.setProperty('display', 'none', 'important');
        document.getElementById('nextPrevButtonDivPerformance').style.setProperty('display', 'none', 'important');
        //clear the cards
        document.getElementById('card-container').innerHTML = '';
        document.getElementById('card-container-hypno').innerHTML = '';
        document.getElementById('card-container-performance').innerHTML = '';

        // Set status to processing, open sleep-stages tab, and scroll to top
        status.textContent = 'Processing...';
        statusHypno.textContent = 'Processing...';
        statusPerformance.textContent = 'No data to display';
        new bootstrap.Tab(document.getElementById('sleep-stages-tab')).show();
        window.scrollTo(0, 0);

        try {
            // Send formData via POST request
            const response = await fetch('/process_one', {method: 'POST', body: formData});
            const data = await response.json();

            // Handle server response
            handleProcessingResponsePredictOne(response, data, checkedAlgorithms);
        } catch (error) {
            // Display error message in case of request failure
            status.textContent = 'An error occurred: ' + error;
        } finally {
            // Re-enable submit button
            button.disabled = false;
        }
    }
})

let currentIndex = 0;
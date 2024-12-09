import {initializeTheme, applyButtonStyles} from './theme.js';
import {setInitialChannels} from './channels.js';
import {handleFileInputChange} from './fileHandling.js';
import {reset_directories, toggleUploadContainerVisibility} from './uiInteractions.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();

    const buttonGroups = {
        primary: ['tutorialButton',
            'nsrrButton',
            'uploadButton',
            'downloadNsrrButton',
            'openSourceButton',
            'proprietaryDataButton',
            'submitButton',
            'submitSleepDynamics'],
        secondary: ['download-nsrr-files',
            'errorDynamicsCloseButton',
            'resetButton',
            'next',
            'prev',
            'nextHypno',
            'prevHypno',
            'nextPerformance',
            'prevPerformance'],
        warning: ['notebookButton']
    };
    applyButtonStyles(buttonGroups);

    document.getElementById('files').addEventListener('change', handleFileInputChange);
    document.getElementById('resetButton').addEventListener('click', reset_directories);

    await setInitialChannels();


});

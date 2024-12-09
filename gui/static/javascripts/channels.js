export const setInitialChannels = async () => {
    await fetchAndPopulateChannels('abc');

    document.getElementById('dataset-select').addEventListener('change', async (event) => {
        clearChannelMenus();
        await fetchAndPopulateChannels(event.target.value);
    });
}

export const clearChannelMenus = () => {
    ['eegChannelMenu', 'eogChannelMenu', 'emgChannelMenu'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
};

export const fetchAndPopulateChannels = async (dataset) => {
    try {
        const response = await fetch('/get_channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'dataset-select': dataset }),
        });

        if (!response.ok) {
            console.error('Error fetching channels:', await response.json());
            return;
        }

        const channels = await response.json();
        populateMenus(channels);
    } catch (error) {
        console.error('Error fetching channels:', error);
    }
};

const populateMenus = (channels) => {
    const menus = {
        EEG: { menu: 'eegChannelMenu', selectAllId: 'selectAllEegChannels' },
        EOG: { menu: 'eogChannelMenu', selectAllId: 'selectAllEogChannels' },
        EMG: { menu: 'emgChannelMenu', selectAllId: 'selectAllEmgChannels' },
    };

    for (const [key, { menu, selectAllId }] of Object.entries(menus)) {
        populateMenu(menu, channels[`${key.toLowerCase()}_channels`], selectAllId);
    }
};

const populateMenu = (menuElement, channelList, buttonElement, selectAllId) => {
    menuElement.innerHTML = '';

    if (channelList.length === 0) {
        // If no channels available, show placeholder text
        menuElement.innerHTML = `<li><label class="form-check ms-2"> No channels</label></li>`;
    } else {
        // Add "All" selection option
        menuElement.innerHTML = `
            <li><label class="form-check ms-2"><input type="checkbox" class="form-check-input" id="${selectAllId}" checked> All</label></li>
            <li><hr class="dropdown-divider"></li>
        `;
        // Add each channel as a selectable checkbox
        channelList.forEach(channel => {
            menuElement.insertAdjacentHTML('beforeend', `
                <li><label class="form-check ms-2"><input type="checkbox" class="form-check-input" value="${channel}" name="channel" checked> ${channel}</label></li>
            `);
        });
        addCheckboxListeners(menuElement, buttonElement, selectAllId);
    }
}

const addCheckboxListeners = (menuElement, buttonElement, selectAllId) => {
    const checkboxes = menuElement.querySelectorAll('.form-check-input');
    const selectAll = menuElement.querySelector(`#${selectAllId}`);

    // Update button label based on selected channels
    const updateButtonLabel = () => {
        const selectedChannels = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked && checkbox.value)
            .map(checkbox => checkbox.value);

        buttonElement.textContent = selectAll.checked ? 'All channels' : selectedChannels.join(', ') || 'Select Channels';
    }

    // Adjust selection based on individual checkbox changes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox !== selectAll && !checkbox.checked) {
                selectAll.checked = false;
            }
            updateButtonLabel();
        });
    });

    // Handle select/deselect all functionality
    selectAll.addEventListener('change', () => {
        checkboxes.forEach(checkbox => (checkbox.checked = selectAll.checked));
        buttonElement.textContent = selectAll.checked ? 'All channels' : 'Select Channels';
    });

    updateButtonLabel();
}

export let isDarkMode = false;

export const initializeTheme = () => {
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled');

    document.getElementById('logo').src = isDarkMode
        ? '../static/images/sleepyland_logo_dark.png'
        : '../static/images/sleepyland_logo_light.png';
    document.body.dataset.bsTheme = isDarkMode ? 'dark' : 'light';
};

export const applyButtonStyles = (buttonGroups) => {
    Object.entries(buttonGroups).forEach(([style, buttons]) => {
        const lightStyle = `btn-${style}`;
        const darkStyle = `btn-outline-${style}`;
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            button.classList.toggle(lightStyle, !isDarkMode);
            button.classList.toggle(darkStyle, isDarkMode);
        });
    });
};

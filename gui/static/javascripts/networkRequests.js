export const sendRequest = async (formData, onSuccess, onError) => {
    try {
        const response = await fetch('/process', { method: 'POST', body: formData });
        const data = await response.json();

        if (response.ok) {
            onSuccess(data);
        } else {
            onError(data.error || 'An error occurred.');
        }
    } catch (error) {
        console.error('Error sending request:', error);
        onError(error.message);
    }
};

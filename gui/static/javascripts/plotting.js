import { isDarkMode } from './theme.js';

let totalSlides = 0;

export const applyThemeToPlot = (plotData) => {
    const isDark = isDarkMode ? '#dfe2e6' : '#000000';
    const bgColor = isDarkMode ? '#272a2e' : 'white';

    plotData.layout.plot_bgcolor = bgColor;
    plotData.layout.paper_bgcolor = bgColor;
    plotData.layout.font = { color: isDark };
    plotData.layout.xaxis.tickfont = { color: isDark };
    plotData.layout.yaxis.tickfont = { color: isDark };
    plotData.layout.xaxis.title.font = { color: isDark };
    plotData.layout.yaxis.title.font = { color: isDark };
};

// Function to load data from JSON files based on slide index and type
export const loadData = (slideIndex, type) => {
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

export const loadPerformanceData = (slideIndex) => {
    const checkedAlgorithms = Array.from(document.querySelectorAll('#algorithms-select input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.id); // Get the IDs of checked checkboxes

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

                    document.getElementById(`title-${algorithm}`).textContent = `${algorithmMetrics.subject}`;

                    metricsDiv.innerHTML = `
                    <p class="h3">Metrics</p>
                    <p class="text-body"><strong>F1 Score:</strong> ${algorithmMetrics.Mf1_score.toFixed(2)}</p>
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
                        plot_bgcolor: isDarkMode ? '#272a2e' : 'white',
                        paper_bgcolor: isDarkMode ? '#272a2e' : 'white',
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

                }

                if (buttonsDiv.style.display === 'none') {
                    buttonsDiv.style.display = 'block';
                }


            })
            .catch(error => console.error(`Error loading metrics results from ${file}:`, error));
    });
}


// Function to load the total number of slides from a JSON file
const loadTotalSlides = () => {
    fetch('../static/total_slides.json')
        .then(response => response.json())
        .then(data => {
            totalSlides = data.total_slides; // Update totalSlides with data from the response

            loadData(currentIndex, 'hypnogram_combined');
            loadData(currentIndex, 'hypnodensity');

            loadPerformanceData(currentIndex);

        })
        .catch(error => console.error('Error loading total slides:', error));
}
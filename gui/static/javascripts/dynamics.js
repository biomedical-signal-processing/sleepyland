// Event listener for the sleep dynamics tab
// document.getElementById('sleep-dynamics-tab').addEventListener('click', async () => {
//     const ageSelect = document.getElementById('ageSelect');
//     ageSelect.innerHTML = ''; // Clear existing options
//
//     // Populate age options
//     for (let age = 10; age <= 95; age++) {
//         const option = document.createElement('option');
//         option.value = age;
//         option.text = age;
//         ageSelect.appendChild(option);
//     }
//
//     // Fetch studies and populate the study select dropdown
//     try {
//         const response = await fetch('/get_studies');
//         const data = await response.json();
//
//         if (data.length === 0) {
//             const modal = new bootstrap.Modal(document.getElementById('errorDynamicsModal'));
//             modal.show(); // Show error modal if no studies found
//             return;
//         }
//
//         const studySelect = document.getElementById('studySelect');
//         studySelect.innerHTML = ''; // Clear existing options
//         data.forEach(study => {
//             const option = document.createElement('option');
//             option.value = study;
//             option.text = study;
//             studySelect.appendChild(option); // Add each study as an option
//         });
//
//         const modal = new bootstrap.Modal(document.getElementById('sleepDynamicsModal'));
//         modal.show(); // Show the sleep dynamics modal
//     } catch (error) {
//         console.error('Errors in study recovery:', error);
//     }
// });

// Event listener for the submit button in the sleep dynamics tab
// document.getElementById('submitSleepDynamics').addEventListener('click', async (event) => {
//     event.preventDefault();
//
//     document.getElementById('status-sleep-dynamics').textContent = 'Processing...';
//
//     $('#sleepDynamicsModal').modal('hide')
//
//     const age = document.getElementById('ageSelect').value;
//     const gender = document.getElementById('genderSelect').value;
//     const study = document.getElementById('studySelect').value;
//
//     await fetch('/process_dynamics', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({age, gender, study})
//     })
//         .then(response => response.json())
//         .then(async result => {
//             await metricsData();
//         })
//         .catch(error => console.error('Error:', error));
//
//     async function metricsData() {
//
//         const dirResponse = await fetch(`/${study}/directories`);
//
//         if (!dirResponse.ok) {
//             throw new Error('Network response was not ok');
//         }
//         const directories = await dirResponse.json();
//
//         for (const dir of directories) {
//             const filePath = `/output/${study}/dynamics/${dir}/metrics/additional_metrics.csv`;
//
//             const directoryPath = `/output/${study}/dynamics/${dir}/metrics`;
//
//             await fetch("/create_heatmap", {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({directoryPath})
//             })
//                 .then(response => response.json())
//                 .then(data => {
//                     loadHeatmap();
//                 })
//
//
//             /*await fetch(filePath)
//                 .then(response => {
//                     if (!response.ok) {
//                         throw new Error(`Network response was not ok for ${filePath}`);
//                     }
//                     return response.text();
//                 })
//                 .then(data => {
//                     Papa.parse(data, {
//                         header: true,
//                         complete: function (results) {
//                             displayTable(results.data);
//                         }
//                     });
//                 })
//                 .catch(error => {
//                     console.error(`Error fetching ${filePath}: `, error);
//                 });*/
//         }
//
//         function displayTable(data) {
//             const tableBody = document.querySelector('#metrics-table tbody');
//
//             tableBody.innerHTML = '';
//
//             const headers = Object.keys(data[0]);
//
//             headers.forEach(header => {
//                 const tr = document.createElement('tr');
//
//                 const th = document.createElement('td');
//                 th.textContent = header;
//                 tr.appendChild(th);
//
//                 const td = document.createElement('td');
//                 td.textContent = data[0][header];
//                 tr.appendChild(td);
//
//                 tableBody.appendChild(tr);
//             });
//         }
//     }
// });

// Event listener for closing the error modal with the close button
// document.getElementById('errorDynamicsCloseButton').addEventListener('click', () => {
//     $('#errorDynamicsModal').modal('hide')
//     const tab = new bootstrap.Tab(document.getElementById('form-tab'));
//     tab.show();
// });

// Event listener for closing the error modal with the X button
// document.getElementById('errorDynamicsCloseButtonX').addEventListener('click', () => {
//     $('#errorDynamicsModal').modal('hide')
//     const tab = new bootstrap.Tab(document.getElementById('form-tab'));
//     tab.show();
// });




// Function to load heatmap data from predefined URLs
// const loadHeatmap = () => {
//     const heatmaps = [
//         {
//             url: '../static/heatmap/P_M_confusion_matrix.json',
//             container: 'P_M_heatmap-container',
//             title: 'P M Matrix',
//             titleId: 'P_M_heatmap_title'
//         },
//         {
//             url: '../static/heatmap/P_confusion_matrix.json',
//             container: 'P_heatmap-container',
//             title: 'P Matrix',
//             titleId: 'P_heatmap_title'
//         }
//     ];
//
//     // Fetch and plot each heatmap
//     heatmaps.forEach(({url, container, title, titleId}) => {
//         fetch(url)
//             .then(response => response.json())
//             .then(data => {
//                 const plotData = JSON.parse(data);
//                 applyThemeToPlot(plotData); // Apply the current theme to the plot
//                 Plotly.newPlot(container, plotData.data, plotData.layout, {responsive: true}); // Plot the heatmap
//             })
//             .catch(error => console.error(`Error loading heatmap from ${url}:`, error));
//     });
//
//     document.getElementById('status-sleep-dynamics').textContent = ''; // Clear status message
// }
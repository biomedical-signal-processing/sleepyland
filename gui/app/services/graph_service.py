import numpy as np
import os
import plotly.graph_objects as go
import json

"""def softmax(logits):
    Compute the numerically stable softmax function for a 2D array of shape (N, C)
    logits_stable = logits - np.max(logits, axis=1, keepdims=True)
    exp_values = np.exp(logits_stable)
    sum_exp = np.sum(exp_values, axis=1, keepdims=True)
    probabilities = exp_values / sum_exp
    return probabilities"""

def create_hypnogram(folder_name, models_selected, is_predict_one, log):
    """Create a hypnogram with overlapping majority and true stages and save it as JSON."""
    total_slides = 0
    for model in models_selected:
        majority_folder = f'/app/output/{folder_name}/{model}/majority'
        if not is_predict_one:
            true_folder = f'/app/output/{folder_name}/{model}/TRUE_files'
        log.debug(f"----Processing")
        majority_files = sorted([file for file in os.listdir(majority_folder) if file.endswith('.npy')])
        log.debug(f"--------------Processing")
        if not is_predict_one:
            true_files = sorted(os.listdir(true_folder))

        total_slides = len(majority_files)

        if is_predict_one:
            for i, maj_file in enumerate(majority_files):
                sleep_stages_majority = np.load(os.path.join(majority_folder, maj_file)).argmax(-1).astype(int)
                np.set_printoptions(threshold=np.inf)

                time = np.arange(len(sleep_stages_majority)) * 30
                sleep_stage_labels = ['Wake', 'NREM1', 'NREM2', 'NREM3', 'REM']
                sleep_stages_labels_majority = [sleep_stage_labels[stage] for stage in sleep_stages_majority]
                colors = {
                    0: '#58e306',  # Wake
                    1: '#2cf7f0',  # NREM1
                    2: '#1173ef',  # NREM2
                    3: '#4b4d4d',  # NREM3
                    4: '#ee0e0e'  # REM
                }
                fig = go.Figure()
                fig.add_trace(go.Scatter(x=time, y=sleep_stages_labels_majority, mode='lines+markers',
                                            line=dict(color='#bdc2c3', width=2, shape='hv'),
                                            marker=dict(size=5, color=[colors[stage] for stage in sleep_stages_majority]),
                                            name='Pred'))
                fig.update_layout(title=f"{maj_file.split('.')[0].split('_')[0]}",
                                    xaxis=dict(title='Time (seconds)'),
                                    yaxis=dict(title='Sleep Stage', categoryorder='array',
                                                 categoryarray=['NREM3', 'NREM2', 'NREM1', 'REM', 'Wake']),
                                    yaxis_range=[-0.5, 4.5])

                fig_json = fig.to_json()

                if not os.path.exists(f"/app/static/{model}"):
                    os.makedirs(f"/app/static/{model}")

                with open(f"/app/static/{model}/hypnogram_combined_{model}_{i}.json", "w") as f:
                    json.dump(fig_json, f)

        else:
            for i, (maj_file, true_file) in enumerate(zip(majority_files, true_files)):
                sleep_stages_majority = np.load(os.path.join(majority_folder, maj_file)).argmax(-1).astype(int)
                sleep_stages_true = np.load(os.path.join(true_folder, true_file)).astype(int).ravel()

                mask = sleep_stages_true == 5

                sleep_stages_majority = sleep_stages_majority.astype(float)
                sleep_stages_true = sleep_stages_true.astype(float)

                sleep_stages_majority[mask] = np.nan
                sleep_stages_true[mask] = np.nan
                time = np.arange(len(sleep_stages_majority), dtype=float) * 30
                time[mask] = np.nan

                sleep_stage_labels = ['Wake', 'NREM1', 'NREM2', 'NREM3', 'REM']

                def map_labels(stage):
                    return sleep_stage_labels[int(stage)] if not np.isnan(stage) else None

                sleep_stages_labels_majority = [map_labels(stage) for stage in sleep_stages_majority]
                sleep_stages_labels_true = [map_labels(stage) for stage in sleep_stages_true]

                colors = {
                    0: '#58e306',  # Wake
                    1: '#2cf7f0',  # NREM1
                    2: '#1173ef',  # NREM2
                    3: '#4b4d4d',  # NREM3
                    4: '#ee0e0e'  # REM
                }

                fig_combined = go.Figure()  # Add majority sleep stages as the first trace

                fig_combined.add_trace(go.Scatter(x=time, y=sleep_stages_labels_majority, mode='lines+markers',
                                                  line=dict(color='#bdc2c3', width=2, shape='hv'),
                                                  marker=dict(size=5,
                                                              color=[colors.get(int(stage), 'gray') if not np.isnan(stage) else 'gray' for stage in
                                       sleep_stages_majority]),
                                                  name='Pred'))
                fig_combined.add_trace(go.Scatter(x=time, y=sleep_stages_labels_true, mode='lines+markers',
                                                  line=dict(color='#1f77b4', width=2, shape='hv'),
                                                  marker=dict(size=5,
                                                              color=[colors.get(int(stage), 'gray') if not np.isnan(
                                                                  stage) else 'gray' for stage in
                                                                     sleep_stages_true]),
                                                  name='True'))
                fig_combined.update_layout(title=f"{maj_file.split('.')[0].split('_')[0]} (Pred vs True)",
                                           xaxis=dict(title='Time (seconds)'),
                                           yaxis=dict(title='Sleep Stage', categoryorder='array',
                                                      categoryarray=['NREM3', 'NREM2', 'NREM1', 'REM', 'Wake']),
                                           yaxis_range=[-0.5,
                                                        4.5])  # Save the combined figure as JSON
                fig_combined_json = fig_combined.to_json()

                if not os.path.exists(f"/app/static/{model}"):
                    os.makedirs(f"/app/static/{model}")

                with open(f"/app/static/{model}/hypnogram_combined_{model}_{i}.json", "w") as f:
                    json.dump(fig_combined_json, f)

    with open("/app/static/total_slides.json", "w") as f:
        json.dump({"total_slides": total_slides}, f)


def create_hypnodensity_graph(folder_name, models_selected, log, is_logits=False):
    """Create a hypnodensity graph with cumulative probability distribution for each class and save it as JSON."""
    for model in models_selected:

        majority_folder = f'/app/output/{folder_name}/{model}/majority'

        majority_files = sorted([file for file in os.listdir(majority_folder) if file.endswith('.npy')])

        for i, maj_file in enumerate(majority_files):
            sleep_probabilities_majority = np.load(
                os.path.join(majority_folder, maj_file))  # 2D array with probabilities

            cumulative_probs = np.cumsum(sleep_probabilities_majority, axis=1)

            colors = ['#364B9A', '#83B8D7', '#EAECCC', '#F99858', '#A50026']

            # Define names for each stage
            stage_names = ['Wake', 'N1', 'N2', 'N3', 'REM']

            fig = go.Figure()

            for j in range(cumulative_probs.shape[1]):
                fig.add_trace(go.Scatter(
                    x=np.arange(0, len(cumulative_probs)),
                    y=cumulative_probs[:, j],
                    mode='lines',
                    name=stage_names[j],
                    line=dict(width=0, color=colors[j]),  # Set line color
                    fill='tonexty',
                    fillcolor=f'rgba{tuple(int(colors[j][i:i + 2], 16) for i in (1, 3, 5)) + (0.5,)}',
                    # Convert HEX to RGBA
                    hoverinfo='none'
                ))
            fig.update_layout(title=f"{maj_file.split('.')[0].split('_')[0]}",
                              xaxis_title='Time (seconds)',
                              yaxis_title='Cumulative Probability',
                              yaxis_range=[0, 1],
                              showlegend=True,
                              )

            fig_json = fig.to_json()

            if not os.path.exists(f"/app/static/{model}"):
                os.makedirs(f"/app/static/{model}")

            with open(f"/app/static/{model}/hypnodensity_{model}_{i}.json", "w") as f:
                json.dump(fig_json, f)

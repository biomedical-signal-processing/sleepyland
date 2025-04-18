import numpy as np
import csv
import os
import shutil
import json
from app.utils.file_handling import delete_file_performance


def compute_metrics(metrics, log):
    delete_file_performance()

    sum_mf1_score = 0
    sum_accuracy = 0
    sum_recall = 0
    sum_precision = 0
    sum_cohen_kappa = 0
    sum_f1_score_wake = 0
    sum_f1_score_n1 = 0
    sum_f1_score_n2 = 0
    sum_f1_score_n3 = 0
    sum_f1_score_rem = 0

    number_of_subjects = 0

    subjects_data = {}
    mean_cm = []

    subjects_data['avg'] = {}

    for model in metrics:
        # Loop through each model category (e.g., 'yasa', 'usleep')
        for category, subjects in model.items():
            if category not in ['yasa', 'usleep', 'deepresnet', 'transformer', 'ensemble']:
                continue

            for subject in subjects:
                number_of_subjects += 1

                # Accumulate the metric values
                sum_mf1_score += float(subject['metrics']['f1_score'])

                sum_accuracy += float(subject['metrics']['accuracy'])
                sum_recall += float(subject['metrics']['recall'])
                sum_precision += float(subject['metrics']['precision'])
                sum_cohen_kappa += float(subject['metrics']['cohen_kappa'])
                sum_f1_score_wake += float(subject['metrics']['f1_score_per_class'][0])
                sum_f1_score_n1 += float(subject['metrics']['f1_score_per_class'][1])
                sum_f1_score_n2 += float(subject['metrics']['f1_score_per_class'][2])
                sum_f1_score_n3 += float(subject['metrics']['f1_score_per_class'][3])
                sum_f1_score_rem += float(subject['metrics']['f1_score_per_class'][4])

                # Initialize the dictionary entry for the subject if not already
                if subject['file'] not in subjects_data:
                    subjects_data[subject['file']] = {}

                # Add the subject's data under the corresponding model category (e.g., 'yasa', 'usleep')
                subjects_data[subject['file']][category] = {
                    "subject": subject['file'],
                    "Mf1_score": subject['metrics']['f1_score'],
                    "accuracy": subject['metrics']['accuracy'],
                    "recall": subject['metrics']['recall'],
                    "precision": subject['metrics']['precision'],
                    "cohen_kappa": subject['metrics']['cohen_kappa'],
                    "f1_score_wake": subject['metrics']['f1_score_per_class'][0],
                    "f1_score_n1": subject['metrics']['f1_score_per_class'][1],
                    "f1_score_n2": subject['metrics']['f1_score_per_class'][2],
                    "f1_score_n3": subject['metrics']['f1_score_per_class'][3],
                    "f1_score_rem": subject['metrics']['f1_score_per_class'][4],
                    "cm": subject['metrics']['cm']
                }

                mean_cm.append(np.array(subject['metrics']['cm']))

            mean_cm_array = np.array(mean_cm)

            if len(subjects) > 1:
                subjects_data['avg'][category] = {
                    "subject": "Average",
                    "Mf1_score": sum_mf1_score / number_of_subjects,
                    "accuracy": sum_accuracy / number_of_subjects,
                    "recall": sum_recall / number_of_subjects,
                    "precision": sum_precision / number_of_subjects,
                    "cohen_kappa": sum_cohen_kappa / number_of_subjects,
                    "f1_score_wake": sum_f1_score_wake / number_of_subjects,
                    "f1_score_n1": sum_f1_score_n1 / number_of_subjects,
                    "f1_score_n2": sum_f1_score_n2 / number_of_subjects,
                    "f1_score_n3": sum_f1_score_n3 / number_of_subjects,
                    "f1_score_rem": sum_f1_score_rem / number_of_subjects,
                    "cm": np.mean(mean_cm_array, axis=0).tolist()
                }

            sum_mf1_score = 0
            sum_accuracy = 0
            sum_recall = 0
            sum_precision = 0
            sum_cohen_kappa = 0
            sum_f1_score_wake = 0
            sum_f1_score_n1 = 0
            sum_f1_score_n2 = 0
            sum_f1_score_n3 = 0
            sum_f1_score_rem = 0
            mean_cm = []

        number_of_subjects = 0

    i = 0
    # create file for each subject
    for subject, data in subjects_data.items():

        # if data is empty, skip
        if not data:
            continue

        # create directory if not exists
        os.makedirs('/app/static/performances', exist_ok=True)

        with open(f'/app/static/performances/metrics_{i}.json', 'w') as f:
            json.dump(data, f)
        i += 1

    return subjects_data

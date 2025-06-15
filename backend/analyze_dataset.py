import pandas as pd
import sys
import json

def analyze_dataset(file_path, target_column=None):
    try:
        # Load dataset and clean column names
        df = pd.read_csv(file_path)
        df.columns = df.columns.str.strip()  # Remove leading/trailing spaces in column names

        # Basic details
        dataset_name = file_path.split("/")[-1]
        size_kb = round(df.memory_usage(deep=True).sum() / 1024, 2)
        total_samples = len(df)
        no_of_attributes = len(df.columns) - 1  # Exclude target column if identified

        # Identify or confirm target column
        if target_column is None:  # Check if target_column is passed or needs inference
            # Infer a probable target column
            possible_targets = ["attack_cat", "label", "class", "target"]
            target_column = next((col for col in df.columns if col.lower() in map(str.lower, possible_targets)), None)
        
        if not target_column or target_column not in df.columns:
            return {
                "error": f"Target column not found in the dataset: {dataset_name}",
                "available_columns": df.columns.tolist()  # Provide a hint about the dataset structure
            }

        # Analyze classes
        class_counts = df[target_column].value_counts().to_dict()
        no_of_classes = len(class_counts)

        # Separate "Normal" class and attack classes
        normal_class = next((cls for cls in class_counts if str(cls).lower() in ["normal", "benign"]), None)
        normal_count = class_counts.pop(normal_class, 0) if normal_class else 0
        no_of_normal_samples = normal_count
        no_of_attack_samples = sum(class_counts.values())
        attack_classes = list(class_counts.keys())

        # Balance assessment considering the ratio between normal and attack samples
        normal_ratio = no_of_normal_samples / total_samples
        attack_ratio = no_of_attack_samples / total_samples

        is_imbalanced = (
            normal_ratio < 0.4 or attack_ratio < 0.4 or  # Either class dominates significantly
            any(count < 0.1 * total_samples for count in class_counts.values())
        )
        dataset_type = "Imbalanced" if is_imbalanced else "Balanced"

        # Prepare analysis
        analysis = {
            "DatasetName": dataset_name,
            "DatasetType": dataset_type,
            "Size(KB)": size_kb,
            "NoOfAttributes": no_of_attributes,
            "NoOfClasses": no_of_classes,
            "TotalSamples": total_samples,
            "SamplesPerClass": {normal_class: normal_count, **class_counts},
            "NoOfNormalSamples": no_of_normal_samples,
            "NoOfAttackSamples": no_of_attack_samples,
            "NormalClass": normal_class,
            "AttackClasses": attack_classes
        }

        return analysis

    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    target_column = sys.argv[2] if len(sys.argv) > 2 else None  # Allow passing target column via arguments
    result = analyze_dataset(file_path, target_column)  # Pass target_column
    print(json.dumps(result))

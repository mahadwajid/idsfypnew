import sys
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_selection import SelectKBest, chi2, VarianceThreshold
from sklearn.impute import SimpleImputer

def preprocess_dataset(
    missingValueHandling, featureScaling, encodingCategorical, featureSelection, dataset_path, output_path
):
    try:
        # Load the dataset
        df = pd.read_csv(dataset_path)

        # Standardize column names by stripping and converting to lowercase
        df.columns = df.columns.str.strip().str.lower()
        print(f"Columns in Dataset: {list(df.columns)}")

        # Replace infinite values with NaN
        df.replace([float('inf'), float('-inf')], float('nan'), inplace=True)

        # Drop the 'id' column if it exists
        if 'id' in df.columns:
            df = df.drop(columns=['id'])
            print("Removed 'id' column.")

        # Separate target labels if present
        target_columns = [col for col in df.columns if col in ['attack_cat', 'label']]
        print(f"Identified Target Columns: {target_columns}")

        targets = df[target_columns] if target_columns else None
        features_df = df.drop(columns=target_columns, errors='ignore')

        # Initialize summaries
        original_missing_values = features_df.isna().sum()
        missing_values_after = original_missing_values
        encoding_summary = {}
        scaling_summary = {}
        feature_selection_summary = {}
        selected_features = list(features_df.columns)

        # Step 1: Handle Missing Values
        if missingValueHandling:
            # Identify numeric and non-numeric columns
            numeric_cols = features_df.select_dtypes(include=["number"]).columns.tolist()
            non_numeric_cols = features_df.select_dtypes(exclude=["number"]).columns.tolist()

            if numeric_cols:
                imputer = SimpleImputer(strategy="mean")
                features_df[numeric_cols] = imputer.fit_transform(features_df[numeric_cols])

            if non_numeric_cols:
                imputer = SimpleImputer(strategy="most_frequent")
                features_df[non_numeric_cols] = imputer.fit_transform(features_df[non_numeric_cols])
            
            missing_values_after = features_df.isna().sum()

        # Step 2: Encode Categorical Variables
        if encodingCategorical:
            non_numeric_cols = features_df.select_dtypes(exclude=["number"]).columns.tolist()
            if non_numeric_cols:
                for col in non_numeric_cols:
                    le = LabelEncoder()
                    features_df[col] = le.fit_transform(features_df[col])
                    encoding_summary[col] = f"Encoded {len(le.classes_)} unique values"

        # Step 3: Feature Selection
        if featureSelection:
            # First, ensure all numeric columns are properly converted
            numeric_cols = features_df.select_dtypes(include=["number"]).columns.tolist()
            non_numeric_cols = features_df.select_dtypes(exclude=["number"]).columns.tolist()
            
            # Convert numeric columns to float
            for col in numeric_cols:
                features_df[col] = pd.to_numeric(features_df[col], errors='coerce')
            
            # Handle non-numeric columns
            if non_numeric_cols:
                # If we have non-numeric columns and no encoding was done, encode them now
                if not encodingCategorical:
                    for col in non_numeric_cols:
                        le = LabelEncoder()
                        features_df[col] = le.fit_transform(features_df[col].astype(str))
                        encoding_summary[col] = f"Encoded {len(le.classes_)} unique values"

            # Now all columns should be numeric
            all_cols = features_df.columns.tolist()
            
            if targets is not None:
                # If we have targets, use chi2 for feature selection
                target = targets[target_columns[0]]
                selector = SelectKBest(score_func=chi2, k=42)
                selector.fit(features_df[all_cols], target)
                selected_features = [all_cols[i] for i in selector.get_support(indices=True)]
                feature_selection_summary = {
                    feature: float(score) for feature, score in zip(selected_features, selector.scores_)
                }
            else:
                # If no targets, use variance-based feature selection
                selector = VarianceThreshold(threshold=0.01)
                selector.fit(features_df[all_cols])
                selected_features = [all_cols[i] for i in selector.get_support(indices=True)]
                # Calculate variance for each feature
                variances = features_df[all_cols].var()
                feature_selection_summary = {
                    feature: float(variances[feature]) for feature in selected_features
                }

            features_df = features_df[selected_features]

        # Step 4: Feature Scaling
        if featureScaling:
            # Get current columns after any previous processing
            current_cols = features_df.columns.tolist()
            
            # Apply scaling to all numeric columns
            numeric_cols = features_df.select_dtypes(include=["number"]).columns.tolist()
            if numeric_cols:
                scaler = StandardScaler()
                features_df[numeric_cols] = scaler.fit_transform(features_df[numeric_cols])
                
                # Calculate scaling summary for all numeric features
                for col in numeric_cols:
                    scaling_summary[col] = {
                        "Scaled Mean": float(features_df[col].mean()),
                        "Scaled Std": float(features_df[col].std())
                    }

        # Concatenate targets back to the processed dataset
        if targets is not None:
            features_df = pd.concat([features_df, targets.reset_index(drop=True)], axis=1)

        # Save the preprocessed dataset
        features_df.to_csv(output_path, index=False)

        # Prepare response summaries
        response = {
            "missingValueSummary": {
                "Original Missing Values": original_missing_values.to_dict(),
                "After Preprocessing": missing_values_after.to_dict()
            },
            "featureScalingSummary": scaling_summary,
            "encodingSummary": encoding_summary,
            "featureSelectionSummary": feature_selection_summary,
            "selectedFeatures": selected_features,
            "preprocessedFilePath": output_path
        }

        return response

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    dataset_path = sys.argv[1]
    options = json.loads(sys.argv[2])
    output_path = sys.argv[3]

    result = preprocess_dataset(**options, dataset_path=dataset_path, output_path=output_path)
    print(json.dumps(result))

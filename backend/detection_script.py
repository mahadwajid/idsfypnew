import sys
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def detect_intrusions(dataset_path, model_path):
    try:
        # Set up logging to stderr instead of stdout
        import logging
        logging.basicConfig(stream=sys.stderr, level=logging.INFO, 
                           format='[%(levelname)s] %(message)s')
        
        # Load dataset
        logging.info(f"Loading dataset from {dataset_path}")
        df = pd.read_csv(dataset_path)
        
        # Standardize column names
        df.columns = df.columns.str.strip().str.lower()
        
        # Load the model
        logging.info(f"Loading model from {model_path}")
        model = joblib.load(model_path)
        
        # Get preprocessing artifacts path
        artifacts_path = model_path.replace('.pkl', '_preprocessing_artifacts.pkl')
        
        # Check if preprocessing artifacts exist
        try:
            preprocessing_artifacts = joblib.load(artifacts_path)
            logging.info("Loaded preprocessing artifacts successfully.")
        except FileNotFoundError:
            logging.warning("Preprocessing artifacts not found. Will attempt to continue without them.")
            preprocessing_artifacts = None
        
        # Extract target columns if they exist
        target_columns = [col for col in df.columns if col in ['attack_cat', 'label']]
        
        if target_columns:
            targets = df[target_columns].copy()
            features = df.drop(columns=target_columns)
        else:
            targets = None
            features = df.copy()
        
        # ALIGNMENT FIX: Check feature alignment with model
        if hasattr(model, 'feature_names_in_'):
            expected_features = list(model.feature_names_in_)
            logging.info(f"Model expects {len(expected_features)} features")
            logging.info(f"Dataset provides {len(features.columns)} features")
            
            # Check for missing features
            missing_features = [f for f in expected_features if f not in features.columns]
            if missing_features:
                logging.warning(f"Missing features: {missing_features}")
                # Add missing features with zeros
                for feature in missing_features:
                    features[feature] = 0
            
            # Reorder features to match model's expected order
            features = features[expected_features]
        elif preprocessing_artifacts and 'selected_features' in preprocessing_artifacts:
            # Use the selected features from preprocessing
            expected_features = preprocessing_artifacts['selected_features']
            logging.info(f"Using {len(expected_features)} features from preprocessing")
            
            # Check for missing features
            missing_features = [f for f in expected_features if f not in features.columns]
            if missing_features:
                logging.warning(f"Missing features: {missing_features}")
                # Add missing features with zeros
                for feature in missing_features:
                    features[feature] = 0
            
            # Only keep the selected features in the right order
            features = features[expected_features]
        else:
            logging.warning("Cannot determine expected feature order. Prediction may fail.")
        
        # Make predictions
        try:
            predictions = model.predict(features)
            logging.info(f"Successfully made predictions on {len(predictions)} samples.")
        except Exception as e:
            logging.error(f"Error during prediction: {str(e)}")
            raise
        
        # Prepare detection results
        detection_results = []
        for idx, row in df.iterrows():
            result = {
                "Index": int(idx),
                "Threat": "Attack" if predictions[idx] == 1 else "Normal",
                "Action": "Block" if predictions[idx] == 1 else "Allow"
            }
            
            # Add timestamp, IPs and protocol if available
            if 'timestamp' in df.columns:
                result["Timestamp"] = str(row['timestamp'])
            if 'src_ip' in df.columns:
                result["Source IP"] = str(row['src_ip'])
            if 'dst_ip' in df.columns:
                result["Destination IP"] = str(row['dst_ip'])
            if 'proto' in df.columns:
                result["Protocol"] = str(row['proto'])
                
            detection_results.append(result)
        
        # Calculate metrics if we have the actual labels
        if 'label' in df.columns:
            y_true = df['label']
            accuracy = accuracy_score(y_true, predictions)
            precision = precision_score(y_true, predictions, zero_division=0)
            recall = recall_score(y_true, predictions, zero_division=0)
            f1 = f1_score(y_true, predictions, zero_division=0)
            cm = confusion_matrix(y_true, predictions)
            tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
            
            metrics = {
                "Total Packets Analyzed": int(len(df)),
                "Intrusions Detected": int(predictions.sum()),
                "Detection Accuracy": f"{accuracy * 100:.2f}%",
                "False Positives": int(fp),
                "False Negatives": int(fn),
                "Precision": f"{precision * 100:.2f}%",
                "Recall": f"{recall * 100:.2f}%",
                "F1 Score": f"{f1 * 100:.2f}%"
            }
        else:
            metrics = {
                "Total Packets Analyzed": int(len(df)),
                "Intrusions Detected": int(predictions.sum())
            }

        result = {
            "DetectionResults": detection_results[:10],  # First 10 results for preview
            "TotalResults": len(detection_results),
            "DetectionMetrics": metrics
        }
        
        # Only output clean JSON to stdout
        print(json.dumps(result, indent=2))
        return result

    except Exception as e:
        import traceback
        error_result = {"error": str(e), "traceback": traceback.format_exc()}
        # Output error as JSON to stdout
        print(json.dumps(error_result, indent=2))
        return error_result

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: python detection_script.py <dataset_path> <model_path>\n")
        sys.exit(1)
        
    dataset_path = sys.argv[1]
    model_path = sys.argv[2]
    
    detect_intrusions(dataset_path, model_path)
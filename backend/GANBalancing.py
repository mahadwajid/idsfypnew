import sys
import os
import torch
import pandas as pd
import torch.nn as nn
import numpy as np
import json
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error

latent_dim = 100
input_dim = 42

# Generator
class Generator(nn.Module):
    def __init__(self, latent_dim, output_dim):
        super(Generator, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(latent_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.Linear(256, 512),
            nn.ReLU(),
            nn.Linear(512, output_dim),
            nn.Tanh()
        )
    def forward(self, x):
        return self.model(x)

# Discriminator
class Discriminator(nn.Module):
    def __init__(self, input_dim):
        super(Discriminator, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    def forward(self, x):
        return self.model(x)

# Function to load models
def load_models(generator_path, discriminator_path):
    generator = Generator(latent_dim, input_dim)
    discriminator = Discriminator(input_dim)
    generator.load_state_dict(torch.load(generator_path))
    discriminator.load_state_dict(torch.load(discriminator_path))
    generator.eval()
    discriminator.eval()
    return generator, discriminator

# Function to generate synthetic data
def generate_synthetic_data(generator, discriminator, test_df, target_count):
    features = test_df.drop(columns=['label', 'attack_cat'])
    scaler = MinMaxScaler(feature_range=(-1, 1))
    normalized_features = scaler.fit_transform(features)

    original_class_counts = test_df['attack_cat'].value_counts()
    minority_classes = original_class_counts[lambda x: x < target_count].index.tolist()
    balanced_test_df = test_df.copy()
    synthetic_samples_list = []
    class_generation_summary = {}

    for minority_class in minority_classes:
        minority_samples = test_df[test_df['attack_cat'] == minority_class]
        samples_to_generate = target_count - len(minority_samples)
        noise = torch.randn((samples_to_generate * 2, latent_dim))
        synthetic_samples = generator(noise).detach()

        discriminator_score = discriminator(synthetic_samples).detach().numpy().flatten()
        top_indices = discriminator_score.argsort()[-samples_to_generate:]
        selected_samples = synthetic_samples[top_indices].numpy()

        synthetic_df = pd.DataFrame(selected_samples, columns=features.columns)
        synthetic_df['label'] = 1
        synthetic_df['attack_cat'] = minority_class
        balanced_test_df = pd.concat([balanced_test_df, synthetic_df], ignore_index=True)
        synthetic_samples_list.append(synthetic_df)

        class_generation_summary[minority_class] = {
            "original_count": len(minority_samples),
            "generated_count": samples_to_generate,
            "total_count_after_generation": len(minority_samples) + samples_to_generate
        }

    return balanced_test_df, synthetic_samples_list, scaler, class_generation_summary

def convert_numpy(obj):
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    elif hasattr(obj, 'item'):
        return obj.item()
    else:
        return obj

# Main script
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python GANBalancing.py <dataset_path> <output_path>")
        sys.exit(1)

    dataset_path = sys.argv[1]
    output_path = sys.argv[2]

    # Define model paths within the script
    generator_path = os.path.join("GANModel", "gan_generator.pth")
    discriminator_path = os.path.join("GANModel", "gan_discriminator.pth")

    # Load models
    generator, discriminator = load_models(generator_path, discriminator_path)

    # Load and process the dataset
    test_df = pd.read_csv(dataset_path)
    target_count = test_df['attack_cat'].value_counts().max()

    balanced_test_df, synthetic_samples_list, scaler, class_generation_summary = generate_synthetic_data(
        generator, discriminator, test_df, target_count
    )

    real_data = torch.tensor(scaler.transform(test_df.drop(columns=['label', 'attack_cat']).values), dtype=torch.float32)
    synthetic_data = torch.tensor(np.vstack([sample.drop(columns=['label', 'attack_cat']).values for sample in synthetic_samples_list]), dtype=torch.float32)

    avg_cosine_similarity = np.mean([
        np.dot(real_data[i], synthetic_data[i]) / (np.linalg.norm(real_data[i]) * np.linalg.norm(synthetic_data[i]))
        for i in range(min(real_data.shape[0], synthetic_data.shape[0]))
    ])

    # Calculate discriminator scores
    real_discriminator_score = discriminator(real_data).detach().numpy().flatten()
    synthetic_discriminator_score = discriminator(synthetic_data).detach().numpy().flatten()

    # Ensure both arrays have the same length
    min_length = min(len(real_discriminator_score), len(synthetic_discriminator_score))
    real_discriminator_score = real_discriminator_score[:min_length]
    synthetic_discriminator_score = synthetic_discriminator_score[:min_length]

    # Calculate average discriminator score (difference between real and synthetic)
    avg_discriminator_score = np.mean(real_discriminator_score - synthetic_discriminator_score)

    # Update evaluation metrics
    evaluation_metrics = {
        "cosine_similarity": float(avg_cosine_similarity),
        "discriminator_score": float(avg_discriminator_score)
    }

    # Count samples per class before and after generation
    original_class_counts = test_df['attack_cat'].value_counts().to_dict()
    generated_class_counts = balanced_test_df['attack_cat'].value_counts().to_dict()

    final_output = {
        "evaluation_metrics": evaluation_metrics,
        "class_generation_summary": class_generation_summary,
        "class_counts_before_generation": original_class_counts,
        "class_counts_after_generation": generated_class_counts,
        "total_samples": {
            "before_generation": len(test_df),
            "after_generation": len(balanced_test_df),
            "total_generated": len(balanced_test_df) - len(test_df)
        }
    }

    # Save balanced dataset
    balanced_test_df.to_csv(output_path, index=False)

    # Print JSON output
    print(json.dumps(convert_numpy(final_output), indent=4))
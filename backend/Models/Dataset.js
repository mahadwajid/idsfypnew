import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    size: { type: String, required: true }, // e.g., 'small', 'large'
    path: { type: String, required: true }, // Path to the uploaded file
    preprocessedPath: { type: String },
    balancedPath: { type: String },
    uploadedAt: { type: Date, default: Date.now },
});

const Dataset = mongoose.model('Dataset', datasetSchema);

export default Dataset;

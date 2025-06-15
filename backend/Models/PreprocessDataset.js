import mongoose from "mongoose";

const datasetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const PreprocessDataset = mongoose.model("PreprocessDataset", datasetSchema);
export default PreprocessDataset;

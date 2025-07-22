import { execFile } from "child_process";
import Dataset from "../Models/Dataset.js";
import path from "path";
import fs from "fs/promises";

export const balanceDatasetWithGAN = async (req, res) => {
    try {
        // Find the most recent dataset with a preprocessedPath
        const dataset = await Dataset.findOne({ preprocessedPath: { $exists: true } }).sort({ uploadedAt: -1 });

        if (!dataset) {
            console.error("No preprocessed dataset found in the database.");
            return res.status(404).json({ error: "No preprocessed dataset found" });
        }

        const uploadsDir = path.resolve("uploads");
        const datasetPath = path.resolve(uploadsDir, dataset.preprocessedPath);

        // Check if the dataset file exists
        if (!await fileExists(datasetPath)) {
            console.error(`Dataset file not found at path: ${datasetPath}`);
            return res.status(400).json({ error: "Dataset file not found" });
        }

        // Define the output filename for the balanced dataset
        const balancedFileName = `balanced_${Date.now()}.csv`;
        const balancedOutputPath = path.resolve(uploadsDir, balancedFileName);

        // Define GAN model paths
        const generatorPath = path.resolve("GANModel", "gan_generator.pth");
        const discriminatorPath = path.resolve("GANModel", "gan_discriminator.pth");

        // Check if GAN model files exist
        if (!await fileExists(generatorPath) || !await fileExists(discriminatorPath)) {
            console.error("GAN model files missing.");
            return res.status(500).json({ error: "GAN model files missing" });
        }

        // Path to the GAN script
        const ganScriptPath = path.resolve("D:/My Repositories/idsfypnew/backend/GANBalancing.py");

        // Run the GAN balancing Python script
        execFile(
            "python",
            [ganScriptPath, datasetPath, balancedOutputPath],
            {
                env: { ...process.env, KMP_DUPLICATE_LIB_OK: "TRUE" },
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            },
            async (error, stdout, stderr) => {
                if (error) {
                    console.error("Error executing GAN script:", stderr);
                    return res.status(500).json({
                        error: "GAN script execution failed",
                        details: stderr
                    });
                }

                if (stderr) {
                    console.warn("GAN script warnings:", stderr);
                }

                try {
                    const output = stdout.trim();
                    const result = JSON.parse(output);

                    if (result.error) {
                        return res.status(500).json(result);
                    }

                    // Check if the balanced dataset file was created
                    if (await fileExists(balancedOutputPath)) {
                        // Save the balanced dataset path in the database
                        dataset.balancedPath = balancedFileName;
                        await dataset.save();

                        res.status(200).json({
                            message: "Dataset balanced successfully and stored in the database",
                            balancedFileName,
                            ...result
                        });
                    } else {
                        res.status(500).json({
                            error: "Balanced dataset file was not created",
                            details: result
                        });
                    }
                } catch (parseError) {
                    console.error("Error parsing GAN script output:", parseError);
                    console.error("Raw output:", stdout);
                    res.status(500).json({
                        error: "Failed to parse GAN results",
                        details: parseError.message,
                        rawOutput: stdout
                    });
                }
            }
        );
    } catch (err) {
        console.error("Error in GAN controller:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// Helper function to check if a file exists
const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch (err) {
        console.error(`File not found at path: ${filePath}`, err);
        return false;
    }
};

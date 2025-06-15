import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import Dataset from "../Models/Dataset.js"; // Database model for dataset info

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const detectIntrusions = async (req, res) => {
    try {
        // Find the most recent dataset with a balanced file
        const datasetRecord = await Dataset.findOne({ balancedPath: { $exists: true } }).sort({ uploadedAt: -1 });

        if (!datasetRecord || !datasetRecord.balancedPath) {
            return res.status(400).json({ error: "No balanced dataset found in the database" });
        }

        const uploadsDir = path.resolve("uploads");
        const balancedDatasetPath = path.resolve(uploadsDir, datasetRecord.balancedPath);

        // Check if the balanced dataset file exists
        if (!await fileExists(balancedDatasetPath)) {
            return res.status(400).json({ error: `Balanced dataset file not found: ${datasetRecord.balancedPath}` });
        }

        // Define model and script paths
        const modelPath = path.resolve(__dirname, "../binary_xgboost_model/binary_xgboost_model.pkl");
        const pythonScript = path.resolve(__dirname, "../detection_script.py");

        // Construct the command for executing the Python intrusion detection script
        const command = `python "${pythonScript}" "${balancedDatasetPath}" "${modelPath}"`;

        console.log(`[INFO] Executing command: ${command}`);

        // Execute the Python script
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
            if (error) {
                console.error(`[ERROR] Execution Failed: ${error.message}`);
                return res.status(500).json({ error: "Error executing intrusion detection script", details: error.message });
            }

            // Log stderr for debugging (won't affect stdout JSON parsing)
            if (stderr) {
                console.log(`[PYTHON LOG] ${stderr}`);
            }

            try {
                // Attempt to parse the output as JSON
                const jsonStartIndex = stdout.indexOf('{');
                if (jsonStartIndex === -1) {
                    throw new Error("No JSON object found in output");
                }
                
                // Extract only the JSON part of the output
                const jsonOutput = stdout.substring(jsonStartIndex);
                const result = JSON.parse(jsonOutput);
                
                return res.json(result);
            } catch (parseError) {
                console.error(`[ERROR] Parsing Output Failed: ${parseError.message}`);
                console.error(`[ERROR] Raw stdout: ${stdout.substring(0, 200)}...`); // Log first 200 chars
                
                return res.status(500).json({ 
                    error: "Error parsing intrusion detection results", 
                    details: parseError.message,
                    rawOutput: stdout.substring(0, 500) // Include part of raw output for debugging
                });
            }
        });
    } catch (err) {
        console.error(`[ERROR] Internal Server Error: ${err.message}`);
        return res.status(500).json({ error: "Internal server error", details: err.message });
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
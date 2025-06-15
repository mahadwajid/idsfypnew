import Dataset from '../Models/Dataset.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDataset = async (req, res) => {
    try {
        const { originalname, size, path: uploadedFilePath } = req.file;

        // Save only the relative path to the database
        const relativePath = path.relative(path.join(__dirname, '../uploads'), uploadedFilePath);

        const dataset = new Dataset({
            name: originalname,
            size: size > 1024 * 1024 ? 'large' : 'small',
            path: relativePath, // Save relative path
        });
        await dataset.save();

        // Analyze the dataset using the Python script
        const pythonScript = path.join(__dirname, '../analyze_dataset.py');
        const absolutePath = path.resolve(__dirname, '../uploads', relativePath);
        const command = `python "${pythonScript}" "${absolutePath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error analyzing dataset: ${stderr}`);
                return res.status(500).json({ error: "Dataset analysis failed", details: stderr });
            }

            const analysis = JSON.parse(stdout);
            res.status(201).json({
                message: 'Dataset uploaded and analyzed successfully',
                dataset,
                analysis,
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to upload dataset', details: err.message });
    }
};


export const getAllDatasets = async (req, res) => {
    try {
        const datasets = await Dataset.find();

        const datasetsWithAnalysis = await Promise.all(
            datasets.map(async (dataset) => {
                // Construct the absolute path to the file
                const absolutePath = path.resolve(__dirname, '../uploads', dataset.path);

                const pythonScript = path.join(__dirname, '../analyze_dataset.py');
                const command = `python "${pythonScript}" "${absolutePath}"`;

                const analysisResult = await new Promise((resolve, reject) => {
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            reject(`Error analyzing dataset: ${stderr}`);
                        } else {
                            resolve(JSON.parse(stdout));
                        }
                    });
                });

                return {
                    ...dataset.toObject(),
                    analysis: analysisResult,
                };
            })
        );

        res.status(200).json(datasetsWithAnalysis);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch datasets with analysis', details: err.message });
    }
};

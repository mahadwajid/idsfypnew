import express from 'express';
import multer from 'multer';
import { uploadDataset, getAllDatasets } from '../Controllers/datasetController.js';
import { preprocessDataset } from '../Controllers/preprocessing.js';
import { balanceDatasetWithGAN } from '../Controllers/GANBalancingController.js';
import { detectIntrusions } from '../Controllers/Intrusiondetction.js';



const router = express.Router();

// Configure Multer for Temporary File Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files in an "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Routes
router.post('/upload', upload.single('dataset'), uploadDataset); // Handle file uploads
router.get('/retrive', getAllDatasets);
// Preprocessing route
router.post("/preprocess", preprocessDataset);

router.post('/balance-gan', balanceDatasetWithGAN);

router.post('/detect-intrusion',detectIntrusions);


export default router;
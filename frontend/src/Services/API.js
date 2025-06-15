import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const signup = async (userData) => {
  const response = await axios.post(`${API_URL}/signup`, userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  return response.data;
};

export const uploadDataset = async (formData, onProgress) => {
  try {
    const response = await axios.post(`${API_URL}/datasets/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) {
          onProgress(percentCompleted); // Invoke the callback
        }
      },
    });
    return response.data.message || 'File uploaded successfully!';
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload the file.');
  }
};

export const fetchAnalysisData = async () => {
  try {
    const response = await axios.get(`${API_URL}/datasets/retrive`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch analysis data.');
  }
};

export const preprocessDataset = async (options) => {
  try {
    const response = await axios.post(`${API_URL}/datasets/preprocess`, options, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to preprocess the dataset.');
  }
};

export const fetchAndBalanceDataset = async () => {
  try {
      const response = await axios.post(`${API_URL}/datasets/balance-gan`);
      return response.data;
  } catch (error) {
      console.error('Error in API call:', error.response?.data || error.message);
      throw error;
  }
};

export const detectIntrusions = async (datasetPath) => {
  try {
      const response = await fetch(`${API_URL}/datasets/detect-intrusion`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ datasetPath }),
      });

      return await response.json();
  } catch (error) {
      console.error("Error in API call:", error);
      return { error: "Failed to connect to server" };
  }
};
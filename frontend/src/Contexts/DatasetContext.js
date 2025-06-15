import React, { createContext, useState, useContext } from 'react';

const DatasetContext = createContext(null);

export const DatasetProvider = ({ children }) => {
  const [datasetName, setDatasetName] = useState(null);
  const [datasetSummary, setDatasetSummary] = useState(null);

  return (
    <DatasetContext.Provider value={{ datasetName, setDatasetName, datasetSummary, setDatasetSummary }}>
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => useContext(DatasetContext); 
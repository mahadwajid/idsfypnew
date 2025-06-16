import React, { useState, useEffect } from "react";
import { preprocessDataset } from "../Services/API";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Alert, Tooltip as MuiTooltip, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useDataset } from '../Contexts/DatasetContext';
import "../CSS/Preprocessing.css";
import { FaChartLine, FaExclamationTriangle, FaBalanceScale, FaCode, FaFilter, FaColumns, FaMinusCircle, FaArrowsAltH, FaTags, FaStar } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, LineElement, ArcElement, Title, Tooltip, Legend);

function Preprocessing() {
  const [preprocessingResults, setPreprocessingResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sampleData, setSampleData] = useState({ before: null, after: null });
  const [selectedOptions, setSelectedOptions] = useState({
    missingValueHandling: false,
    featureScaling: false,
    encodingCategorical: false,
    featureSelection: false,
  });

  const { datasetName } = useDataset();

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem("preprocessingResults");
    if (savedResults) {
      setPreprocessingResults(JSON.parse(savedResults));
    }
  }, []);

  // Save preprocessingResults to localStorage whenever it changes
  useEffect(() => {
    if (preprocessingResults) {
      localStorage.setItem("preprocessingResults", JSON.stringify(preprocessingResults));
    } else {
      localStorage.removeItem("preprocessingResults");
    }
  }, [preprocessingResults]);

  const simulateProgress = (callback) => {
    let simulatedProgress = 0;
    const interval = setInterval(() => {
      simulatedProgress += 10;
      callback(simulatedProgress);
      if (simulatedProgress >= 100) {
        clearInterval(interval);
      }
    }, 500);
  };

  const handleApply = async () => {
    if (!datasetName) {
      alert("Please select a dataset first!");
      return;
    }

    const options = {
      missingValueHandling: document.getElementById("missing-value-handling").checked,
      featureScaling: document.getElementById("feature-scaling").checked,
      encodingCategorical: document.getElementById("encoding-categorical").checked,
      featureSelection: document.getElementById("feature-selection").checked,
      dataset: datasetName,
    };

    setSelectedOptions(options);
    setIsProcessing(true);
    setProgress(0);

    try {
      simulateProgress((progressValue) => setProgress(progressValue));
      const data = await preprocessDataset(options);
      setPreprocessingResults(data);
      
      // Fetch sample data for before/after comparison
      if (data.preprocessedFilePath) {
        // Here you would typically fetch a few rows of both original and preprocessed data
        // For now, we'll use the summaries to show the impact
        setSampleData({
          before: {
            missingValues: Object.values(data.missingValueSummary["Original Missing Values"]).reduce((a, b) => a + b, 0),
            features: Object.keys(data.missingValueSummary["Original Missing Values"]).length,
          },
          after: {
            missingValues: Object.values(data.missingValueSummary["After Preprocessing"]).reduce((a, b) => a + b, 0),
            features: data.selectedFeatures.length,
          }
        });
      }
    } catch (error) {
      console.error("Error during preprocessing:", error);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleClear = () => {
    setPreprocessingResults(null);
    setSampleData({ before: null, after: null });
    localStorage.removeItem("preprocessingResults");
  };

  const renderImpactSummary = () => {
    if (!preprocessingResults) return null;

    const totalMissingBefore = Object.values(preprocessingResults.missingValueSummary["Original Missing Values"]).reduce((a, b) => a + b, 0);
    const totalMissingAfter = Object.values(preprocessingResults.missingValueSummary["After Preprocessing"]).reduce((a, b) => a + b, 0);
    const missingValuesHandled = totalMissingBefore - totalMissingAfter;
    const featuresScaled = Object.keys(preprocessingResults.featureScalingSummary).length;
    const categoricalEncoded = Object.keys(preprocessingResults.encodingSummary).length;
    const featuresSelected = preprocessingResults.selectedFeatures.length;

    return (
      <div className="impact-summary">
        <h3><FaChartLine style={{ marginRight: '0.5rem' }} />Preprocessing Impact Summary</h3>
        <p className="explanation-text">
          This summary shows the overall impact of preprocessing on your dataset. Each card represents a different preprocessing step and its effect on the data.
        </p>
        <div className="impact-cards">
          {selectedOptions.missingValueHandling && (
            <div className="impact-card">
              <h4><FaExclamationTriangle style={{ marginRight: '0.5rem' }} />Missing Values</h4>
              <p>✅ Handled: {missingValuesHandled}</p>
              <p className="card-explanation">Number of missing values that were filled or handled during preprocessing</p>
            </div>
          )}
          {selectedOptions.featureScaling && (
            <div className="impact-card">
              <h4><FaBalanceScale style={{ marginRight: '0.5rem' }} />Feature Scaling</h4>
              <p>✅ Scaled: {featuresScaled} features</p>
              <p className="card-explanation">Number of features that were standardized to have mean=0 and std=1</p>
            </div>
          )}
          {selectedOptions.encodingCategorical && (
            <div className="impact-card">
              <h4><FaCode style={{ marginRight: '0.5rem' }} />Categorical Encoding</h4>
              <p>✅ Encoded: {categoricalEncoded} columns</p>
              <p className="card-explanation">Number of categorical features converted to numerical format</p>
            </div>
          )}
          {selectedOptions.featureSelection && (
            <div className="impact-card">
              <h4><FaFilter style={{ marginRight: '0.5rem' }} />Feature Selection</h4>
              <p>✅ Selected: {featuresSelected} features</p>
              <p className="card-explanation">Number of most important features selected for intrusion detection</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMatrix = (title, data, columnsToDisplay, maxRows = 3) => {
    if (!data || Object.keys(data).length === 0) {
      return <p>{title} data is not available.</p>;
    }

    let rows = [];
    let explanation = "";

    if (title === "Missing Value Summary") {
      const originalValues = Object.entries(data["Original Missing Values"] || {}).slice(0, maxRows);
      const afterValues = Object.entries(data["After Preprocessing"] || {}).slice(0, maxRows);

      rows = originalValues.map(([feature, originalCount], index) => ({
        Feature: feature,
        "Original Missing Count": originalCount,
        "After Preprocessing": afterValues[index] ? afterValues[index][1] : "N/A",
      }));
      explanation = "Shows how many missing values were in each feature before and after preprocessing. A value of 0 means no missing data.";
    } else if (title === "Feature Scaling Summary") {
      rows = Object.entries(data).slice(0, maxRows).map(([key, value]) => {
        // Accessing Scaled Mean and Scaled Std correctly
        return { Feature: key, "Scaled Mean": value["Scaled Mean"], "Scaled Std": value["Scaled Std"] };
      });
      explanation = "Displays the mean and standard deviation after scaling. Mean close to 0 and std close to 1 indicates proper standardization.";
    } else if (title === "Encoding Summary") {
      rows = Object.entries(data).slice(0, maxRows).map(([key, value]) => {
        return { Feature: key, "Value": value };
      });
      console.log("Encoding Summary Rows:", rows);
      explanation = "Provides insights into how categorical features were converted into a numerical format.";
    } else if (title === "Feature Selection Summary") {
      rows = Object.keys(data).slice(0, maxRows).map((feature) => ({ Feature: feature, Value: data[feature] }));
      explanation = "Lists the most important features selected by the model for intrusion detection, based on their relevance.";
    } else if (title === "Raw Data Comparison") {
      const beforeData = data.before.slice(0, maxRows);
      const afterData = data.after.slice(0, maxRows);

      rows = beforeData.map((row, rowIndex) => ({
        "Original Data": JSON.stringify(row),
        "Preprocessed Data": JSON.stringify(afterData[rowIndex] || {})
      }));
      explanation = "A side-by-side comparison of the raw data before and after preprocessing, highlighting the changes made.";
    }

    const tableColumns = columnsToDisplay || Object.keys(rows[0] || {});

    return (
      <div className="summary-section">
        <h4>
          {title}
          <MuiTooltip title={getTooltipText(title)} placement="top">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        </h4>
        <p className="explanation-text">{explanation}</p>
        <table className="summary-table">
          <thead>
            <tr>
              {tableColumns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {tableColumns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getTooltipText = (title) => {
    const tooltips = {
      "Missing Value Summary": "Shows the number of missing values in each feature before and after preprocessing",
      "Feature Scaling Summary": "Displays the mean and standard deviation of features after scaling",
      "Encoding Summary": "Shows how many unique values were encoded for each categorical feature",
      "Feature Selection Summary": "Displays the importance score of each selected feature"
    };
    return tooltips[title] || "";
  };

  // Chart Data Preparations (restored individual graph data variables)
  const missingValueGraphData = preprocessingResults && preprocessingResults.missingValueSummary
    ? {
        labels: Object.keys(preprocessingResults.missingValueSummary["Original Missing Values"] || {}),
        datasets: [
          {
            label: "Original Missing Values",
            data: Object.values(preprocessingResults.missingValueSummary["Original Missing Values"] || {}),
            backgroundColor: "#FFA726",
          },
          {
            label: "After Preprocessing",
            data: Object.values(preprocessingResults.missingValueSummary["After Preprocessing"] || {}),
            backgroundColor: "#42A5F5",
          },
        ],
      }
    : null;

  const featureScalingGraphData = preprocessingResults && preprocessingResults.featureScalingSummary
    ? {
        labels: Object.keys(preprocessingResults.featureScalingSummary || {}),
        datasets: [
          {
            label: "Scaled Mean",
            data: Object.values(preprocessingResults.featureScalingSummary).map(item => item["Scaled Mean"] || 0),
            backgroundColor: "#42A5F5",
            borderColor: "#42A5F5",
            fill: false,
          },
          {
            label: "Scaled Std",
            data: Object.values(preprocessingResults.featureScalingSummary).map(item => item["Scaled Std"] || 0),
            backgroundColor: "#FFA726",
            borderColor: "#FFA726",
            fill: false,
          },
        ],
      }
    : null;

  const encodingGraphData = preprocessingResults && preprocessingResults.encodingSummary
    ? {
        labels: Object.keys(preprocessingResults.encodingSummary || {}),
        datasets: [
          {
            label: "Number of Encoded Features",
            data: Object.values(preprocessingResults.encodingSummary || {}).map(value =>
              parseInt(value.match(/\d+/)?.[0] || 0) // Extract numeric count from the string
            ),
            backgroundColor: "#42A5F5",
          },
        ],
      }
    : null;

  const featureSelectionGraphData = preprocessingResults && preprocessingResults.featureSelectionSummary
    ? {
        labels: Object.keys(preprocessingResults.featureSelectionSummary || {}),
        datasets: [
          {
            label: "Variance Explained (%)",
            data: Object.values(preprocessingResults.featureSelectionSummary || {}).map(value => {
              const numericValue = typeof value === 'string'
                ? parseFloat(value.match(/[\d.]+/)?.[0] || 0) 
                : 0; 
              return numericValue;
            }),
            backgroundColor: [
              "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", 
              "#FF9F40", "#FFA726", "#42A5F5", "#AB47BC", "#26C6DA",
            ],
          },
        ],
      }
    : null;
  
  // Removed renderCharts function as individual graphs are now rendered

  return (
    <div className="preprocessing-container">
      {isProcessing && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">Processing... {progress}%</p>
        </div>
      )}
      
      {datasetName ? (
        <h3 className="dataset-current-info">Currently Processing: {datasetName}</h3>
      ) : (
        <p>No dataset selected for preprocessing. Please upload a dataset from the Home page.</p>
      )}

      <h2 className="page-heading">Preprocessing</h2>

      {datasetName && (
        <div className="options-and-chart">
          <div className="preprocessing-options">
            <h3>Preprocessing Options</h3>
            <form>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input type="checkbox" id="missing-value-handling" />
                  <label htmlFor="missing-value-handling">Missing Value Handling</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="feature-scaling" />
                  <label htmlFor="feature-scaling">Feature Scaling</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="encoding-categorical" />
                  <label htmlFor="encoding-categorical">Encoding Categorical Variables</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="feature-selection" />
                  <label htmlFor="feature-selection">Feature Selection</label>
                </div>
              </div>
              <div className="action-buttons">
                <button type="button" className="preprocessing-apply-button" onClick={handleApply}>
                  Apply
                </button>
                <button type="button" className="preprocessing-clear-button" onClick={handleClear}>
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {preprocessingResults && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            Preprocessing completed successfully. Results have been updated below.
          </Alert>

          {renderImpactSummary()}

          <div className="summary-container">
            <h3>Preprocessing Summaries</h3>

            <div className="summary-section-row">
              {renderMatrix(
                "Missing Value Summary",
                preprocessingResults.missingValueSummary,
                ["Feature", "Original Missing Count", "After Preprocessing"],
                3
              )}
              <div className="summary-graph">
                <h4>
                  Missing Value Handling Graph
                  <MuiTooltip title="Shows the distribution of missing values before and after preprocessing">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </MuiTooltip>
                </h4>
                {missingValueGraphData && <Bar data={missingValueGraphData} options={{ responsive: true }} />}
              </div>
            </div>

            <div className="summary-section-row">
              {renderMatrix(
                "Feature Scaling Summary",
                preprocessingResults.featureScalingSummary,
                ["Feature", "Scaled Mean", "Scaled Std"],
                3
              )}
              <div className="summary-graph">
                <h4>
                  Feature Scaling Graph
                  <MuiTooltip title="Shows the distribution of scaled features">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </MuiTooltip>
                </h4>
                {featureScalingGraphData && <Line data={featureScalingGraphData} options={{ responsive: true }} />}
              </div>
            </div>

            <div className="summary-section-row">
              {renderMatrix(
                "Encoding Summary",
                preprocessingResults.encodingSummary,
                ["Feature", "Value"],
                3
              )}
              <div className="summary-graph">
                <h4>
                  Encoding Graph
                  <MuiTooltip title="Shows the number of unique values encoded for each categorical feature">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </MuiTooltip>
                </h4>
                {encodingGraphData && <Bar data={encodingGraphData} options={{ responsive: true }} />}
              </div>
            </div>

            <div className="summary-section-row">
              {renderMatrix(
                "Feature Selection Summary",
                preprocessingResults.featureSelectionSummary,
                ["Feature", "Value"],
                3
              )}
              <div className="summary-graph">
                <h4>
                  Feature Selection Graph
                  <MuiTooltip title="Shows the importance score of each selected feature">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </MuiTooltip>
                </h4>
                {featureSelectionGraphData && <Pie data={featureSelectionGraphData} options={{ responsive: true }} />}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Preprocessing;
 
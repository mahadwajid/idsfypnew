import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material'; // Material-UI components
import { Bar, Line } from 'react-chartjs-2'; // Chart components
import { FaPlay, FaSyncAlt, FaChartPie, FaChartBar, FaBalanceScale, FaCalculator, FaBroom, FaFileAlt, FaTag, FaHardDrive, FaListAlt, FaLayerGroup, FaTable, FaInfoCircle, FaHdd, FaList, FaCubes, FaExpandArrowsAlt } from 'react-icons/fa'; // Import icons
import '../CSS/DataBalancing.css'; // Import your custom CSS
import { fetchAndBalanceDataset } from '../Services/API'; // Your API call function
import { useDataset } from '../Contexts/DatasetContext'; // Import useDataset

const DataBalancing = () => {
  const [summary, setSummary] = useState(() => {
    const savedSummary = localStorage.getItem('dataSummary');
    return savedSummary ? JSON.parse(savedSummary) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const { datasetName } = useDataset(); // Get datasetName from context

  const chartColors = [
    "rgba(255, 99, 132, 0.6)",  // Red
    "rgba(54, 162, 235, 0.6)",  // Blue
    "rgba(255, 206, 86, 0.6)",  // Yellow
    "rgba(75, 192, 192, 0.6)",  // Teal
    "rgba(153, 102, 255, 0.6)", // Purple
    "rgba(255, 159, 64, 0.6)",  // Orange
    "rgba(199, 199, 199, 0.6)", // Gray
  ];

  const borderColors = chartColors.map((color) => color.replace("0.6", "1.0")); // Brighter borders

  // Save summary to localStorage whenever it changes
  useEffect(() => {
    if (summary) {
      localStorage.setItem('dataSummary', JSON.stringify(summary));
    }
  }, [summary]);

  const simulateProgress = (callback) => {
    let simulatedProgress = 0;
    const interval = setInterval(() => {
      simulatedProgress += 10;
      callback(simulatedProgress);
      if (simulatedProgress >= 100) {
        clearInterval(interval);
      }
    }, 200); // Faster simulation for balancing
  };

  // Handle dataset balancing
  const handleBalanceDataset = async () => {
    if (!datasetName) {
      alert("No dataset selected for balancing. Please upload a dataset from the Home page.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    try {
      simulateProgress((progressValue) => setProgress(progressValue));
      // In a real application, you might pass datasetName to the API call
      // const result = await fetchAndBalanceDataset(datasetName);
      const result = await fetchAndBalanceDataset();
      setSummary(result);
    } catch (error) {
      console.error('Error balancing dataset:', error);
      setError('An error occurred while processing the dataset.');
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  // Clear stored data
  const handleClearData = () => {
    localStorage.removeItem('dataSummary');
    setSummary(null);
  };

  // Format numbers
  const formatNumber = (num) => {
    return Number(num).toFixed(4);
  };

  // Chart data for evaluation metrics
  const getEvaluationChartData = (metrics) => ({
    labels: ['Cosine Similarity', 'Discriminator Score'],
    datasets: [
      {
        label: 'Value',
        data: [metrics.cosine_similarity, metrics.discriminator_score],
        backgroundColor: chartColors.slice(0, 2), // First two colors
        borderColor: borderColors.slice(0, 2),
        borderWidth: 1,
      },
    ],
  });

  // Chart data for distributions
  const getChartData = (data) => ({
    labels: Object.keys(data),
    datasets: [
      {
        label: 'Count',
        data: Object.values(data),
        backgroundColor: chartColors.slice(0, Object.keys(data).length), // Use a subset of colors
        borderColor: borderColors.slice(0, Object.keys(data).length),
        borderWidth: 1,
      },
    ],
  });

  return (
    <div className="data-main-container">
      <Typography variant="h4" align="center" gutterBottom className="page-main-heading">
        Apply GAN Balancing
      </Typography>
      {loading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">Processing... {progress}%</p>
        </div>
      )}

      {datasetName ? (
        <>
          <h3 className="dataset-current-info">Currently Balancing: {datasetName}</h3>
          <div className="text-container">
            <button onClick={handleBalanceDataset} disabled={loading} className="data-balancing-fetch-balance-button">
              {loading ? <><FaSyncAlt className="icon-spin" /> Processing...</> : <><FaPlay /> Fetch & Balance Dataset</>}
            </button>
            {summary && (
              <button onClick={handleClearData} className="data-balancing-clear-button">
                <FaBroom /> Clear Data
              </button>
            )}
          </div>

          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}

          {summary && (
            <div className="summary-container">
              <Typography variant="h5" align="center" gutterBottom className="section-heading">
                Data Balancing Summaries
              </Typography>

              {/* Total Samples Summary */}
              <Card className="total-samples-card">
                <CardHeader title={<> <FaTable /> Total Samples Summary</>} />
                <CardContent>
                  <div className="samples-grid">
                    <div className="sample-item">
                      <h4>Before Generation</h4>
                      <p>{summary.total_samples.before_generation.toLocaleString()}</p>
                    </div>
                    <div className="sample-item">
                      <h4>After Generation</h4>
                      <p>{summary.total_samples.after_generation.toLocaleString()}</p>
                    </div>
                    <div className="sample-item">
                      <h4>Total Generated</h4>
                      <p>{summary.total_samples.total_generated.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Original Distribution */}
              <div className="summary-section-row">
                <Card className="summary-section">
                  <CardHeader title={<><FaChartPie /> Original Distribution</>} />
                  <CardContent>
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(summary.class_counts_before_generation).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                <Card className="summary-graph">
                  <CardHeader title={<><FaChartBar /> Original Distribution Chart</>} />
                  <CardContent>
                    <Bar data={getChartData(summary.class_counts_before_generation)} />
                  </CardContent>
                </Card>
              </div>

              {/* Balanced Distribution */}
              <div className="summary-section-row">
                <Card className="summary-section">
                  <CardHeader title={<><FaBalanceScale /> Balanced Distribution</>} />
                  <CardContent>
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(summary.class_counts_after_generation).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                <Card className="summary-graph">
                  <CardHeader title={<><FaChartBar /> Balanced Distribution Chart</>} />
                  <CardContent>
                    <Bar data={getChartData(summary.class_counts_after_generation)} />
                  </CardContent>
                </Card>
              </div>

              {/* Class Generation Summary */}
              <Card className="generation-summary-card">
                <CardHeader title={<><FaCubes /> Class Generation Summary</>} />
                <CardContent>
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Original Count</th>
                        <th>Generated Count</th>
                        <th>Total After Generation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.class_generation_summary).map(([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{value.original_count.toLocaleString()}</td>
                          <td>{value.generated_count.toLocaleString()}</td>
                          <td>{value.total_count_after_generation.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Evaluation Metrics */}
              <Card className="metrics-card">
                <CardHeader title={<><FaCalculator /> Model Evaluation Metrics</>} />
                <CardContent>
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Cosine Similarity</td>
                        <td>{formatNumber(summary.evaluation_metrics.cosine_similarity)}</td>
                      </tr>
                      <tr>
                        <td>Discriminator Score</td>
                        <td>{formatNumber(summary.evaluation_metrics.discriminator_score)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="chart-container-GAN">
                    <Bar data={getEvaluationChartData(summary.evaluation_metrics)} options={{ responsive: true }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <p>No dataset selected for balancing. Please upload a dataset from the Home page.</p>
      )}
    </div>
  );
};

export default DataBalancing;

import React, { useState, useEffect } from 'react';
import '../CSS/IntrusionDetection.css';
import { detectIntrusions } from '../Services/API';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDataset } from '../Contexts/DatasetContext';

function IntrusionDetection({ onContinue }) {
    const [metrics, setMetrics] = useState(null);
    const [results, setResults] = useState([]);
    const [logs, setLogs] = useState("");
    const [threatCounts, setThreatCounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const resultsPerPage = 10;

    const { datasetName } = useDataset();

    // Load data from localStorage on component mount
    useEffect(() => {
        const storedMetrics = localStorage.getItem('intrusion-metrics');
        const storedResults = localStorage.getItem('intrusion-results');
        const storedLogs = localStorage.getItem('intrusion-logs');
        
        if (storedMetrics) setMetrics(JSON.parse(storedMetrics));
        if (storedResults) setResults(JSON.parse(storedResults));
        if (storedLogs) setLogs(storedLogs);
        
        if (!datasetName) {
            setLogs(storedLogs || "No dataset selected.");
        }
    }, [datasetName]);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        if (metrics) localStorage.setItem('intrusion-metrics', JSON.stringify(metrics));
        if (results.length > 0) localStorage.setItem('intrusion-results', JSON.stringify(results));
        if (logs) localStorage.setItem('intrusion-logs', logs);
    }, [metrics, results, logs]);

    // Calculate threat distribution when results change
    useEffect(() => {
        if (results.length > 0) {
            const counts = results.reduce((acc, item) => {
                acc[item.Threat] = (acc[item.Threat] || 0) + 1;
                return acc;
            }, {});
            setThreatCounts(counts);
        }
    }, [results]);

    const handleDetectIntrusions = async () => {
        if (!datasetName) {
            alert("Please select a dataset first!");
            return;
        }

        setLoading(true);
        try {
            const response = await detectIntrusions(datasetName);
            
            if (response.error) {
                setLogs(response.error);
            } else {
                setMetrics(response.DetectionMetrics);
                setResults(response.DetectionResults);
                setLogs("Intrusion detection completed successfully.");
            }
        } catch (error) {
            setLogs("Error detecting intrusions: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = () => {
        // Clear state
        setMetrics(null);
        setResults([]);
        setThreatCounts({});
        setLogs("Data cleared successfully.");
        setCurrentPage(1);
        
        // Clear localStorage
        localStorage.removeItem('intrusion-metrics');
        localStorage.removeItem('intrusion-results');
        localStorage.removeItem('intrusion-logs');
    };

    // Prepare data for charts
    const prepareMetricsChartData = () => {
        if (!metrics) return [];
        
        return [
            { name: 'Detection Accuracy', value: parseFloat(metrics['Detection Accuracy'].replace('%', '')) },
            { name: 'F1 Score', value: parseFloat(metrics['F1 Score'].replace('%', '')) },
            { name: 'Precision', value: parseFloat(metrics['Precision'].replace('%', '')) },
            { name: 'Recall', value: parseFloat(metrics['Recall'].replace('%', '')) }
        ];
    };

    const preparePieChartData = () => {
        if (!metrics) return [];
        
        return [
            { name: 'Intrusions', value: metrics['Intrusions Detected'] },
            { name: 'Normal Traffic', value: metrics['Total Packets Analyzed'] - metrics['Intrusions Detected'] }
        ];
    };

    const prepareThreatDistributionData = () => {
        return Object.keys(threatCounts).map(key => ({
            name: key,
            count: threatCounts[key]
        }));
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Pagination
    const indexOfLastResult = currentPage * resultsPerPage;
    const indexOfFirstResult = indexOfLastResult - resultsPerPage;
    const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
    const totalPages = Math.ceil(results.length / resultsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="intrusion-dashboard">
            <h3>Intrusion Detection</h3>
            {datasetName ? (
                <div>
                    <h4>Analyzing Dataset: {datasetName}</h4>
                    <div className="intrusion-control-panel">
                        <div className="intrusion-action-btns">
                            <button 
                                className="intrusion-detection-detect-button" 
                                onClick={handleDetectIntrusions}
                                disabled={loading}
                            >
                                {loading ? "Detecting..." : "Detect Intrusions"}
                            </button>
                            <button className="intrusion-detection-continue-button" onClick={onContinue}>
                                Continue with Analysis
                            </button>
                            <button 
                                className="intrusion-detection-clear-button" 
                                onClick={handleClearData}
                                disabled={!metrics && results.length === 0}
                            >
                                Clear Data
                            </button>
                        </div>
                        <div className="intrusion-storage-info">
                            {(metrics || results.length > 0) && (
                                <p>Data is saved in local storage</p>
                            )}
                        </div>
                    </div>

                    {logs && <p className="intrusion-logs">{logs}</p>}

                    {metrics && (
                        <>
                            <div className="intrusion-metrics-panel">
                                <h3>Detection Metrics</h3>
                                <div className="intrusion-metrics-grid">
                                    <div className="intrusion-metrics-summary">
                                        <div className="intrusion-metric-box">
                                            <span className="intrusion-metric-title">Total Packets:</span>
                                            <span className="intrusion-metric-data">{metrics['Total Packets Analyzed'].toLocaleString()}</span>
                                        </div>
                                        <div className="intrusion-metric-box">
                                            <span className="intrusion-metric-title">Intrusions:</span>
                                            <span className="intrusion-metric-data">{metrics['Intrusions Detected'].toLocaleString()}</span>
                                        </div>
                                        <div className="intrusion-metric-box">
                                            <span className="intrusion-metric-title">False Positives:</span>
                                            <span className="intrusion-metric-data">{metrics['False Positives'].toLocaleString()}</span>
                                        </div>
                                        <div className="intrusion-metric-box">
                                            <span className="intrusion-metric-title">False Negatives:</span>
                                            <span className="intrusion-metric-data">{metrics['False Negatives'].toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="intrusion-table-wrapper">
                                        <table className="intrusion-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Metric</th>
                                                    <th>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(metrics).map(([key, value], index) => (
                                                    <tr key={index}>
                                                        <td>{key}</td>
                                                        <td>{value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="intrusion-charts-panel">
                                <h3>Performance Metrics</h3>
                                <div className="intrusion-charts-grid">
                                    <div className="intrusion-chart-box">
                                        <h4>Detection Performance</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={prepareMetricsChartData()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="value" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="intrusion-chart-box">
                                        <h4>Intrusion vs. Normal Traffic</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={preparePieChartData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {preparePieChartData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="intrusion-chart-box">
                                        <h4>Threat Distribution</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={prepareThreatDistributionData()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="count" fill="#82ca9d" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="intrusion-results-panel">
                                <h3>Detection Results</h3>
                                <div className="intrusion-table-wrapper">
                                    <table className="intrusion-data-table">
                                        <thead>
                                            <tr>
                                                <th>Index</th>
                                                <th>Threat</th>
                                                <th>Action</th>
                                                <th>Protocol</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentResults.map((result, index) => (
                                                <tr key={index} className={result.Threat === "Attack" ? "intrusion-alert-row" : ""}>
                                                    <td>{result.Index}</td>
                                                    <td>{result.Threat}</td>
                                                    <td>{result.Action}</td>
                                                    <td>{parseFloat(result.Protocol).toFixed(4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Pagination */}
                                <div className="pagination">
                                    <button 
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        Previous
                                    </button>
                                    <span className="pagination-info">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button 
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <p>No dataset selected for intrusion detection. Please upload a dataset from the Home page.</p>
            )}
        </div>
    );
}

export default IntrusionDetection;
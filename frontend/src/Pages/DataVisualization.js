import React, { useEffect, useState } from 'react';
import { fetchAnalysisData } from '../Services/API';
import '../CSS/DataVisualization.css';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel, VictoryContainer } from 'victory';
import { FaDatabase, FaCheckCircle, FaExclamationCircle, FaChartPie, FaChartBar, FaFile, FaInfoCircle, FaHdd, FaList, FaCubes, FaTable } from 'react-icons/fa';
import { useDataset } from '../Contexts/DatasetContext';

const DataVisualization = () => {
  const { datasetName, datasetSummary } = useDataset();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!datasetName) {
        setAnalysis(null);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchAnalysisData();
        const datasetInfo = data.find(
          (dataset) => dataset.name === datasetName
        );
        if (datasetInfo) {
          setAnalysis(datasetInfo.analysis);
        } else {
          setAnalysis(null);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [datasetName]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }
  if (error) return <p>{error}</p>;

  if (!analysis) {
    return <p>No analysis data available for the selected dataset.</p>;
  }

  const normalVsAttackData = [
    { x: 'Normal', y: analysis.NoOfNormalSamples || 0 },
    { x: 'Attack', y: analysis.NoOfAttackSamples || 0 },
  ];

  const attackClassData = Object.entries(analysis.SamplesPerClass || {})
    .filter(([className]) => className !== analysis.NormalClass)
    .map(([className, count]) => ({ x: className, y: count }));

  return (
    <div className="Main-Container">
      <h1 className="summary-heading">Data Visualization Summary</h1>
      {datasetName ? (
        <>
          <div className="profile-info">
            <div className="left-profile-info">
              <div className="profile-row">
                <p className="bold-light"><FaFile style={{ marginRight: '0.5rem' }} />Dataset:</p>
                <p className="bold-light">
                  {datasetName.split("\\").pop().replace(/^\d+-/, '').split('.')[0]}
                </p>
              </div>
              <div className="profile-row">
                <p className="bold-light"><FaInfoCircle style={{ marginRight: '0.5rem' }} />Type:</p>
                <p className="bold-light">{analysis.DatasetType}</p>
              </div>
            </div>
            <div className="middle-profile-info">
              <div className="profile-row">
                <p className="bold-light"><FaHdd style={{ marginRight: '0.5rem' }} />Size (KB):</p>
                <p className="bold-light">{analysis['Size(KB)']}</p>
              </div>
              <div className="profile-row">
                <p className="bold-light"><FaList style={{ marginRight: '0.5rem' }} />No. of Attributes:</p>
                <p className="bold-light">{analysis.NoOfAttributes}</p>
              </div>
            </div>
            <div className="right-profile-info">
              <div className="profile-row">
                <p className="bold-light"><FaCubes style={{ marginRight: '0.5rem' }} />No. of Classes:</p>
                <p className="bold-light">{analysis.NoOfClasses || 'Data not available'}</p>
              </div>
              <div className="profile-row">
                <p className="bold-light"><FaTable style={{ marginRight: '0.5rem' }} />Total Samples:</p>
                <p className="bold-light">{analysis.TotalSamples}</p>
              </div>
            </div>
          </div>

          <div className="dashboard">
            <div className="dashboard-item">
              <h3>Total Samples</h3>
              <p>
                <FaDatabase />
                {analysis.TotalSamples}
              </p>
            </div>
            <div className="dashboard-item">
              <h3>Normal Samples</h3>
              <p>
                <FaCheckCircle />
                {analysis.NoOfNormalSamples || 'Data not available'}
              </p>
            </div>
            <div className="dashboard-item">
              <h3>Attack Samples</h3>
              <p>
                <FaExclamationCircle />
                {analysis.NoOfAttackSamples || 'Data not available'}
              </p>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="chart-container">
              <h3>
                <FaChartPie style={{ marginRight: '0.5rem' }} />
                Normal vs Attack Distribution
              </h3>
              <VictoryPie
                data={normalVsAttackData}
                colorScale={['#4caf50', '#f44336']}
                labels={({ datum }) => `${datum.x}: ${datum.y}`}
                style={{
                  labels: { fontSize: 14, fill: '#333', fontWeight: 'bold' },
                  parent: { maxWidth: '100%' }
                }}
                width={300}
                height={300}
                padding={40}
                labelRadius={({ radius }) => radius - 40}
              />
            </div>
            <div className="chart-container">
              <h3>
                <FaChartBar style={{ marginRight: '0.5rem' }} />
                Attack Classes Breakdown
              </h3>
              <VictoryChart
                theme={VictoryTheme.material}
                domainPadding={{ x: 20, y: 20 }}
                padding={{ top: 40, bottom: 100, left: 60, right: 40 }}
                width={500}
                height={300}
                containerComponent={
                  <VictoryContainer
                    style={{
                      touchAction: "auto"
                    }}
                  />
                }
              >
                <VictoryAxis
                  label="Attack Classes"
                  style={{
                    axisLabel: { padding: 80, fontSize: 12, fontWeight: 'bold' },
                    tickLabels: { 
                      fontSize: 8, 
                      angle: -45, 
                      textAnchor: 'end',
                      padding: 5
                    }
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  label="Sample Count"
                  style={{
                    axisLabel: { padding: 45, fontSize: 12, fontWeight: 'bold' },
                    tickLabels: { fontSize: 10 }
                  }}
                />
                <VictoryBar
                  data={attackClassData}
                  x="x"
                  y="y"
                  style={{
                    data: { fill: '#f44336', width: 12 },
                    labels: { fontSize: 8, fill: '#333' }
                  }}
                  labels={({ datum }) => datum.y}
                  labelComponent={<VictoryLabel dy={-5} />}
                  alignment="middle"
                />
              </VictoryChart>
            </div>
          </div>
        </>
      ) : (
        <p>No dataset selected. Please upload a dataset from the Home page.</p>
      )}
    </div>
  );
};

export default DataVisualization;

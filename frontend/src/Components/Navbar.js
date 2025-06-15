import React from 'react';
import { Link } from 'react-router-dom';
import { useDataset } from '../Contexts/DatasetContext';
import './Navbar.css';

function Navbar() {
  const { datasetName } = useDataset();

  return (
    <nav className="navbar">
      {datasetName && (
        <div className="navbar-dataset-name">
          Current Dataset: <strong>{datasetName}</strong>
        </div>
      )}
      <div className="nav-links">
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign Up</Link>
      </div>
    </nav>
  );
}

export default Navbar; 
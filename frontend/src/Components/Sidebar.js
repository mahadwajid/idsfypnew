import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaChartBar, FaCogs, FaBalanceScale, FaShieldAlt } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Intrusion Detection System</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaHome className="sidebar-icon" />
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/visualization" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaChartBar className="sidebar-icon" />
            Data Visualization
          </NavLink>
        </li>
        <li>
          <NavLink to="/preprocessing" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaCogs className="sidebar-icon" />
            Preprocessing
          </NavLink>
        </li>
        <li>
          <NavLink to="/balancing" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaBalanceScale className="sidebar-icon" />
            Data Balancing
          </NavLink>
        </li>
        <li>
          <NavLink to="/detection" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaShieldAlt className="sidebar-icon" />
            Intrusion Detection
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar; 
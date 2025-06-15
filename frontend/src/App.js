import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Sidebar from './Components/Sidebar';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import DataVisualization from './Pages/DataVisualization';
import Preprocessing from './Pages/Preprocessing';
import DataBalancing from './Pages/DataBalancing';
import IntrusionDetection from './Pages/IntrusionDetection';
import './App.css';

function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-container">
        <Navbar />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/visualization" element={<DataVisualization />} />
            <Route path="/preprocessing" element={<Preprocessing />} />
            <Route path="/balancing" element={<DataBalancing />} />
            <Route path="/detection" element={<IntrusionDetection />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;

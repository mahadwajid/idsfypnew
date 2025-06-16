import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataset } from '../Contexts/DatasetContext';
import { useAuth } from '../Contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { datasetName } = useDataset();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to get initials from username
  const getInitials = (username) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {datasetName && (
          <div className="navbar-dataset-name">
            Current Dataset: <strong>{datasetName}</strong>
          </div>
        )}
      </div>
      
      <div className="navbar-right">
        {user ? (
          <div className="user-profile">
            <div className="user-avatar">
              {getInitials(user.username)}
            </div>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <button className="navbar-logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="nav-links">
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 
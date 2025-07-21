import React from 'react';
import './Navbar.css';

const Navbar = ({ onPartnerClick, searchQuery, setSearchQuery }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="logo">
          RentZone
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Actions */}
       <div className="nav-actions">
  <button className="partner-btn" onClick={onPartnerClick}>
    Partner with RentZone
  </button>
  <button className="login-btn">LOGIN / SIGN UP</button>
</div>

      </div>
    </nav>
  );
};

export default Navbar;
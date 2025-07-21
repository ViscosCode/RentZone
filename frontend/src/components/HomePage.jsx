import React, { useState } from 'react';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import partnerBg from '../assets/partner-bg.png';
import './HomePage.css';
import ProductCard from './ProductCard';
import Footer from './Footer';

const HomePage = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(null);

  const categories = [
    { name: 'All Categories', type: 'category', items: [] },
    {
      name: 'Automobiles',
      type: 'category',
      items: [
        { name: 'Self Drive Car', type: 'subcategory' },
        { name: 'Bikes & Scooters', type: 'subcategory' },
        { name: 'Outstation Cabs', type: 'subcategory' },
        { name: 'Luxury Cars', type: 'subcategory' },
        { name: 'Segways', type: 'subcategory' },
        { name: 'Golf Cart', type: 'subcategory' },
        { name: 'Car Rental in Goa', type: 'subcategory' },
      ],
    },
    {
      name: 'Drones',
      type: 'category',
      items: [
        { name: 'Thermal Drone', type: 'subcategory' },
        { name: 'Consumer Drone', type: 'subcategory' },
      ],
    },
    {
      name: 'Furniture',
      type: 'category',
      items: [
        { name: 'Office Workstation & Chairs', type: 'subcategory' },
        { name: 'Beds & Mattress', type: 'subcategory' },
        { name: 'Sofa & Recliners', type: 'subcategory' },
        { name: 'Dining Sets', type: 'subcategory' },
        { name: 'Wardrobes & Cabinets', type: 'subcategory' },
        { name: 'Tables', type: 'subcategory' },
        { name: 'Student Combo Deal', type: 'subcategory' },
      ],
    },
    {
      name: 'Generators',
      type: 'category',
      items: [
        { name: 'Diesel Generators', type: 'subcategory' },
        { name: 'Gas Generators', type: 'subcategory' },
      ],
    },
    {
      name: 'Home Appliance',
      type: 'category',
      items: [
        { name: 'Microwave', type: 'subcategory' },
        { name: 'AC & Coolers', type: 'subcategory' },
        { name: 'Combo Deals', type: 'subcategory' },
        { name: 'Refrigerator', type: 'subcategory' },
        { name: 'Washing Machine', type: 'subcategory' },
        { name: 'Deep Freezer', type: 'subcategory' },
        { name: 'Mist Fans', type: 'subcategory' },
        { name: 'Heaters', type: 'subcategory' },
        { name: 'TV', type: 'subcategory' },
        { name: 'Dishwasher', type: 'subcategory' },
        { name: 'RO & Dispensers', type: 'subcategory' },
        { name: 'Home Theatre', type: 'subcategory' },
        { name: 'Air Purifier', type: 'subcategory' },
        { name: 'Geyser', type: 'subcategory' },
      ],
    },
    {
      name: 'Laptops/Computers',
      type: 'category',
      items: [
        { name: 'Macbook Laptops', type: 'subcategory' },
        { name: 'Windows Laptops', type: 'subcategory' },
        { name: 'Desktops', type: 'subcategory' },
      ],
    },
    {
      name: 'Musical Instruments',
      type: 'category',
      items: [
        { name: 'Guitar', type: 'subcategory' },
        { name: 'Flute', type: 'subcategory' },
        { name: 'Harmonium', type: 'subcategory' },
        { name: 'Violin', type: 'subcategory' },
        { name: 'Keyboard', type: 'subcategory' },
        { name: 'Drum', type: 'subcategory' },
        { name: 'Trumpet', type: 'subcategory' },
        { name: 'Ukulele', type: 'subcategory' },
        { name: 'Sitar', type: 'subcategory' },
        { name: 'Tabla', type: 'subcategory' },
        { name: 'Congo', type: 'subcategory' },
      ],
    },
    
  ];

  const handlePartnerClick = () => {
    setIsPopupOpen(true);
    setShowForm(false);
    setShowLoginForm(false);
    setShowDashboard(false);
    setLoginEmail('');
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setShowForm(false);
    setShowLoginForm(false);
    setShowDashboard(false);
    setLoginEmail('');
  };

  const handleRegisterClick = () => {
    setShowForm(true);
    setShowLoginForm(false);
    setShowDashboard(false);
  };

  const handleLoginClick = () => {
    setShowLoginForm(true);
    setShowForm(false);
    setShowDashboard(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch('http://localhost:5000/api/partners/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setLoginEmail(email);
        setShowLoginForm(false);
        setShowDashboard(true);
      } else {
        alert(data.message || 'Invalid email or password!');
      }
    } catch (error) {
      alert('Error logging in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = {
      fullName: e.target.fullName.value,
      businessName: e.target.businessName.value,
      email: e.target.email.value,
      phone: e.target.countryCode.value + ' ' + e.target.phone.value,
      alternatePhone: e.target.alternatePhone.value || '',
      password: e.target.password.value,
      confirmPassword: e.target.confirmPassword.value,
    };

    if (!formData.fullName || !formData.businessName || !formData.email || !formData.phone || !formData.password) {
      alert('Please fill all required fields!');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      setIsLoading(false);
      return;
    }

    if (!e.target.terms.checked) {
      alert('Please accept the Terms and Conditions!');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/partners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setLoginEmail(formData.email);
        setShowForm(false);
        setShowDashboard(true);
      } else {
        alert(data.message || 'Error registering partner!');
      }
    } catch (error) {
      alert('Error registering partner. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = (categoryName) => {
    setOpenDropdown(prev => (prev === categoryName ? null : categoryName));
  };

  const handleDropdownItemClick = (item, categoryName) => {
    if (categoryName === 'All Categories') {
      // Clicking "All Categories" clears filters to show all products
      setSearchQuery('');
      setFilterType(null);
    } else {
      const category = categories.find(cat => cat.name === categoryName);
      if (!item) {
        setSearchQuery(categoryName);
        setFilterType('category');
      } else {
        setSearchQuery(item.name);
        setFilterType('subcategory');
      }
    }
    setOpenDropdown(null);
  };

  return (
    <div>
      <Navbar onPartnerClick={handlePartnerClick} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main>
        <section className="categories-bar">
          <div className="categories-list">
            {categories.map((category, index) => (
              <div
                key={index}
                className="category-item"
                onMouseEnter={() => toggleDropdown(category.name)}
                onMouseLeave={() => toggleDropdown(category.name)}
              >
                <button
                  className="category-btn"
                  onClick={() => handleDropdownItemClick(null, category.name)}
                >
                  {category.name}
                </button>
                {category.items.length > 0 && openDropdown === category.name && (
                  <ul className="dropdown-menu">
                    {category.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="dropdown-item"
                        onClick={() => handleDropdownItemClick(item, category.name)}
                      >
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
        {/* ProductCard will display all products when searchQuery is empty and filterType is null */}
        <ProductCard searchQuery={searchQuery} filterType={filterType} />
      </main>
      <div className="chat-button">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span>Chat with Us</span>
      </div>
      <Footer />
      {isPopupOpen && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close-btn" onClick={handleClosePopup}>
              ×
            </button>
            {showDashboard ? (
              <Dashboard email={loginEmail} onClose={handleClosePopup} />
            ) : showLoginForm ? (
              <div className="login-form-container">
                <div
                  className="side-image"
                  style={{
                    backgroundImage: `url(${partnerBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="login-form">
                  <h2>Login to Your Account</h2>
                  <form onSubmit={handleLoginSubmit}>
                    <input type="email" name="email" placeholder="Email Address *" required />
                    <input type="password" name="password" placeholder="Password *" required />
                    <div className="form-footer">
                      <button type="submit" className="login-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : showForm ? (
              <div className="signup-form-container">
                <div
                  className="side-image"
                  style={{
                    backgroundImage: `url(${partnerBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="signup-form">
                  <h2>Sign Up as Partner & Boost Your Revenue!</h2>
                  <form onSubmit={handleRegisterSubmit}>
                    <input type="text" name="fullName" placeholder="Full Name *" required />
                    <input type="text" name="businessName" placeholder="Business Name *" required />
                    <input type="email" name="email" placeholder="Email Address *" required />
                    <div className="phone-input">
                      <select name="countryCode">
                        <option value="+91">India +91</option>
                      </select>
                      <input type="tel" name="phone" placeholder="Mobile No *" required />
                    </div>
                    <input type="tel" name="alternatePhone" placeholder="Alternate Mobile No" />
                    <input type="password" name="password" placeholder="Password *" required />
                    <input type="password" name="confirmPassword" placeholder="Confirm Password *" required />
                    <div className="form-footer">
                      <label>
                        <input type="checkbox" name="terms" required />
                        Terms and Conditions
                      </label>
                      <div className="form-buttons">
                        <button type="submit" className="partner-btn" disabled={isLoading}>
                          {isLoading ? 'Registering...' : 'Partner with Rentit4me'}
                        </button>
                        <button type="button" className="login-btn" onClick={handleLoginClick}>
                          Login
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="popup-text">
                <h2>Partner With Rentit4me</h2>
                <p>and grow your business</p>
                <div className="popup-buttons">
                  <button className="register-btn" onClick={handleRegisterClick}>
                    Register
                  </button>
                  <button className="login-btn" onClick={handleLoginClick}>
                    Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
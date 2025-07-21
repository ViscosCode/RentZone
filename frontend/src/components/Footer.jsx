import React from "react";
import "./Footer.css";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* About Us */}
        <div className="footer-section">
          <h3>About Us</h3>
          <p>
            Transforming businesses through innovative IT solutions and
            cutting-edge technologies.
          </p>
          <div className="social-icons">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaLinkedinIn /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Reviews</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* Contact Us */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <div className="contact-item">
            <FaMapMarkerAlt />
            <span>
              Chandan Apartment, Rana Nagar, Seven Hills,<br />
              CIDCO, Aurangabad, Maharashtra, India
            </span>
          </div>
          <div className="contact-item">
            <FaPhone />
            <span>+91 9309917269</span>
          </div>
          <div className="contact-item">
            <FaEnvelope />
            <span>futuretech@tvmitsolution.com</span>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>© 2025 TVM IT Solutions. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Sitemap</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
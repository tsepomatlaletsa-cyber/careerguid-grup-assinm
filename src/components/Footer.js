import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";

function Footer() {
  return (
    <footer style={{
      background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
      color: "white",
      padding: "4rem 2rem",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        maxWidth: "1200px",
        margin: "0 auto",
        gap: "2rem"
      }}>
        {/* About */}
        <div style={{ flex: "1 1 200px" }}>
          <h4 style={headingStyle}>About</h4>
          <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
            Career Guidance & Employment Platform helps students explore higher learning institutions,
            apply for courses, and connect with employers in Lesotho.
          </p>
        </div>

        {/* Support */}
        <div style={{ flex: "1 1 150px" }}>
          <h4 style={headingStyle}>Support</h4>
          <ul style={listStyle}>
            <li><Link to="/contact" style={linkStyle}>Contact Us</Link></li>
            <li><Link to="/faq" style={linkStyle}>FAQ</Link></li>
            <li><Link to="/help" style={linkStyle}>Help Center</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div style={{ flex: "1 1 150px" }}>
          <h4 style={headingStyle}>Legal</h4>
          <ul style={listStyle}>
            <li><Link to="/terms" style={linkStyle}>Terms of Service</Link></li>
            <li><Link to="/privacy" style={linkStyle}>Privacy Policy</Link></li>
            <li><Link to="/cookies" style={linkStyle}>Cookie Policy</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div style={{ flex: "1 1 150px" }}>
          <h4 style={headingStyle}>Follow Us</h4>
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.5rem" }}>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" style={socialLink}><FaFacebookF /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" style={socialLink}><FaTwitter /></a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" style={socialLink}><FaLinkedinIn /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" style={socialLink}><FaInstagram /></a>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: "center",
        marginTop: "3rem",
        fontSize: "0.85rem",
        opacity: 0.8
      }}>
        &copy; {new Date().getFullYear()} Career Guidance Platform. All rights reserved.
      </div>
    </footer>
  );
}

// Styles
const headingStyle = {
  fontSize: "1.1rem",
  fontWeight: 700,
  marginBottom: "1rem"
};

const listStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "0.9rem",
  transition: "all 0.3s",
};

const socialLink = {
  color: "white",
  fontSize: "1.2rem",
  transition: "all 0.3s"
};

export default Footer;

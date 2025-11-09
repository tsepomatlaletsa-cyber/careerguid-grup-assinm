import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaUniversity, 
  FaBuilding, 
  FaInfoCircle, 
  FaEnvelope,
  FaBars, 
  FaTimes
} from "react-icons/fa";
import "../styles/main.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  const handleLinkClick = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo / Brand */}
        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          <img
            src="https://static.wixstatic.com/media/23f53a_f89093365b1244e095aa74b5809c6ea5~mv2.png"
            alt="CareerGuide Logo"
            className="navbar-logo-img"
          />
          CareerGuide
        </Link>

        {/* Hamburger Icon */}
        <div className="menu-icon" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Nav Links */}
        <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <Link to="/" className={isActive("/")} onClick={handleLinkClick}>
              <FaHome style={{ marginRight: "5px" }} />
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/institutions"
              className={isActive("/institutions")}
              onClick={handleLinkClick}
            >
              <FaUniversity style={{ marginRight: "5px" }} />
              Institutions
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/companies"
              className={isActive("/companies")}
              onClick={handleLinkClick}
            >
              <FaBuilding style={{ marginRight: "5px" }} />
              Companies
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/about"
              className={isActive("/about")}
              onClick={handleLinkClick}
            >
              <FaInfoCircle style={{ marginRight: "5px" }} />
              About
            </Link>
          </li>
          <li className="nav-item contact-item">
            <Link
              to="/contact"
              className={isActive("/contact")}
              onClick={handleLinkClick}
            >
              <FaEnvelope style={{ marginRight: "5px" }} />
              Contact Us
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;

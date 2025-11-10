import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUniversity,
  FaBuilding,
  FaInfoCircle,
  FaEnvelope,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaSignOutAlt,
  FaSignInAlt,
} from "react-icons/fa";
import { auth, db } from "../pages/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../styles/main.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const handleLinkClick = () => setIsOpen(false);
  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  // 🔹 Listen for user login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.role?.toLowerCase() || null);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      } else {
        setRole(null);
      }
    });
    return unsubscribe;
  }, []);

  // 🔹 Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("✅ Logged out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 🔹 Role-based dashboard redirect
  const goToDashboard = () => {
    const routes = {
      student: "/student",
      graduate: "/student",
      institution: "/institution",
      company: "/company",
      admin: "/admin",
    };
    navigate(routes[role] || "/dashboard");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          <img
            src="https://static.wixstatic.com/media/23f53a_f89093365b1244e095aa74b5809c6ea5~mv2.png"
            alt="CareerGuide Logo"
            className="navbar-logo-img"
          />
          CareerGuide
        </Link>

        {/* Hamburger for mobile */}
        <div className="menu-icon" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Navigation Menu */}
        <div className={isOpen ? "nav-menu active" : "nav-menu"}>
          {/* 🔹 When user is logged in, show only profile + logout */}
          {user ? (
            <div className="navbar-auth">
              <button onClick={goToDashboard} className="auth-btn profile">
                <FaUserCircle />
              </button>

              <button onClick={handleLogout} className="auth-btn logout">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/" className={isActive("/")} onClick={handleLinkClick}>
                <FaHome /> Home
              </Link>

              <Link
                to="/institutions"
                className={isActive("/institutions")}
                onClick={handleLinkClick}
              >
                <FaUniversity /> Institutions
              </Link>

              <Link
                to="/JobsSection"
                className={isActive("/JobsSection")}
                onClick={handleLinkClick}
              >
                <FaBuilding /> Companies
              </Link>

              <Link
                to="/about"
                className={isActive("/about")}
                onClick={handleLinkClick}
              >
                <FaInfoCircle /> About
              </Link>

              <Link
                to="/contact"
                className={isActive("/contact")}
                onClick={handleLinkClick}
              >
                <FaEnvelope /> Contact
              </Link>

              <div className="navbar-auth">
                <Link to="/login" className="auth-btn login">
                  <FaSignInAlt /> Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

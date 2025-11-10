import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact"; 
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RoleSelection from "./pages/RoleSelection";
import JobsSection from "./components/JobsSection";
import InstitutionsSection from "./components/InstitutionsSection";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/JobsSection" element={<JobsSection />} />
        <Route path="/Institutions" element={<InstitutionsSection />} />
        <Route path="/contact" element={<Contact />} /> 
        <Route path="/role" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/institution" element={<InstitutionDashboard />} />
        <Route path="/company" element={<CompanyDashboard />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;

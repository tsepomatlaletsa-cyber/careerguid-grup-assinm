import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/role.css";

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    { label: "Company Account", value: "company", img: "https://img.icons8.com/ios-filled/100/ffffff/company.png" },
    { label: "Undergraduate Student Account", value: "undergraduate", img: "https://img.icons8.com/ios-filled/100/ffffff/student-male.png" },
    { label: "Graduate Student Account", value: "graduate", img: "https://img.icons8.com/ios-filled/100/ffffff/student-male.png" },
    { label: "Institution Account", value: "institution", img: "https://img.icons8.com/ios-filled/100/ffffff/school.png" },
    { label: "Admin Account", value: "admin", img: "https://img.icons8.com/ios-filled/100/ffffff/admin-settings-male.png" },
  ];

  const handleSelectRole = (role) => {
    // Normalize student roles
    const normalizedRole = role === "undergraduate" || role === "graduate" ? "student" : role;
    navigate("/register", { state: { role: normalizedRole } });
  };

  return (
    <div className="role-selection-page">
      <div className="role-selection-overlay"></div>

      <div className="floating-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="shape shape4"></div>
      </div>

      <div className="role-selection-container">
        <h2>Select Account Type</h2>
        <div className="role-cards">
          {roles.map((roleItem) => (
            <div
              key={roleItem.value}
              className="role-card"
              onClick={() => handleSelectRole(roleItem.value)}
            >
              <img src={roleItem.img} alt={roleItem.label} className="role-card-img" />
              <span>{roleItem.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;

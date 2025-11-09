// src/pages/Register.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FaGoogle, FaFacebookF, FaApple } from "react-icons/fa";
import "../styles/register.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRole = location.state?.role;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRole) navigate("/role");
  }, [selectedRole, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      // 1️⃣ Create Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Update displayName
      await updateProfile(user, { displayName: fullName });

      const baseData = {
        uid: user.uid,
        fullName,
        email,
        role: selectedRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 3️⃣ Write to users collection
      await setDoc(doc(db, "users", user.uid), baseData);

      // 4️⃣ Normalize role for collection mapping
      let normalizedRole = selectedRole.toLowerCase();
      if (normalizedRole === "undergraduate" || normalizedRole === "graduate") normalizedRole = "student";

      const roleCollectionMap = {
        student: "students",
        institution: "institutions",
        company: "companies",
        admin: "admins",
      };

      const collectionName = roleCollectionMap[normalizedRole] || "others";

      // 5️⃣ Write to role-specific collection
      await setDoc(doc(db, collectionName, user.uid), {
        ...baseData,
        profile: {},
        documents: {},
      });

      setSuccessMessage("Registration successful! Redirecting...");

      // 6️⃣ Navigate after success
      setTimeout(() => {
        if (normalizedRole === "student") navigate("/student");
        else if (normalizedRole === "institution") navigate("/institution");
        else if (normalizedRole === "company") navigate("/company");
        else if (normalizedRole === "admin") navigate("/admin");
        else navigate("/");
      }, 1500);

    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("This email is already registered. Please login or use another email.");
      } else if (err.code === "auth/weak-password") {
        setErrorMessage("Password too weak. Use at least 6 characters.");
      } else {
        setErrorMessage("Registration failed. Check your info or Firestore rules.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) return null;

  const handleSocialLogin = (provider) => {
    alert(`This would trigger ${provider} login`);
    // Implement actual OAuth login here
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>You are creating a <strong>{selectedRole}</strong> account</h2>
        <form className="register-form" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="signin-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>

        <div className="divider">OR</div>

        <div className="social-login">
          <button className="social-btn google" onClick={() => handleSocialLogin("Google")}>
            <FaGoogle className="social-icon" /> Continue with Google
          </button>
          <button className="social-btn facebook" onClick={() => handleSocialLogin("Facebook")}>
            <FaFacebookF className="social-icon" /> Continue with Facebook
          </button>
          <button className="social-btn apple" onClick={() => handleSocialLogin("Apple")}>
            <FaApple className="social-icon" /> Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;

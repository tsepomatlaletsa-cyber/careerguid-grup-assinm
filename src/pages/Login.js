import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // adjust path if needed
import { FaGoogle, FaFacebookF, FaApple } from "react-icons/fa";
import "../styles/register.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const auth = getAuth();

  // --- Demo users (for instant preview) ---
  const DEMO_USERS = {
    student: { email: "student@example.com", password: "student123" },
    institution: { email: "institution@example.com", password: "institution123" },
    company: { email: "company@example.com", password: "company123" },
    admin: { email: "admin@example.com", password: "admin123" },
  };

  // --- Login handler (Firebase + Firestore role check) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // 1️⃣ Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user) {
        alert("⚠️ Something went wrong. No user returned.");
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch user profile from Firestore safely
      const userRef = doc(db, "users", user.uid);
      let snap;
      try {
        snap = await getDoc(userRef);
      } catch (fireErr) {
        console.error("Firestore error:", fireErr);
        alert("⚠️ Cannot access Firestore. Check rules & permissions.");
        setLoading(false);
        return;
      }

      if (!snap.exists()) {
        alert("⚠️ User profile not found in Firestore. Make sure your Firestore 'users' collection has this UID.");
        setLoading(false);
        return;
      }

      const data = snap.data();
      const role = data.role?.toLowerCase();

      // 3️⃣ Navigate by role
      switch (role) {
        case "graduate":
        case "student":
          navigate("/student");
          break;
        case "institution":
          navigate("/institution");
          break;
        case "company":
          navigate("/company");
          break;
        case "admin":
          navigate("/admin");
          break;
        default:
          alert("⚠️ Unknown role, please contact admin.");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        alert("❌ No user found with this email.");
      } else if (err.code === "auth/wrong-password") {
        alert("❌ Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        alert("❌ Invalid email format.");
      } else {
        alert("⚠️ Login failed. Check your auth method & Firestore rules.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Demo login (auto-fills & signs in) ---
  const handleDemoLogin = async (role) => {
    const user = DEMO_USERS[role];
    if (!user) return alert("Unknown demo role.");

    setEmail(user.email);
    setPassword(user.password);

    // simulate a form submit
    const fakeEvent = { preventDefault: () => {} };
    await handleLogin(fakeEvent);
  };

  // --- Social login placeholders ---
  const handleSocialLogin = (provider) => {
    alert(`This would trigger ${provider} login`);
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Login to your account</h2>
        <form className="register-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {message && (
            <p className={message.includes("failed") ? "error-message" : "success-message"}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading && <span className="loader"></span>}
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="signin-link">
          Don’t have an account? <Link to="/register">Register</Link>
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

        {/* --- DEMO LOGIN BUTTONS --- */}
        <div className="divider">Try Live Demo</div>
        <div className="social-login">
          <button className="social-btn google" onClick={() => handleDemoLogin("student")}>
            🎓 Student Dashboard
          </button>
          <button className="social-btn facebook" onClick={() => handleDemoLogin("institution")}>
            🏫 Institution Dashboard
          </button>
          <button className="social-btn apple" onClick={() => handleDemoLogin("company")}>
            🏢 Company Dashboard
          </button>
          <button className="social-btn apple" onClick={() => handleDemoLogin("admin")}>
            ⚙️ Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

// src/pages/CompanyDashboard.js
import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Bell, FileText, Briefcase, LogOut, User, Menu, X } from "lucide-react";

function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobQualifications, setJobQualifications] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("Profile");
  const navigate = useNavigate();

  // Fetch company, jobs, applicants
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login");

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setErrorMessage("Company profile not found.");
          setLoading(false);
          return;
        }
        setCompany(userDoc.data());

        const jobSnap = await getDocs(
          query(collection(db, "jobs"), where("companyId", "==", user.uid))
        );
        setJobs(jobSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const appSnap = await getDocs(collection(db, "applicants"));
        setApplicants(appSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Post new job
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription || !jobQualifications)
      return setErrorMessage("Fill all fields.");

    try {
      await addDoc(collection(db, "jobs"), {
        companyId: auth.currentUser.uid,
        title: jobTitle,
        description: jobDescription,
        qualifications: jobQualifications.split(",").map((q) => q.trim()),
        applicants: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setJobTitle("");
      setJobDescription("");
      setJobQualifications("");
      setErrorMessage("");

      const jobSnap = await getDocs(
        query(collection(db, "jobs"), where("companyId", "==", auth.currentUser.uid))
      );
      setJobs(jobSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to post job.");
    }
  };

  // Filter qualified applicants
  const filterQualifiedApplicants = (job) => {
    if (!job || applicants.length === 0) return [];

    return applicants.filter((a) => {
      const meetsAcademic = (a.academicPerformance || 0) >= 70;
      const meetsCertOrRelevance =
        (a.certificates?.length || 0) > 0 ||
        a.relevantSkills?.some((skill) =>
          job.description.toLowerCase().includes(skill.toLowerCase())
        );
      const meetsExperience = (a.experienceYears || 0) >= 1;
      return meetsAcademic && meetsCertOrRelevance && meetsExperience;
    });
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  const renderSection = () => {
    switch (selectedSection) {
      case "Profile":
        return (
          <div style={card}>
            <h2 style={sectionTitle}>Profile</h2>
            <p><strong>Name:</strong> {company?.fullName}</p>
            <p><strong>Email:</strong> {company?.email}</p>
          </div>
        );
      case "Job Postings":
        return (
          <div style={card}>
            <h2 style={sectionTitle}>Post a Job</h2>
            <form onSubmit={handlePostJob} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                placeholder="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                style={input}
              />
              <textarea
                placeholder="Job Description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows="3"
                style={input}
              />
              <input
                type="text"
                placeholder="Qualifications (comma separated)"
                value={jobQualifications}
                onChange={(e) => setJobQualifications(e.target.value)}
                style={input}
              />
              <button type="submit" style={btn}>Post Job</button>
            </form>

            <h3 style={{ marginTop: 20 }}>Your Job Postings</h3>
            {jobs.length === 0 ? <p>No jobs posted yet.</p> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 10 }}>
                {jobs.map((job) => {
                  const qualified = filterQualifiedApplicants(job);
                  return (
                    <div key={job.id} style={jobCard}>
                      <h4>{job.title}</h4>
                      <p style={{ fontSize: 14 }}>{job.description}</p>
                      <p style={{ fontSize: 13, color: "#6b7280" }}>
                        <strong>Qualifications:</strong> {Array.isArray(job.qualifications) ? job.qualifications.join(", ") : job.qualifications}
                      </p>

                      <div style={applicantsCard}>
                        <h5>Qualified Applicants ({qualified.length})</h5>
                        {qualified.length === 0 ? (
                          <p>No qualified applicants yet.</p>
                        ) : (
                          <ul style={{ listStyle: "none", padding: 0 }}>
                            {qualified.map((a) => (
                              <li key={a.id} style={applicantItem}>
                                <strong>{a.fullName}</strong> — {a.email}
                                <br />
                                <span style={{ fontSize: 13, color: "#374151" }}>
                                  📚 GPA: {a.academicPerformance || "N/A"} | 🎓 {a.certificates?.length || 0} certs | 💼 {a.experienceYears || 0} yrs exp
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case "Applicants":
        return (
          <div style={card}>
            <h2 style={sectionTitle}>Applicants</h2>
            <p>All applicants will be listed under each job in Job Postings.</p>
          </div>
        );
      case "Notifications":
        return (
          <div style={card}>
            <h2 style={sectionTitle}>Notifications</h2>
            <p>No notifications yet.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={hamburgerBtn}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 250 : 0,
        transition: "width 0.3s",
        background: "#fff",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ padding: 20, fontSize: 22, fontWeight: "bold", color: "#2563eb" }}>
          Company Portal
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
          <button style={navBtn} onClick={() => setSelectedSection("Profile")}><User size={18}/> Profile</button>
          <button style={navBtn} onClick={() => setSelectedSection("Job Postings")}><Briefcase size={18}/> Job Postings</button>
          <button style={navBtn} onClick={() => setSelectedSection("Applicants")}><FileText size={18}/> Applicants</button>
          <button style={navBtn} onClick={() => setSelectedSection("Notifications")}><Bell size={18}/> Notifications</button>
        </nav>

        <button
          onClick={handleLogout}
          style={logoutBtn}
        >
          <LogOut size={18}/> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "40px 60px", overflowY: "auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>Welcome, {company?.fullName}</h1>
        {errorMessage && <p style={{ color: "#dc2626" }}>{errorMessage}</p>}
        {renderSection()}
      </main>
    </div>
  );
}

// --- Styles ---
const hamburgerBtn = {
  position: "fixed",
  top: 20,
  left: 20,
  zIndex: 1000,
  background: "#2563eb",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  padding: 8,
  display: "flex",
  alignItems: "center",
  cursor: "pointer"
};
const navBtn = { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "none", borderRadius: 8, cursor: "pointer", background: "transparent", color: "#333", fontWeight: 500, transition: "0.3s" };
const logoutBtn = { margin: 20, background: "#dc2626", color: "#fff", padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 };
const card = { background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 30 };
const input = { padding: 8, borderRadius: 6, border: "1px solid #ddd", fontSize: 14 };
const btn = { background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer" };
const sectionTitle = { fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#1e3a8a" };
const jobCard = { background: "#ffffff", padding: 15, borderRadius: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" };
const applicantsCard = { background: "#f9fafb", borderRadius: 8, padding: 10, marginTop: 10 };
const applicantItem = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, marginBottom: 8 };

export default CompanyDashboard;

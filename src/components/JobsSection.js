import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../pages/firebase";

function JobsSection() {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch companies & jobs from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const companiesSnap = await getDocs(collection(db, "companies"));
        const jobsSnap = await getDocs(collection(db, "jobs"));

        const companiesData = companiesSnap.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
        const jobsData = jobsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCompanies(companiesData);
        setJobs(jobsData);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Apply Job Handler (Check Login) ---
  const handleApplyJob = (job) => {
    const user = auth.currentUser;

    if (!user) {
      alert("⚠️ Please log in first to apply for jobs.");
      navigate("/login");
      return;
    }

    // if logged in:
    alert(`✅ You have successfully applied for "${job.title}"`);
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading jobs...</p>;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", marginBottom: 60 }}>
      {/* 🌐 Hero Banner Section */}
      <section
        style={{
          background: "url('https://www.funkypigeon.com/blog/wp-content/uploads/2024/12/job-search.jpg') center/cover no-repeat",
          color: "#fff",
          padding: "80px 20px",
          textAlign: "center",
          borderRadius: "0 0 40px 40px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textShadow: "1px 1px 6px rgba(0,0,0,0.7)",
        }}
      >
        <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0 }}>
          Explore Job Opportunities
        </h1>
        <p style={{ fontSize: 18, marginTop: 12, maxWidth: 700 }}>
          Find internships, graduate programs, and full-time positions across verified companies.
        </p>
      </section>

      {/* 🏢 Job Listings */}
      <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 20px" }}>
        {companies.length === 0 && <p>No companies found.</p>}

        {companies.map((comp) => {
          const compJobs = Array.isArray(jobs)
            ? jobs.filter((job) => job.companyId === comp.uid)
            : [];

          const isExpanded = expandedCompany === comp.uid;

          return (
            <div
              key={comp.uid}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 24,
                background: "#fff",
                marginBottom: 24,
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              {/* Company Info */}
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <img
                  src={comp.photoURL || "https://via.placeholder.com/100"}
                  alt={comp.fullName}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 12,
                    objectFit: "cover",
                    border: "2px solid #2563eb",
                  }}
                />
                <div>
                  <h2 style={{ margin: 0, color: "#1e3a8a" }}>
                    {comp.fullName}
                  </h2>
                  <p style={{ margin: "8px 0", color: "#555" }}>
                    {comp.description || "No description provided."}
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
                    <strong>Email:</strong> {comp.email || "N/A"} |{" "}
                    <strong>Website:</strong>{" "}
                    <a
                      href={comp.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#2563eb" }}
                    >
                      {comp.website || "N/A"}
                    </a>
                  </p>
                </div>
              </div>

              {/* Expand Button */}
              <button
                onClick={() =>
                  setExpandedCompany(isExpanded ? null : comp.uid)
                }
                style={{
                  marginTop: 16,
                  padding: "10px 18px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {isExpanded ? "Hide Jobs" : "View Jobs"}
              </button>

              {/* Job Listings per Company */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 20,
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  }}
                >
                  {compJobs.length === 0 && <p>No jobs posted yet.</p>}

                  {compJobs.map((job) => {
                    const createdAt = job.createdAt?.toDate?.() || null;
                    const updatedAt = job.updatedAt?.toDate?.() || null;

                    return (
                      <div
                        key={job.id}
                        style={{
                          border: "1px solid #dbeafe",
                          background: "#f9fafb",
                          borderRadius: 12,
                          padding: 16,
                          transition: "transform 0.2s",
                        }}
                      >
                        <h4 style={{ margin: 0, color: "#1e3a8a" }}>
                          {job.title}
                        </h4>
                        <p style={{ marginTop: 6, color: "#555" }}>
                          {job.description || "No description provided."}
                        </p>

                        {job.qualifications?.length > 0 && (
                          <p style={{ fontSize: 14, color: "#333" }}>
                            <strong>Qualifications:</strong>{" "}
                            {job.qualifications.join(", ")}
                          </p>
                        )}

                        <p style={{ fontSize: 13, color: "#666" }}>
                          <strong>Posted:</strong>{" "}
                          {createdAt ? createdAt.toLocaleString() : "N/A"}
                        </p>
                        <p style={{ fontSize: 13, color: "#666" }}>
                          <strong>Updated:</strong>{" "}
                          {updatedAt ? updatedAt.toLocaleString() : "N/A"}
                        </p>

                        <button
                          onClick={() => handleApplyJob(job)}
                          style={{
                            marginTop: 10,
                            padding: "8px 14px",
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Apply Now
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default JobsSection;

// src/pages/CompanyDashboard.js
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc, 
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  LogOut,
  User,
  Menu,
  X,
  Briefcase,
  FileText,
  Bell,
  Edit
} from "lucide-react";

function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [jobApps, setJobApps] = useState([]);
  

  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobQualifications, setJobQualifications] = useState("");
  const [editingJobId, setEditingJobId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editQuals, setEditQuals] = useState("");
  const [highlightedJobId, setHighlightedJobId] = useState(null);

  

  const navigate = useNavigate();

  // ---------- Fetch Company, Jobs, Applicants ----------
 useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login");

      try {
        const companyRef = doc(db, "users", user.uid);
        const companySnap = await getDoc(companyRef);
        if (!companySnap.exists()) {
          setErrorMessage("Company profile not found.");
          setLoading(false);
          return;
        }
        setCompany(companySnap.data());

        await fetchCompanyData(user.uid);
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const fetchCompanyData = async (companyId) => {
    // Fetch Jobs
    const jobsSnap = await getDocs(
      query(collection(db, "jobs"), where("companyId", "==", companyId))
    );
    setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch Job Applications (real-time)
    const jobAppsQuery = query(collection(db, "JobApplications"), where("companyId", "==", companyId));
    onSnapshot(jobAppsQuery, snapshot => {
      setJobApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  // ---------- Post Job ----------
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription || !jobQualifications) {
      setErrorMessage("Fill all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        companyId: auth.currentUser.uid,
        title: jobTitle,
        description: jobDescription,
        qualifications: jobQualifications.split(",").map(q => q.trim()),
        applicants: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setJobTitle("");
      setJobDescription("");
      setJobQualifications("");
      setErrorMessage("");

      await fetchCompanyData(auth.currentUser.uid);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to post job.");
    }
  };

const handleUpdateApplicationStatus = async (appId, newStatus) => {
  try {
    await updateDoc(doc(db, "JobApplications", appId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    await fetchCompanyData(auth.currentUser.uid); // refresh jobApps state
  } catch (err) {
    console.error(err);
    alert("Failed to update application status");
  }
};



  // ---------- Filter Qualified Applicants ----------
  const filterQualifiedApplicants = (job) => {
    if (!job || applicants.length === 0) return [];

    return applicants.filter((a) => {
      const meetsAcademic = (a.academicPerformance || 0) >= 70;
      const meetsCertOrRelevance =
        (a.certificates?.length || 0) > 0 ||
        a.relevantSkills?.some(skill =>
          job.description.toLowerCase().includes(skill.toLowerCase())
        );
      const meetsExperience = (a.experienceYears || 0) >= 1;
      return meetsAcademic && meetsCertOrRelevance && meetsExperience;
    });
  };

  // ---------- Upload Logo ----------
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const storageRef = ref(storage, `companyLogos/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: url });
      setCompany(prev => ({ ...prev, photoURL: url }));
    } catch (err) {
      console.error("Failed to upload logo:", err);
    }
  };

  // ---------- Update Profile ----------
  const handleProfileUpdate = async (field, value) => {
  if (!company) return;

  try {
    // 1️⃣ Update in users collection
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { [field]: value, updatedAt: serverTimestamp() });

    // 2️⃣ Update in companies collection (assuming companies documents have a field `uid` matching users UID)
    const companiesRef = collection(db, "companies");
    const q = query(companiesRef, where("uid", "==", auth.currentUser.uid));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      querySnap.forEach(async (docSnap) => {
        await updateDoc(doc(db, "companies", docSnap.id), { [field]: value, updatedAt: serverTimestamp() });
      });
    }

    // 3️⃣ Update local state
    setCompany(prev => ({ ...prev, [field]: value }));

    alert(`${field} updated successfully!`);
  } catch (err) {
    console.error(err);
    alert(`Failed to update ${field}`);
  }
};

  // ---------- Logout ----------
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 100 }}>Loading...</p>;

  // ---------- Styles ----------
  const card = { background: "#fff", padding: 18, borderRadius: 12, boxShadow: "0 6px 18px rgba(2,6,23,0.06)", marginBottom: 16 };
  const cardLarge = { ...card, padding: 24 };
  const bigInput = { width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 };
  const primaryButton = { background: "#2563eb", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
  const navBtn = (active) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8,
    border: "none", background: active ? "#2563eb" : "transparent", color: active ? "#fff" : "#0b1220", cursor: "pointer", fontWeight: 700
  });

  // ---------- Render Section ----------
  const renderSection = () => {
    switch (selectedSection) {
      case "Profile":
        return (
          <section style={cardLarge}>
            <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, color: "#0b1220" }}>Company Profile</h2>

            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 12 }}>
              {/* Left - Logo / Picture */}
              <div style={{ width: 220, minWidth: 220 }}>
                <div style={{ width: 220, height: 220, borderRadius: 12, overflow: "hidden", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}>
                  {company?.photoURL
                    ? <img src={company.photoURL} alt="company" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: 12 }}>No logo yet<br />Upload logo</div>}
                </div>
                <div style={{ marginTop: 10 }}>
                  <input type="file" onChange={handlePictureUpload} style={{ display: "block" }} />
                </div>
              </div>

              {/* Right - Company Details */}
              <div style={{ flex: 1 }}>
                {["fullName", "email", "website"].map(field => (
                  <div key={field} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <input
                      type={field === "email" ? "email" : "text"}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={company?.[field] || ""}
                      onChange={e => setCompany(prev => ({ ...prev, [field]: e.target.value }))}
                      style={bigInput}
                    />
                    <button onClick={() => handleProfileUpdate(field, company[field])} style={{ ...primaryButton, minWidth: 120 }}>
                      <Edit size={16} /> Save
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 6 }}>
                  <textarea
                    placeholder="Description"
                    value={company?.description || ""}
                    onChange={e => setCompany(prev => ({ ...prev, description: e.target.value }))}
                    style={{ ...bigInput, minHeight: 120 }}
                  />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => handleProfileUpdate("description", company.description)} style={{ ...primaryButton }}>
                      <Edit size={16} /> Save Description
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

  case "Job Postings":
  

  const startEditJob = (job) => {
    setEditingJobId(job.id);
    setEditTitle(job.title);
    setEditDesc(job.description);
    setEditQuals(Array.isArray(job.qualifications) ? job.qualifications.join(", ") : job.qualifications);
  };

  const cancelEdit = () => setEditingJobId(null);

  const saveEditJob = async (jobId) => {
    if (!editTitle || !editDesc || !editQuals) return alert("All fields are required!");
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        title: editTitle,
        description: editDesc,
        qualifications: editQuals.split(",").map(q => q.trim()),
        updatedAt: serverTimestamp()
      });
      setEditingJobId(null);
      setHighlightedJobId(jobId); // <-- HIGHLIGHT this job
      await fetchCompanyData(auth.currentUser.uid);

      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedJobId(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update job");
    }
  };

  return (
    <section style={cardLarge}>
      <h2 style={{ marginBottom: 12, fontSize: 20, color: "#0b1220" }}>Post a Job</h2>
      {errorMessage && <p style={{ color: "#ef4444" }}>{errorMessage}</p>}

      {/* New Job Form */}
      <form onSubmit={handlePostJob} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="Job Title"
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          style={bigInput}
        />
        <textarea
          placeholder="Job Description"
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          rows="3"
          style={bigInput}
        />
        <input
          type="text"
          placeholder="Qualifications (comma separated)"
          value={jobQualifications}
          onChange={e => setJobQualifications(e.target.value)}
          style={bigInput}
        />
        <button type="submit" style={primaryButton}>Post Job</button>
      </form>

      <h3 style={{ marginTop: 20 }}>Your Job Postings</h3>
      {jobs.length === 0 ? <p>No jobs posted yet.</p> :
        jobs.map(job => {
          const qualified = filterQualifiedApplicants(job);

          const handleJobDelete = async () => {
            if (!window.confirm("Are you sure you want to delete this job?")) return;
            try {
              await deleteDoc(doc(db, "jobs", job.id));
              await fetchCompanyData(auth.currentUser.uid);
            } catch (err) {
              console.error(err);
              alert("Failed to delete job");
            }
          };

          const isEditing = editingJobId === job.id;
          const isHighlighted = highlightedJobId === job.id; // <-- highlight check

          return (
            <div
              key={job.id}
              style={{
                ...card,
                borderLeft: "4px solid #2563eb",
                marginBottom: 16,
                background: isHighlighted ? "#fef9c3" : "#fff", // <-- subtle yellow highlight
                transition: "background 0.3s"
              }}
            >
              {isEditing ? (
                <>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={bigInput} />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ ...bigInput, minHeight: 80 }} />
                  <input type="text" value={editQuals} onChange={e => setEditQuals(e.target.value)} style={bigInput} />
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={() => saveEditJob(job.id)} style={primaryButton}>Save</button>
                    <button onClick={cancelEdit} style={{ ...primaryButton, background: "#ef4444" }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0 }}>{job.title}</h4>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => startEditJob(job)} style={{ ...primaryButton, background: "#facc15" }}>Edit</button>
                      <button onClick={handleJobDelete} style={{ ...primaryButton, background: "#ef4444" }}>Delete</button>
                    </div>
                  </div>
                  <p style={{ marginTop: 8 }}>{job.description}</p>
                  <p><strong>Qualifications:</strong> {Array.isArray(job.qualifications) ? job.qualifications.join(", ") : job.qualifications}</p>
                  <p><strong>Posted At:</strong> {job.createdAt?.toDate?.().toLocaleString() || "N/A"}</p>
                  <p><strong>Last Updated:</strong> {job.updatedAt?.toDate?.().toLocaleString() || "N/A"}</p>

                  <div style={{ background: "#f9fafb", borderRadius: 8, padding: 10, marginTop: 10 }}>
                    <h5>Qualified Applicants ({qualified.length})</h5>
                    {qualified.length === 0 ? <p>No qualified applicants yet.</p> : (
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {qualified.map(a => (
                          <li key={a.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                            <strong>{a.fullName}</strong> — {a.email}<br />
                            <span style={{ fontSize: 13, color: "#374151" }}>
                              📚 GPA: {a.academicPerformance || "N/A"} | 🎓 {a.certificates?.length || 0} certs | 💼 {a.experienceYears || 0} yrs exp
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })
      }
    </section>
  );


  case "Applicants":
        return (
          <section style={cardLarge}>
            <h2 style={{ marginBottom: 12, fontSize: 20, color: "#0b1220" }}>Applicants</h2>
            {jobApps.length === 0 ? (
              <p>No applications received yet.</p>
            ) : (
              jobApps.map(app => (
                <div key={app.id} style={{ ...card, borderLeft: "4px solid #2563eb", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0 }}>{app.jobTitle}</h4>
                    <span style={{ fontWeight: 600, color: app.status === "pending" ? "#f59e0b" : app.status === "approved" ? "#16a34a" : "#ef4444" }}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>

                  <p style={{ marginTop: 8 }}><strong>Applicant:</strong> {app.studentName} ({app.studentEmail || "N/A"})</p>
                  <p><strong>Applied At:</strong> {app.appliedAt?.toDate?.().toLocaleString() || "N/A"}</p>
                  {app.notes && <p><strong>Notes:</strong> {app.notes}</p>}

                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    {app.status === "pending" && (
                      <>
                        <button onClick={() => handleUpdateApplicationStatus(app.id, "approved")} style={{ ...primaryButton, background: "#16a34a" }}>Approve</button>
                        <button onClick={() => handleUpdateApplicationStatus(app.id, "rejected")} style={{ ...primaryButton, background: "#ef4444" }}>Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        );



      case "Notifications":
        return (
          <section style={cardLarge}>
            <h2>Notifications</h2>
            <p>No notifications yet.</p>
          </section>
        );

      default:
        return <p>Section not implemented.</p>;
    }
  };

  // ---------- Layout ----------
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 260 : 0,
        transition: "width 0.3s",
        background: "#fff",
        boxShadow: "2px 0 10px rgba(0,0,0,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ padding: 20, fontSize: 20, fontWeight: 700, color: "#2563eb" }}>Company Portal</div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          {["Profile", "Job Postings", "Applicants", "Notifications"].map(section => (
            <button key={section} style={navBtn(selectedSection === section)} onClick={() => setSelectedSection(section)}>
              {{
                "Profile": <User size={16} />,
                "Job Postings": <Briefcase size={16} />,
                "Applicants": <FileText size={16} />,
                "Notifications": <Bell size={16} />
              }[section]} {section}
            </button>
          ))}
        </nav>
        <div style={{ padding: 20 }}>
          <button onClick={handleLogout} style={{ ...primaryButton, width: "100%", background: "#ef4444", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 28 }}>
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ ...primaryButton, padding: "6px 10px", fontSize: 14 }}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />} Menu
          </button>
          <h1 style={{ fontSize: 22, margin: 0 }}>Welcome, <span style={{ color: "#2563eb" }}>{company?.fullName}</span></h1>
        </div>
        {renderSection()}
      </main>
    </div>
  );
}

export default CompanyDashboard;

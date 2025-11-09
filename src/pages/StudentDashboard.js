// src/pages/StudentDashboard.js
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "./firebase";
import { onAuthStateChanged, signOut,  } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  LogOut,
  User,
  Menu,
  X,
  Building2,
  FileText,
  BookOpen,
  Briefcase,
  Bell,
  Edit
} from "lucide-react";

function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("Profile");
  const [loading, setLoading] = useState(true);

  const [applications, setApplications] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [expandedInst, setExpandedInst] = useState(null);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);


  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login");

      const studentRef = doc(db, "students", user.uid);
      const studentSnap = await getDoc(studentRef);

      setStudent(
        studentSnap.exists() ? studentSnap.data() : { fullName: user.displayName || "Student" }
      );

      await fetchStudentData(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);


  useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch companies
      const compSnap = await getDocs(collection(db, "companies"));
      setCompanies(compSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch jobs
      const jobSnap = await getDocs(collection(db, "jobs"));
      setJobs(jobSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  fetchData();
}, []);


  // ---------- Fetch Data ----------
  const fetchStudentData = async (studentId) => {
    // Applications
    const applicationsSnap = await getDocs(
      query(collection(db, "applications"), where("studentId", "==", studentId), orderBy("createdAt", "desc"))
    );
    setApplications(applicationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Institutions + Faculties + Courses
    const institutionsSnap = await getDocs(collection(db, "institutions"));
    const facultiesSnap = await getDocs(collection(db, "faculties"));
    const coursesSnap = await getDocs(collection(db, "courses"));

    const institutionsData = institutionsSnap.docs.map(instDoc => {
      const instData = instDoc.data();

      const instFaculties = facultiesSnap.docs
        .filter(facDoc => facDoc.data().institutionId === instDoc.id)
        .map(facDoc => {
          const facData = facDoc.data();
          const facCourses = coursesSnap.docs
            .filter(courseDoc => courseDoc.data().facultyId === facDoc.id)
            .map(courseDoc => ({ id: courseDoc.id, ...courseDoc.data() }));
          return { id: facDoc.id, ...facData, courses: facCourses };
        });

      return { id: instDoc.id, ...instData, faculties: instFaculties };
    });

    setInstitutions(institutionsData);

    // Uploads
    const uploadsSnap = await getDocs(
      query(collection(db, "uploads"), where("studentId", "==", studentId), orderBy("createdAt", "desc"))
    );
    setUploads(uploadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Jobs
    const jobsSnap = await getDocs(collection(db, "jobs"));
    const qualifiedJobs = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(job => checkEligibility(student, job));
    setJobs(qualifiedJobs);

    // Notifications
    const notificationsSnap = await getDocs(
      query(collection(db, "notifications"), where("recipientId", "==", studentId), orderBy("createdAt", "desc"))
    );
    setNotifications(notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // ---------- Eligibility ----------
  const checkEligibility = (student, item) => {
    if (!student || !item) return false;
    if (item.requiredGPA && student.gpa < item.requiredGPA) return false;
    return true;
  };

  // ---------- Course Application ----------
  const handleApplyCourse = async (instId, facId, course) => {
    const currentApps = applications.filter(app => app.institutionId === instId);
    if (currentApps.length >= 2) return alert("You can only apply for 2 courses per institution.");
    if (!checkEligibility(student, course)) return alert("You do not meet the requirements for this course.");

    const newApp = {
      studentId: auth.currentUser.uid,
      institutionId: instId,
      facultyId: facId,
      courseId: course.id,
      courseName: course.name,
      institutionName: institutions.find(inst => inst.id === instId)?.fullName,
      status: "Pending",
      createdAt: new Date()
    };

    const appRef = await addDoc(collection(db, "applications"), newApp);
    setApplications(prev => [...prev, { id: appRef.id, ...newApp }]);
    alert("Application submitted!");
  };

  // ---------- Upload ----------
  const handleUpload = async (file, type) => {
    if (!file) return;
    const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "uploads"), {
      studentId: auth.currentUser.uid,
      type,
      url,
      createdAt: new Date()
    });
    await fetchStudentData(auth.currentUser.uid);
    alert("File uploaded!");
  };

  // ---------- Withdraw Application ----------
  const handleWithdrawApplication = async (appId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    await deleteDoc(doc(db, "applications", appId));
    setApplications(prev => prev.filter(a => a.id !== appId));
    alert("Application withdrawn.");
  };

  // ---------- Apply for Job ----------
  const handleApplyJob = async (job) => {
  if (!student) return alert("Student not loaded");

  try {
    await addDoc(collection(db, "JobApplications"), {
      studentId: student.uid,
      studentName: student.fullName || "Unknown",
      jobId: job.id,
      jobTitle: job.title || "No title",
      companyId: job.companyId,
      appliedAt: serverTimestamp(),
      status: "pending",
      notes: ""
    });

    alert("Application submitted successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to apply: " + err.message);
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

  // ---------- Section Rendering ----------
  const renderSection = () => {
    switch (selectedSection) {
      case "Profile":
  return (
    <section style={cardLarge}>
      <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, color: "#0b1220" }}>
        Student Profile
      </h2>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 12 }}>
        {/* PROFILE IMAGE */}
        <div style={{ width: 220, minWidth: 220 }}>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 12,
              overflow: "hidden",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
              position: "relative",
            }}
          >
            {student?.photoURL ? (
              <img
                src={student.photoURL}
                alt="student"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 14,
                  textAlign: "center",
                  padding: 12,
                }}
              >
                No image yet
                <br />
                Upload profile
              </div>
            )}

            {/* Upload Photo Button */}
            <label
              htmlFor="photoUpload"
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                background: "#2563eb",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 500,
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              }}
            >
              Upload
            </label>
            <input
              id="photoUpload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
                  const { storage } = await import("../pages/firebase"); // adjust path if needed

                  const storageRef = ref(storage, `students/${auth.currentUser.uid}/profile.jpg`);
                  await uploadBytes(storageRef, file);
                  const photoURL = await getDownloadURL(storageRef);

                  await updateDoc(doc(db, "students", auth.currentUser.uid), { photoURL });
                  setStudent((prev) => ({ ...prev, photoURL }));
                  alert("Profile photo updated successfully!");
                } catch (err) {
                  console.error(err);
                  alert("Failed to upload image.");
                }
              }}
            />
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <div style={{ flex: 1 }}>
          {["fullName", "email", "phone"].map((field) => (
            <div key={field} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <input
                type={field === "email" ? "email" : "text"}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={student?.[field] || ""}
                onChange={(e) =>
                  setStudent((prev) => ({ ...prev, [field]: e.target.value }))
                }
                style={bigInput}
              />
              <button
                onClick={async () => {
                  await updateDoc(doc(db, "students", auth.currentUser.uid), {
                    [field]: student[field],
                  });
                  alert(`${field} updated`);
                }}
                style={{ ...primaryButton, minWidth: 120 }}
              >
                <Edit size={16} /> Save
              </button>
            </div>
          ))}

          {/* ADDRESS / BIO */}
          <div style={{ marginTop: 6 }}>
            <textarea
              placeholder="Address / Bio"
              value={student?.address || ""}
              onChange={(e) =>
                setStudent((prev) => ({ ...prev, address: e.target.value }))
              }
              style={{ ...bigInput, minHeight: 120 }}
            />
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={async () => {
                  await updateDoc(doc(db, "students", auth.currentUser.uid), {
                    address: student.address,
                  });
                  alert("Address updated");
                }}
                style={{ ...primaryButton }}
              >
                <Edit size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

      case "Institutions":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {institutions.map(inst => {
              const isExpanded = expandedInst === inst.id;
              return (
                <div key={inst.id} style={{ ...card }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <img src={inst.photoURL} alt={inst.fullName} style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover" }} />
                    <div>
                      <h3>{inst.fullName}</h3>
                      <p>{inst.description}</p>
                      <p>
                        <strong>Email:</strong> {inst.documents?.email || "N/A"} | <strong>Website:</strong> {inst.website || "N/A"} <br />
                        <strong>Address:</strong> {inst.documents?.address || "N/A"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setExpandedInst(isExpanded ? null : inst.id)} style={{ ...primaryButton, marginTop: 12 }}>
                    {isExpanded ? "Hide Courses" : "View Courses & Requirements"}
                  </button>
                  {isExpanded && inst.faculties?.length > 0 && (
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      {inst.faculties.map(fac => (
                        <div key={fac.id} style={{ background: "#f1f5f9", padding: 12, borderRadius: 8 }}>
                          <h4>{fac.name}</h4>
                          <ul>
                            {fac.courses?.map(course => {
                              const applied = applications.find(app => app.courseId === course.id);
                              const eligible = checkEligibility(student, course);
                              return (
                                <li key={course.id} style={{ marginBottom: 8 }}>
                                  <div style={{ fontWeight: 700 }}>{course.name}</div>
                                  <div>{course.description || "No description"}</div>
                                  <small>Requirements:</small>
                                  <ul>
                                    {(course.admissionRequirements || []).map((r,i) => <li key={i}>{r}</li>)}
                                  </ul>
                                  {applied ? <span style={{ color: "green" }}>Applied</span> : eligible ? (
                                    <button style={{ ...primaryButton, marginTop: 4 }} onClick={() => handleApplyCourse(inst.id, fac.id, course)}>Apply</button>
                                  ) : <span style={{ color: "red" }}>Not eligible</span>}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

  case "Applications":
  return (
    <div style={{ marginTop: 10 }}>
      <h2 style={{ marginBottom: 12 }}>My Applications</h2>

      {applications.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(2,6,23,0.06)",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          No applications yet.
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 600,
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#334155" }}>#</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#334155" }}>Course / Job</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#334155" }}>Institution</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#334155" }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#334155" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr
                  key={app.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px", color: "#475569" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 500 }}>
                    {app.courseName || app.jobName || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>
                    {app.institutionName || "N/A"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        background:
                          app.status === "admitted"
                            ? "#dcfce7"
                            : app.status === "rejected"
                            ? "#fee2e2"
                            : "#fef9c3",
                        color:
                          app.status === "admitted"
                            ? "#166534"
                            : app.status === "rejected"
                            ? "#991b1b"
                            : "#92400e",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 14,
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
                      onClick={() => handleWithdrawApplication(app.id)}
                    >
                      Withdraw
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

      case "Uploads":
        return (
          <div>
            <h3>Upload Documents</h3>
            <input type="file" onChange={e => handleUpload(e.target.files[0], "document")} />
            <div style={{ marginTop: 12 }}>
              {uploads.map(up => (
                <div key={up.id} style={{ ...card }}>
                  <a href={up.url} target="_blank" rel="noreferrer">{up.type} - View</a>
                  <p>{new Date(up.createdAt.seconds * 1000).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        );

  case "Jobs":
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {companies.length === 0 && <p>Loading companies...</p>}

      {companies.map((comp) => {
        // Filter jobs for this company
        const compJobs = jobs.filter((job) => job.companyId === comp.uid);
        const isExpanded = expandedCompany === comp.uid;

        return (
          <div key={comp.uid} style={{ ...card }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <img
                src={comp.photoURL || "https://via.placeholder.com/120"}
                alt={comp.fullName}
                style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover" }}
              />
              <div>
                <h3>{comp.fullName}</h3>
                <p>{comp.description || "No description provided."}</p>
                <p>
                  <strong>Email:</strong> {comp.email || "N/A"} |{" "}
                  <strong>Website:</strong> {comp.website || "N/A"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setExpandedCompany(isExpanded ? null : comp.uid)}
              style={{ ...primaryButton, marginTop: 12 }}
            >
              {isExpanded ? "Hide Jobs" : "View Jobs"}
            </button>

            {isExpanded && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {compJobs.length === 0 && <p>No jobs posted yet.</p>}
                {compJobs.map((job) => {
                  const isEligible = checkEligibility(student, job);

                  return (
                    <div
                      key={job.id}
                      style={{
                        ...card,
                        borderLeft: "4px solid #2563eb",
                        background: isEligible ? "#f0f9ff" : "#fef2f2",
                        transition: "background 0.3s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0 }}>{job.title}</h4>
                        {isEligible ? (
                          <button
                            style={{ ...primaryButton, background: "#2563eb" }}
                            onClick={() => handleApplyJob(job)}
                          >
                            Apply
                          </button>
                        ) : (
                          <span style={{ color: "red", fontWeight: 600 }}>Not eligible</span>
                        )}
                      </div>

                      <p style={{ marginTop: 8 }}>{job.description || "No description provided."}</p>

                      {job.qualifications?.length > 0 && (
                        <p>
                          <strong>Qualifications:</strong> {job.qualifications.join(", ")}
                        </p>
                      )}

                      <p>
                        <strong>Posted At:</strong> {job.createdAt?.toDate?.().toLocaleString() || "N/A"}
                      </p>
                      <p>
                        <strong>Last Updated:</strong> {job.updatedAt?.toDate?.().toLocaleString() || "N/A"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );





      case "Notifications":
        return (
          <div>
            {notifications.length === 0 && <p>No notifications.</p>}
            {notifications.map(note => (
              <div key={note.id} style={{ ...card }}>
                <p>{note.message}</p>
                <small>{new Date(note.createdAt.seconds * 1000).toLocaleString()}</small>
              </div>
            ))}
          </div>
        );

      default:
        return <p>Section not implemented.</p>;
    }
  };

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
        <div style={{ padding: 20, fontSize: 20, fontWeight: 700, color: "#2563eb" }}>Student Portal</div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          {["Profile","Institutions","Applications","Uploads","Jobs","Notifications"].map(section => (
            <button key={section} style={navBtn(selectedSection === section)} onClick={() => setSelectedSection(section)}>
              {{
                "Profile": <User size={16} />,
                "Institutions": <Building2 size={16} />,
                "Applications": <FileText size={16} />,
                "Uploads": <BookOpen size={16} />,
                "Jobs": <Briefcase size={16} />,
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
          <h1 style={{ fontSize: 22, margin: 0 }}>Welcome, <span style={{ color: "#2563eb" }}>{student?.fullName}</span></h1>
        </div>
        {renderSection()}
      </main>
    </div>
  );
}

export default StudentDashboard;

// src/pages/InstitutionDashboard.js
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, updateDoc, collection, addDoc, getDocs,
  query, where, serverTimestamp, deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Layers, FileText, User, Menu, X, Eye,
  Edit, Trash2, ChevronDown, ChevronUp, Plus, CheckCircle, AlertCircle
} from "lucide-react";

/*
  InstitutionDashboard
  - Profile (big inputs: name, email, website, description, photo)
  - Faculties -> Courses -> admissionRequirements
  - Add/Edit/Delete faculties & courses
  - Toast notifications
  - Sidebar hamburger
  - Prevent admitting student to multiple programs (status change logic)
*/

const Toast = ({ type, message, onClose }) => {
  if (!message) return null;
  const color = type === "success" ? "#16a34a" : "#dc2626";
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, background: color,
      color: "#fff", padding: "10px 16px", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: 8, zIndex: 4000,
      minWidth: 220
    }}>
      {type === "success" ? <CheckCircle /> : <AlertCircle />} <span style={{ fontWeight: 600 }}>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 12, background: "transparent", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>×</button>
    </div>
  );
};

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, width: 540, maxWidth: "94%", maxHeight: "90%", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

function InstitutionDashboard() {
  const [institution, setInstitution] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("Profile");
  const [expandedFaculties, setExpandedFaculties] = useState({});
  const [loading, setLoading] = useState(true);

  // modals
  const [facultyModal, setFacultyModal] = useState({ open: false, name: "", id: null });
  const [courseModal, setCourseModal] = useState({
    open: false, id: null, name: "", facultyId: "", description: "", requirements: [], currentRequirement: ""
  });

  // toast
  const [toast, setToast] = useState({ type: "", message: "" });

  const navigate = useNavigate();

  // load data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login");

      try {
        // institution profile (saved under users collection)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          // ensure default fields exist
          const data = userDoc.data();
          setInstitution({
            uid: user.uid,
            fullName: data.fullName || "",
            email: data.email || user.email || "",
            website: data.website || "",
            description: data.description || "",
            photoURL: data.photoURL || "",
          });
        } else {
          // fallback: minimal details
          setInstitution({ uid: user.uid, fullName: user.displayName || "", email: user.email || "", website: "", description: "", photoURL: "" });
        }

        // faculties
        const fSnap = await getDocs(collection(db, "faculties"));
        const allFacs = fSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(f => f.institutionId === user.uid);
        setFaculties(allFacs);

        // courses
        const cSnap = await getDocs(collection(db, "courses"));
        const allCourses = cSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.institutionId === user.uid);
        // ensure admissionRequirements is array
        const normalizedCourses = allCourses.map(c => ({ ...c, admissionRequirements: Array.isArray(c.admissionRequirements) ? c.admissionRequirements : [] }));
        setCourses(normalizedCourses);

        // applications
        const q = query(collection(db, "applications"), where("institutionId", "==", user.uid));
        const aSnap = await getDocs(q);
        const apps = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApplications(apps);
      } catch (err) {
        console.error("load error", err);
        showToast("error", "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
    // eslint-disable-next-line
  }, [navigate]);

  // toast helper
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3500);
  };

  // Profile handlers
  const handleLogout = async () => { await auth.signOut(); navigate("/login"); };

  const handlePictureUpload = async (e) => {
  if (!e.target.files?.[0]) return;

  const file = e.target.files[0];

  // Create unique path in storage
  const path = `institutions/${auth.currentUser.uid}/profile_${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);

  try {
    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    // Save URL in Firestore
    await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: url });

    // Update state to show preview immediately
    setInstitution(prev => ({ ...prev, photoURL: url }));

    showToast("success", "Profile picture uploaded successfully!");
  } catch (err) {
    console.error("Upload error:", err);
    showToast("error", "Failed to upload picture.");
  }
};

  const handleProfileUpdate = async (field, value) => {
  try {
    // Update users collection
    await updateDoc(doc(db, "users", auth.currentUser.uid), { [field]: value });

    // Update institutions collection
    await updateDoc(doc(db, "institutions", auth.currentUser.uid), { [field]: value });

    setInstitution(prev => ({ ...prev, [field]: value }));
    showToast("success", "Profile updated");
  } catch (err) {
    console.error(err);
    showToast("error", "Failed to update profile");
  }
};

  // Faculty CRUD
  const handleAddEditFaculty = async () => {
    const name = (facultyModal.name || "").trim();
    if (!name) return showToast("error", "Enter faculty name");
    try {
      if (facultyModal.id) {
        await updateDoc(doc(db, "faculties", facultyModal.id), { name });
        setFaculties(prev => prev.map(f => f.id === facultyModal.id ? { ...f, name } : f));
        showToast("success", "Faculty updated");
      } else {
        const refDoc = await addDoc(collection(db, "faculties"), {
          name,
          institutionId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        setFaculties(prev => [...prev, { id: refDoc.id, name, institutionId: auth.currentUser.uid }]);
        showToast("success", "Faculty added");
      }
      setFacultyModal({ open: false, name: "", id: null });
    } catch (err) {
      console.error(err);
      showToast("error", "Operation failed");
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm("Delete faculty and all its courses?")) return;
    try {
      // delete faculty
      await deleteDoc(doc(db, "faculties", id));
      // soft local cleanup (courses should also be removed in DB by you or cascade)
      setFaculties(prev => prev.filter(f => f.id !== id));
      setCourses(prev => prev.filter(c => c.facultyId !== id));
      showToast("success", "Faculty deleted");
    } catch (err) {
      console.error(err);
      showToast("error", "Delete failed");
    }
  };

  // Course CRUD
  const handleAddEditCourse = async () => {
    const c = courseModal;
    const name = (c.name || "").trim();
    if (!name || !c.facultyId) return showToast("error", "Enter course name and select faculty");
    try {
      if (c.id) {
        await updateDoc(doc(db, "courses", c.id), {
          name,
          description: c.description || "",
          admissionRequirements: Array.isArray(c.requirements) ? c.requirements : []
        });
        setCourses(prev => prev.map(course => course.id === c.id ? {
          ...course,
          name,
          description: c.description || "",
          admissionRequirements: Array.isArray(c.requirements) ? c.requirements : []
        } : course));
        showToast("success", "Course updated");
      } else {
        const refDoc = await addDoc(collection(db, "courses"), {
          name,
          description: c.description || "",
          facultyId: c.facultyId,
          admissionRequirements: Array.isArray(c.requirements) ? c.requirements : [],
          institutionId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        setCourses(prev => [...prev, { id: refDoc.id, name, description: c.description || "", facultyId: c.facultyId, admissionRequirements: Array.isArray(c.requirements) ? c.requirements : [], institutionId: auth.currentUser.uid }]);
        showToast("success", "Course added");
      }
      setCourseModal({ open: false, id: null, name: "", facultyId: "", description: "", requirements: [], currentRequirement: "" });
    } catch (err) {
      console.error(err);
      showToast("error", "Operation failed");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await deleteDoc(doc(db, "courses", id));
      setCourses(prev => prev.filter(c => c.id !== id));
      showToast("success", "Course deleted");
    } catch (err) {
      console.error(err);
      showToast("error", "Delete failed");
    }
  };

  // Applications: status change with duplicate-admit prevention
  const handleStatusChange = async (id, status) => {
    try {
      const app = applications.find(a => a.id === id);
      if (!app) return showToast("error", "Application not found");

      if (status === "admitted") {
        // check if student already admitted to any other course in this institution
        const already = applications.find(a => a.studentId === app.studentId && a.status === "admitted" && a.id !== id);
        if (already) return showToast("error", "Student already admitted to another program");
      }

      await updateDoc(doc(db, "applications", id), { status });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      showToast("success", "Status updated");
    } catch (err) {
      console.error(err);
      showToast("error", "Status update failed");
    }
  };

  // helper: open course modal prefilled (ensure requirements array)
  const openCourseModalForEdit = (course) => {
    setCourseModal({
      open: true,
      id: course.id,
      name: course.name || "",
      facultyId: course.facultyId || "",
      description: course.description || "",
      requirements: Array.isArray(course.admissionRequirements) ? [...course.admissionRequirements] : [],
      currentRequirement: ""
    });
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 80 }}>Loading dashboard...</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 260 : 0,
        transition: "all 0.28s ease",
        background: "#fff",
        boxShadow: "2px 0 10px rgba(2,6,23,0.06)",
        overflow: "hidden"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #eef2f7" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontWeight: 700 }}>
              I
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Institution Admin</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{institution?.fullName || "Your institution"}</div>
            </div>
          </div>

          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => setSelectedSection("Profile")} style={navBtn(selectedSection === "Profile")}>
            <User size={18} /> <span>Profile</span>
          </button>
          <button onClick={() => setSelectedSection("Faculties")} style={navBtn(selectedSection === "Faculties")}>
            <Layers size={18} /> <span>Faculties & Courses</span>
          </button>
          <button onClick={() => setSelectedSection("Applications")} style={navBtn(selectedSection === "Applications")}>
            <FileText size={18} /> <span>Applications</span>
          </button>
        </nav>

        <div style={{ padding: 18 }}>
          <button onClick={handleLogout} style={{ width: "100%", background: "#ef4444", color: "#fff", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28 }}>
        {/* top bar small hamburger for convenience */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 10px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />} Menu
            </button>
            <h1 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>Welcome, <span style={{ color: "#2563eb" }}>{institution?.fullName || "Institution"}</span></h1>
          </div>
        </div>

        {/* Sections */}
        {selectedSection === "Profile" && (
          <section style={cardLarge}>
            <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, color: "#0b1220" }}>Institution Profile</h2>

            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 12 }}>
              {/* Left - big picture */}
              <div style={{ width: 220, minWidth: 220 }}>
                <div style={{ width: 220, height: 220, borderRadius: 12, overflow: "hidden", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}>
                  {institution?.photoURL
                    ? <img src={institution.photoURL} alt="institution" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: 12 }}>No image yet<br/>Upload logo</div>
                  }
                </div>
                <div style={{ marginTop: 10 }}>
                  <input type="file" onChange={handlePictureUpload} style={{ display: "block" }} />
                </div>
              </div>

              {/* Right - big inputs */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <input type="text" placeholder="Institution full name" value={institution?.fullName || ""} onChange={e => setInstitution(prev => ({ ...prev, fullName: e.target.value }))} style={bigInput} />
                  <button onClick={() => handleProfileUpdate("fullName", institution.fullName)} style={{ ...primaryButton, minWidth: 120 }}><Edit /> Save</button>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <input type="email" placeholder="Email" value={institution?.email || ""} onChange={e => setInstitution(prev => ({ ...prev, email: e.target.value }))} style={bigInput} />
                  <button onClick={() => handleProfileUpdate("email", institution.email)} style={{ ...primaryButton, minWidth: 120 }}><Edit /> Save</button>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <input type="text" placeholder="Website" value={institution?.website || ""} onChange={e => setInstitution(prev => ({ ...prev, website: e.target.value }))} style={bigInput} />
                  <button onClick={() => handleProfileUpdate("website", institution.website)} style={{ ...primaryButton, minWidth: 120 }}><Edit /> Save</button>
                </div>

                <div style={{ marginTop: 6 }}>
                  <textarea placeholder="Description" value={institution?.description || ""} onChange={e => setInstitution(prev => ({ ...prev, description: e.target.value }))} style={{ ...bigInput, minHeight: 120 }} />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => handleProfileUpdate("description", institution.description)} style={{ ...primaryButton }}><Edit /> Save Description</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {selectedSection === "Faculties" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Faculties & Courses</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setFacultyModal({ open: true, name: "", id: null })} style={{ ...primaryButton, background: "#059669" }}><Plus /> Add Faculty</button>
                <button onClick={() => {
                  // refresh from DB
                  setLoading(true);
                  (async () => {
                    const fSnap = await getDocs(collection(db, "faculties"));
                    setFaculties(fSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(f => f.institutionId === auth.currentUser.uid));
                    const cSnap = await getDocs(collection(db, "courses"));
                    setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.institutionId === auth.currentUser.uid));
                    setLoading(false);
                    showToast("success", "Refreshed");
                  })();
                }} style={{ ...secondaryButton }}>Refresh</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {faculties.length === 0 && <div style={{ gridColumn: "1 / -1", padding: 16, borderRadius: 10, background: "#fff", boxShadow: "0 2px 8px rgba(2,6,23,0.04)" }}>
                No faculties yet. Click "Add Faculty" to get started.
              </div>}
              {faculties.map(f => (
                <div key={f.id} style={{ background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{f.name}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setFacultyModal({ open: true, name: f.name, id: f.id })} style={{ ...iconBtn, background: "#facc15", color: "#000" }}><Edit /></button>
                      <button onClick={() => {
                        if (window.confirm("Delete faculty and its courses locally? This will remove faculty doc.")) {
                          handleDeleteFaculty(f.id);
                        }
                      }} style={{ ...iconBtn, background: "#ef4444" }}><Trash2 /></button>
                      <button onClick={() => setExpandedFaculties(prev => ({ ...prev, [f.id]: !prev[f.id] }))} style={{ ...iconBtn }}>
                        {expandedFaculties[f.id] ? <ChevronUp /> : <ChevronDown />}
                      </button>
                    </div>
                  </div>

                  {expandedFaculties[f.id] && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <select value={courseModal.facultyId} onChange={e => setCourseModal(prev => ({ ...prev, facultyId: e.target.value }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #e6eef6" }}>
                          <option value="">Select faculty</option>
                          {faculties.map(ff => <option key={ff.id} value={ff.id}>{ff.name}</option>)}
                        </select>
                        <button onClick={() => setCourseModal({ open: true, id: null, name: "", facultyId: f.id, description: "", requirements: [], currentRequirement: "" })} style={{ ...primaryButton, background: "#059669" }}><Plus /> New course</button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {courses.filter(c => c.facultyId === f.id).length === 0 && <div style={{ color: "#475569" }}>No courses yet for this faculty.</div>}
                        {courses.filter(c => c.facultyId === f.id).map(course => (
                          <div key={course.id} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>{course.name}</div>
                              <div style={{ color: "#475569", fontSize: 13 }}>{course.description || "No description"}</div>
                              <div style={{ marginTop: 6 }}>
                                <small style={{ color: "#0f172a", fontWeight: 600 }}>Requirements:</small>
                                <ul style={{ margin: "6px 0 0 16px" }}>
                                  {(course.admissionRequirements || []).map((r, i) => <li key={i} style={{ fontSize: 13 }}>{r}</li>)}
                                </ul>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => openCourseModalForEdit(course)} style={{ ...iconBtn, background: "#facc15", color: "#000" }}><Edit /></button>
                              <button onClick={() => {
                                if (window.confirm("Delete this course?")) {
                                  handleDeleteCourse(course.id);
                                }
                              }} style={{ ...iconBtn, background: "#ef4444" }}><Trash2 /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedSection === "Applications" && (
          <section style={{ marginTop: 6 }}>
            <h2 style={{ margin: "6px 0 12px 0" }}>Student Applications</h2>
            <div style={{ background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}>
              {applications.length === 0 ? <div style={{ padding: 12, color: "#475569" }}>No applications yet.</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eef2f7" }}>
                      <th style={thStyle}>Student</th>
                      <th style={thStyle}>Course</th>
                      <th style={thStyle}>Applied on</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(a => (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>{a.studentName || a.studentId}</td>
                        <td style={tdStyle}>{a.course}</td>
                        <td style={tdStyle}>{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString() : "—"}</td>
                        <td style={tdStyle}><span style={{ ...statusBadge(a.status) }}>{a.status}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e6eef6" }}>
                              <option value="pending">Pending</option>
                              <option value="admitted">Admitted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <button onClick={() => {
                              // view student detail
                              (async () => {
                                try {
                                  const sDoc = await getDoc(doc(db, "users", a.studentId));
                                  if (sDoc.exists()) {
                                    const s = sDoc.data();
                                    alert(`Name: ${s.fullName || s.displayName || "N/A"}\nEmail: ${s.email || "N/A"}\nPhone: ${s.phone || "N/A"}\nAddress: ${s.address || "N/A"}`);
                                  } else showToast("error", "Student record not found");
                                } catch (err) {
                                  console.error(err);
                                  showToast("error", "Failed to fetch student");
                                }
                              })();
                            }} style={{ ...secondaryButton }}> <Eye /> View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

      </main>

      {/* Faculty Modal */}
      <Modal isOpen={facultyModal.open} title={facultyModal.id ? "Edit Faculty" : "Add Faculty"} onClose={() => setFacultyModal({ open: false, name: "", id: null })}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={facultyModal.name} onChange={e => setFacultyModal(prev => ({ ...prev, name: e.target.value }))} placeholder="Faculty name" style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e6eef6" }} />
          <button onClick={handleAddEditFaculty} style={{ ...primaryButton }}>{facultyModal.id ? "Save" : "Add"}</button>
        </div>
      </Modal>

      {/* Course Modal */}
      <Modal isOpen={courseModal.open} title={courseModal.id ? "Edit Course" : "Add Course"} onClose={() => setCourseModal({ open: false, id: null, name: "", facultyId: "", description: "", requirements: [], currentRequirement: "" })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={courseModal.name} onChange={e => setCourseModal(prev => ({ ...prev, name: e.target.value }))} placeholder="Course name" style={{ padding: 10, borderRadius: 8, border: "1px solid #e6eef6" }} />
          <select value={courseModal.facultyId} onChange={e => setCourseModal(prev => ({ ...prev, facultyId: e.target.value }))} style={{ padding: 10, borderRadius: 8, border: "1px solid #e6eef6" }}>
            <option value="">Select faculty</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <textarea value={courseModal.description} onChange={e => setCourseModal(prev => ({ ...prev, description: e.target.value }))} placeholder="Course description" style={{ padding: 10, borderRadius: 8, border: "1px solid #e6eef6", minHeight: 80 }} />
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={courseModal.currentRequirement} onChange={e => setCourseModal(prev => ({ ...prev, currentRequirement: e.target.value }))} placeholder="Add requirement (e.g. 'Minimum grade: B')" style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e6eef6" }} />
              <button onClick={() => {
                const req = (courseModal.currentRequirement || "").trim();
                if (!req) return;
                setCourseModal(prev => ({ ...prev, requirements: [...(prev.requirements || []), req], currentRequirement: "" }));
              }} style={{ ...primaryButton, background: "#059669" }}><Plus /> Add</button>
            </div>
            <ul style={{ marginTop: 8 }}>
              {(courseModal.requirements || []).map((r, idx) => (
                <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 6, background: "#f8fafc", borderRadius: 6, marginBottom: 6 }}>
                  <div>{r}</div>
                  <button onClick={() => setCourseModal(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== idx) }))} style={{ ...iconBtn, background: "#ef4444" }}><Trash2 /></button>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {courseModal.id && <button onClick={() => {
              if (!courseModal.id) return;
              if (window.confirm("Delete this course?")) {
                handleDeleteCourse(courseModal.id);
                setCourseModal({ open: false, id: null, name: "", facultyId: "", description: "", requirements: [], currentRequirement: "" });
              }
            }} style={{ ...secondaryButton, background: "#ef4444", color: "#fff" }}>Delete</button>}
            <button onClick={handleAddEditCourse} style={{ ...primaryButton }}>{courseModal.id ? "Save changes" : "Create course"}</button>
          </div>
        </div>
      </Modal>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "", message: "" })} />
    </div>
  );
}

// ---------- styles ----------
const cardLarge = { background: "#fff", padding: 18, borderRadius: 12, boxShadow: "0 8px 28px rgba(2,6,23,0.06)" };
const bigInput = { padding: 12, borderRadius: 10, border: "1px solid #e6eef6", fontSize: 16, flex: 1 };
const primaryButton = { background: "#2563eb", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 };
const secondaryButton = { background: "#f1f5f9", color: "#0f172a", border: "none", padding: "8px 10px", borderRadius: 10, cursor: "pointer" };
const iconBtn = { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 8, borderRadius: 8, border: "none", cursor: "pointer", background: "#eef2f7" };
const thStyle = { padding: "12px 10px", color: "#0f172a", fontWeight: 700 };
const tdStyle = { padding: "12px 10px", color: "#0f172a" };
const statusBadge = (status) => {
  const color = status === "admitted" ? "#16a34a" : status === "rejected" ? "#ef4444" : "#f59e0b";
  return { padding: "6px 10px", borderRadius: 999, color: "#fff", background: color, fontWeight: 700, fontSize: 13 };
};
const navBtn = (active) => ({
  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none",
  background: active ? "#2563eb" : "transparent", color: active ? "#fff" : "#0b1220", cursor: "pointer", fontWeight: 700
});

export default InstitutionDashboard;

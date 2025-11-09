// src/pages/StudentDashboard.js
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
  orderBy,
  deleteDoc,
  updateDoc,
  addDoc
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

  const fetchStudentData = async (studentId) => {
    // Applications
    const applicationsSnap = await getDocs(
      query(collection(db, "applications"), where("studentId", "==", studentId), orderBy("createdAt", "desc"))
    );
    setApplications(applicationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Institutions, faculties, and courses
    const institutionsSnap = await getDocs(collection(db, "institutions"));
    const institutionsData = [];
    for (let instDoc of institutionsSnap.docs) {
      const instData = instDoc.data();
      const facultiesSnap = await getDocs(collection(db, "institutions", instDoc.id, "faculties"));
      const facultiesData = [];
      for (let facDoc of facultiesSnap.docs) {
        const coursesSnap = await getDocs(collection(db, "institutions", instDoc.id, "faculties", facDoc.id, "courses"));
        facultiesData.push({
          id: facDoc.id,
          ...facDoc.data(),
          courses: coursesSnap.docs.map(course => ({ id: course.id, ...course.data() }))
        });
      }
      institutionsData.push({ id: instDoc.id, ...instData, faculties: facultiesData });
    }
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

  const checkEligibility = (student, item) => {
    if (!student || !item) return false;
    if (item.requiredGPA && student.gpa < item.requiredGPA) return false;
    return true;
  };

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
      institutionName: institutions.find(inst => inst.id === instId)?.name,
      status: "Pending",
      createdAt: new Date()
    };

    const appRef = await addDoc(collection(db, "applications"), newApp);
    setApplications(prev => [...prev, { id: appRef.id, ...newApp }]);
    alert("Application submitted!");
  };

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleDeleteUpload = async (uploadId) => {
    await deleteDoc(doc(db, "uploads", uploadId));
    setUploads(prev => prev.filter(u => u.id !== uploadId));
    alert("Upload deleted.");
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 100 }}>Loading...</p>;

  const card = { background: "#fff", padding: 18, borderRadius: 12, boxShadow: "0 6px 18px rgba(2,6,23,0.06)", marginBottom: 16 };
  const cardLarge = { ...card, padding: 24 };
  const bigInput = { width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 };
  const primaryButton = { background: "#2563eb", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
  const navBtn = (active) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8,
    border: "none", background: active ? "#2563eb" : "transparent", color: active ? "#fff" : "#0b1220", cursor: "pointer", fontWeight: 700
  });

  const renderSection = () => {
    switch (selectedSection) {
      case "Profile":
        return (
          <section style={cardLarge}>
            <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, color: "#0b1220" }}>Student Profile</h2>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 12 }}>
              <div style={{ width: 220, minWidth: 220 }}>
                <div style={{ width: 220, height: 220, borderRadius: 12, overflow: "hidden", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}>
                  {student?.photoURL
                    ? <img src={student.photoURL} alt="student" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: 12 }}>No image yet<br />Upload profile</div>
                  }
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {["fullName","email","phone"].map(field => (
                  <div key={field} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <input
                      type={field === "email" ? "email" : "text"}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={student?.[field] || ""}
                      onChange={e => setStudent(prev => ({ ...prev, [field]: e.target.value }))}
                      style={bigInput}
                    />
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, "students", auth.currentUser.uid), { [field]: student[field] });
                        alert(`${field} updated`);
                      }}
                      style={{ ...primaryButton, minWidth: 120 }}
                    ><Edit size={16} /> Save</button>
                  </div>
                ))}
                <div style={{ marginTop: 6 }}>
                  <textarea
                    placeholder="Address / Bio"
                    value={student?.address || ""}
                    onChange={e => setStudent(prev => ({ ...prev, address: e.target.value }))}
                    style={{ ...bigInput, minHeight: 120 }}
                  />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={async () => {
                      await updateDoc(doc(db, "students", auth.currentUser.uid), { address: student.address });
                      alert("Address updated");
                    }} style={{ ...primaryButton }}><Edit size={16} /> Save</button>
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
                      <p><strong>Email:</strong> {inst.email} | <strong>Website:</strong> {inst.website}</p>
                    </div>
                  </div>
                  <button onClick={() => setExpandedInst(isExpanded ? null : inst.id)} style={{ ...primaryButton, marginTop: 12 }}>
                    {isExpanded ? "Hide Courses" : "View Courses & Requirements"}
                  </button>
                  {isExpanded && inst.faculties && (
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {applications.map(app => (
              <div key={app.id} style={{ ...card }}>
                <strong>{app.courseName}</strong> @ {app.institutionName} <br/>
                Status: {app.status} <br/>
                Applied on: {app.createdAt.toDate ? app.createdAt.toDate().toLocaleString() : new Date(app.createdAt.seconds*1000).toLocaleString()}
              </div>
            ))}
            {applications.length === 0 && <p>No applications submitted yet.</p>}
          </div>
        );

      case "Uploads":
        return (
          <div>
            <input type="file" onChange={e => handleUpload(e.target.files[0], "document")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {uploads.map(up => (
                <div key={up.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <a href={up.url} target="_blank" rel="noopener noreferrer">{up.type}</a>
                  <button onClick={() => handleDeleteUpload(up.id)} style={{ ...primaryButton, background: "#ef4444" }}>Delete</button>
                </div>
              ))}
              {uploads.length === 0 && <p>No uploads yet.</p>}
            </div>
          </div>
        );

      case "Jobs":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {jobs.map(job => (
              <div key={job.id} style={{ ...card }}>
                <strong>{job.title}</strong> @ {job.company} <br/>
                {job.description} <br/>
                <small>Requirements: {(job.requirements || []).join(", ")}</small>
              </div>
            ))}
            {jobs.length === 0 && <p>No available jobs at the moment.</p>}
          </div>
        );

      case "Notifications":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.map(notif => (
              <div key={notif.id} style={{ ...card }}>
                {notif.message} <br/>
                <small>{notif.createdAt.toDate ? notif.createdAt.toDate().toLocaleString() : new Date(notif.createdAt.seconds*1000).toLocaleString()}</small>
              </div>
            ))}
            {notifications.length === 0 && <p>No notifications.</p>}
          </div>
        );

      default:
        return <p>Section not implemented.</p>;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
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

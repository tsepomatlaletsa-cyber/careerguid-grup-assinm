// src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  Building2,
  FileText,
  Briefcase,
  GraduationCap,
  Bell,
  ClipboardList,
  Home,
  BarChart3,
  Clock,
  Users,
} from "lucide-react";


function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [expandedInstitution, setExpandedInstitution] = useState(null);

  // Data stores
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const institutionsRef = collection(db, "institutions");
  const facultiesRef = collection(db, "faculties");
  const coursesRef = collection(db, "courses");
  


  // Form states
  const [newInstitutionName, setNewInstitutionName] = useState("");
  const [newInstitutionAddress, setNewInstitutionAddress] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingCourse, setEditingCourse] = useState({ facultyId: null, courseId: null });
  const [editFacultyName, setEditFacultyName] = useState("");
  const [editCourseName, setEditCourseName] = useState("");
  const [expandedInst, setExpandedInst] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [viewStudent, setViewStudent] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);


  // Job edit state
  const [editingJobId, setEditingJobId] = useState(null);
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editJobDesc, setEditJobDesc] = useState("");
  const [editJobQuals, setEditJobQuals] = useState("");
  const [facultyInput, setFacultyInput] = useState({});
  const [courseInput, setCourseInput] = useState({});

  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  // State example
const [courseRequirements, setCourseRequirements] = useState({});
const [newRequirementInput, setNewRequirementInput] = useState({}); 


// Handler
const handleStatusChange = async (applicationId, newStatus) => {
  try {
    const appRef = doc(db, "applications", applicationId);
    await updateDoc(appRef, { status: newStatus });

    // Update local state
    setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: newStatus } : a));
  } catch (err) {
    console.error(err);
    showToast("error", "Failed to update status");
  }
};

const showToast = (type, message) => {
  alert(`${type.toUpperCase()}: ${message}`);
};


const handleAddRequirement = async (courseId, newRequirement) => {
  if (!newRequirement) return;
  const courseRef = doc(db, "courses", courseId);

  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  const updatedReqs = [...(course.admissionRequirements || []), newRequirement];

  await updateDoc(courseRef, { admissionRequirements: updatedReqs, updatedAt: serverTimestamp() });

  // Update local state
  setCourses(prev => prev.map(c => c.id === courseId ? {...c, admissionRequirements: updatedReqs} : c));

  // Clear input
  setNewRequirementInput(prev => ({ ...prev, [courseId]: "" }));
};


  // ---------- Auth + initial fetch ----------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      // verify admin role in users doc
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setErrorMessage("User profile not found.");
          setLoading(false);
          return;
        }
        const userData = userDoc.data();
        if (userData.role !== "admin") {
          // not admin -> redirect
          navigate("/");
          return;
        }
        setAdmin({ uid: user.uid, ...userData });
        await fetchAllData();
      } catch (err) {
        console.error("Auth/fetch error:", err);
        setErrorMessage("Failed to initialize admin dashboard.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ---------- Data fetching ----------
  const fetchAllData = async () => {
    try {
      // Institutions
      const instSnap = await getDocs(collection(db, "institutions"));
      const insts = instSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInstitutions(insts);

      // Companies (users with role 'company')
      const usersSnap = await getDocs(collection(db, "users"));
      const comps = usersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "company");
      setCompanies(comps);

      // Students
      const studentsSnap = await getDocs(collection(db, "students"));
      setStudents(studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Applications (course/institution applications)
      const appsSnap = await getDocs(collection(db, "applications"));
      setApplications(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Jobs
      const jobsSnap = await getDocs(collection(db, "jobs"));
      setJobs(jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // JobApplications
      const jaSnap = await getDocs(collection(db, "JobApplications"));
      setJobApplications(jaSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("fetchAllData error:", err);
      setErrorMessage("Failed to fetch admin data.");
    }
  };

useEffect(() => {
  const fetchData = async () => {
    try {
      // 1. Fetch Institutions
      const instSnap = await getDocs(collection(db, "institutions"));
      const instData = instSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInstitutions(instData);

      // 2. Fetch Faculties
      const facSnap = await getDocs(collection(db, "faculties"));
      const facData = facSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFaculties(facData);

      // 3. Fetch Courses
      const courseSnap = await getDocs(collection(db, "courses"));
      const courseData = courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(courseData);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchData();
}, []);


  // ---------- Institutions CRUD ----------
  const handleAddInstitution = async (e) => {
    e.preventDefault();
    if (!newInstitutionName || !newInstitutionAddress) {
      setErrorMessage("Fill all fields.");
      return;
    }
    try {
      const refDoc = await addDoc(collection(db, "institutions"), {
        fullName: newInstitutionName,
        address: newInstitutionAddress,
        description: "",
        photoURL: "",
        website: "",
        documents: {},
        faculties: {}, // nested object for faculties
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setInstitutions((prev) => [
        ...prev,
        { id: refDoc.id, fullName: newInstitutionName, address: newInstitutionAddress, faculties: {} },
      ]);
      setNewInstitutionName("");
      setNewInstitutionAddress("");
      setErrorMessage("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to add institution.");
    }
  };

  const handleDeleteInstitution = async (id) => {
    if (!window.confirm("Delete institution? This is irreversible.")) return;
    try {
      await deleteDoc(doc(db, "institutions", id));
      setInstitutions((prev) => prev.filter((i) => i.id !== id));
      if (selectedInstitution?.id === id) setSelectedInstitution(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete institution.");
    }
  };

  const handleSelectInstitution = (inst) => {
    setSelectedInstitution(inst);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Faculty & Course handlers (nested faculties object)
const handleAddFaculty = async (instId, name) => {
  if (!name) return alert("Faculty name required");
  try {
    await addDoc(facultiesRef, {
      name,
      institutionId: instId,
      createdAt: serverTimestamp(),
    });
    alert("Faculty added!");
    setFacultyInput({ ...facultyInput, [instId]: "" });
    fetchFaculties();
  } catch (err) {
    console.error(err);
    alert("Failed to add faculty");
  }
};


const handleEditFaculty = async (instId, facultyId, newName) => {
  if (!newName) return alert("Name cannot be empty");
  try {
    await updateDoc(doc(db, "faculties", facultyId), { name: newName });
    alert("Faculty updated!");
    fetchFaculties();
  } catch (err) {
    console.error(err);
    alert("Failed to update faculty");
  }
};

const handleDeleteFaculty = async (instId, facultyId) => {
  if (!window.confirm("Delete this faculty?")) return;
  try {
    await deleteDoc(doc(db, "faculties", facultyId));
    alert("Faculty deleted!");
    fetchFaculties();
    fetchCourses(); 
  } catch (err) {
    console.error(err);
    alert("Failed to delete faculty");
  }
};

const handleAddCourse = async (instId, facultyId, name) => {
  if (!name) return alert("Course name required");
  try {
    await addDoc(coursesRef, {
      name,
      facultyId,
      institutionId: instId,
      description: "",
      admissionRequirements: [],
      createdAt: serverTimestamp(),
    });
    alert("Course added!");
    setCourseInput({ ...courseInput, [facultyId]: "" });
    fetchCourses();
  } catch (err) {
    console.error(err);
    alert("Failed to add course");
  }
};

const handleEditCourse = async (instId, facultyId, courseId, newName) => {
  if (!newName) return alert("Name cannot be empty");
  try {
    await updateDoc(doc(db, "courses", courseId), { name: newName });
    alert("Course updated!");
    fetchCourses();
  } catch (err) {
    console.error(err);
    alert("Failed to update course");
  }
};

const handleDeleteCourse = async (instId, facultyId, courseId) => {
  if (!window.confirm("Delete this course?")) return;
  try {
    await deleteDoc(doc(db, "courses", courseId));
    alert("Course deleted!");
    fetchCourses();
  } catch (err) {
    console.error(err);
    alert("Failed to delete course");
  }
};



const fetchInstitutions = async () => {
  const snapshot = await getDocs(institutionsRef);
  setInstitutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

const fetchFaculties = async () => {
  const snapshot = await getDocs(facultiesRef);
  setFaculties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

const fetchCourses = async () => {
  const snapshot = await getDocs(coursesRef);
  setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

// --- INITIAL DATA LOAD ---
useEffect(() => {
  fetchInstitutions();
  fetchFaculties();
  fetchCourses();
}, []);

  
  // ---------- Company handlers ----------
  const handleApproveCompany = async (id) => {
    try {
      await updateDoc(doc(db, "users", id), { approved: true, updatedAt: serverTimestamp() });
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, approved: true } : c)));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to approve company.");
    }
  };

  const handleSuspendCompany = async (id) => {
    try {
      await updateDoc(doc(db, "users", id), { approved: false, updatedAt: serverTimestamp() });
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, approved: false } : c)));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to suspend company.");
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Delete company and all associated data?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete company.");
    }
  };

  // ---------- Logo upload helper ----------
  const handleInstitutionLogoUpload = async (e, instId) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const storageRef = ref(storage, `institutions/${instId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "institutions", instId), { photoURL: url, updatedAt: serverTimestamp() });

      // update local state
      setInstitutions((prev) => prev.map((i) => (i.id === instId ? { ...i, photoURL: url } : i)));
      if (selectedInstitution?.id === instId) setSelectedInstitution((prev) => ({ ...prev, photoURL: url }));
    } catch (err) {
      console.error("logo upload failed:", err);
      setErrorMessage("Failed to upload logo.");
    }
  };

  // ---------- Applications handlers (course apps) ----------
  const handleUpdateApplication = async (appId, newStatus) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status: newStatus, updatedAt: serverTimestamp() });
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to update application.");
    }
  };

  // ---------- Jobs CRUD ----------
  const startEditJob = (job) => {
    setEditingJobId(job.id);
    setEditJobTitle(job.title || "");
    setEditJobDesc(job.description || "");
    setEditJobQuals(Array.isArray(job.qualifications) ? job.qualifications.join(", ") : (job.qualifications || ""));
  };

  const cancelEditJob = () => {
    setEditingJobId(null);
    setEditJobTitle("");
    setEditJobDesc("");
    setEditJobQuals("");
  };

  const saveEditJob = async (jobId) => {
    if (!editJobTitle || !editJobDesc) return alert("Fill title & description");
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        title: editJobTitle,
        description: editJobDesc,
        qualifications: editJobQuals.split(",").map((q) => q.trim()),
        updatedAt: serverTimestamp(),
      });
      await fetchAllData();
      cancelEditJob();
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to save job.");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete job posting?")) return;
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      await fetchAllData();
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete job.");
    }
  };

  // ---------- Job applications (approve/reject) ----------
  const handleUpdateJobAppStatus = async (appId, status) => {
    try {
      await updateDoc(doc(db, "JobApplications", appId), { status, updatedAt: serverTimestamp() });
      setJobApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to update job application.");
    }
  };

  // ---------- Reports (simple counts) ----------
  const reports = {
    totalInstitutions: institutions.length,
    totalCompanies: companies.length,
    totalStudents: students.length,
    totalApplications: applications.length,
    totalJobs: jobs.length,
    totalJobApplications: jobApplications.length,
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 120 }}>Loading...</p>;

  // ---------- Styles (matching StudentDashboard) ----------
  const card = { background: "#fff", padding: 18, borderRadius: 12, boxShadow: "0 6px 18px rgba(2,6,23,0.06)", marginBottom: 16 };
  const cardLarge = { ...card, padding: 24 };
  const bigInput = { width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 };
  const primaryButton = { background: "#2563eb", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
  const navBtn = (active) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8,
    border: "none", background: active ? "#2563eb" : "transparent", color: active ? "#fff" : "#0b1220", cursor: "pointer", fontWeight: 700
  });

  // ---------- Section Renderer ----------
  const renderSection = () => {
switch (selectedSection) {
     

case "Dashboard":
  return (
    <section style={cardLarge}>
      {/* Header / Summary Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            color: "#0b1220",
            fontWeight: 600,
          }}
        >
          Admin Dashboard
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
          <BarChart3 size={18} />
          <span>System Overview</span>
          <Clock size={18} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
        }}
      >
        {/* Helper function to shorten repetitive style */}
        {[
          {
            label: "Institutions",
            count: reports.totalInstitutions,
            color: "#2563eb",
            bg: "#f0f9ff",
            icon: <Building2 size={36} color="#2563eb" />,
            target: "Institutions",
          },
          {
            label: "Companies",
            count: reports.totalCompanies,
            color: "#10b981",
            bg: "#ecfdf5",
            icon: <Briefcase size={36} color="#10b981" />,
            target: "Companies",
          },
          {
            label: "Students",
            count: reports.totalStudents,
            color: "#f59e0b",
            bg: "#fffbeb",
            icon: <GraduationCap size={36} color="#f59e0b" />,
            target: "Students",
          },
          {
            label: "Jobs",
            count: reports.totalJobs,
            color: "#3b82f6",
            bg: "#eff6ff",
            icon: <ClipboardList size={36} color="#3b82f6" />,
            target: "Jobs",
          },
          {
            label: "Course Applications",
            count: reports.totalApplications,
            color: "#8b5cf6",
            bg: "#f5f3ff",
            icon: <FileText size={36} color="#8b5cf6" />,
            target: "Applications",
          },
          {
            label: "Job Applications",
            count: reports.totalJobApplications,
            color: "#ef4444",
            bg: "#fef2f2",
            icon: <Users size={36} color="#ef4444" />,
            target: "Job Applications",
          },
        ].map((cardData, index) => (
          <div
            key={index}
            onClick={() => setActiveSection(cardData.target)} 
            style={{
              ...card,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 18,
              borderLeft: `5px solid ${cardData.color}`,
              background: cardData.bg,
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.03)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            {cardData.icon}
            <div>
              <h3 style={{ margin: 0, fontSize: 22 }}>{cardData.count}</h3>
              <p style={{ margin: 0, color: "#334155" }}>{cardData.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
  
case "Institutions":
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2>Institutions</h2>

      {/* Add Institution Form */}
      <section style={cardLarge}>
        <h3>Add Institution</h3>
        <form
          onSubmit={handleAddInstitution}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <input
            placeholder="Institution Name"
            value={newInstitutionName}
            onChange={(e) => setNewInstitutionName(e.target.value)}
            style={bigInput}
          />
          <input
            placeholder="Address"
            value={newInstitutionAddress}
            onChange={(e) => setNewInstitutionAddress(e.target.value)}
            style={bigInput}
          />
          <button type="submit" style={primaryButton}>Add</button>
        </form>
      </section>

      {institutions.map((inst) => {
        const isExpanded = expandedInst === inst.id;
        const relatedFaculties = faculties.filter(f => f.institutionId === inst.id);

        return (
          <div key={inst.id} style={card}>
            {/* Institution Info */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <img
                src={inst.photoURL || "https://via.placeholder.com/120"}
                alt={inst.fullName}
                style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover" }}
              />
              <div>
                <h3>{inst.fullName}</h3>
                <p>{inst.description || "No description"}</p>
                <p style={{ fontSize: 13, color: "#475569" }}>
                  <strong>Email:</strong> {inst.documents?.email || "N/A"} |
                  <strong> Website:</strong> {inst.website || "N/A"} <br />
                  <strong>Address:</strong> {inst.documents?.address || "N/A"}
                </p>
              </div>
            </div>

            {/* Expand / Delete Buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setExpandedInst(isExpanded ? null : inst.id)}
                style={primaryButton}
              >
                {isExpanded ? "Hide Faculties" : "View Faculties & Courses"}
              </button>
              <button
                onClick={() => handleDeleteInstitution(inst.id)}
                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8 }}
              >
                Delete
              </button>
            </div>

            {/* Faculties Section */}
            {isExpanded && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Add Faculty */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input
                    placeholder="New Faculty Name"
                    value={facultyInput[inst.id] || ""}
                    onChange={(e) => setFacultyInput({ ...facultyInput, [inst.id]: e.target.value })}
                    style={bigInput}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddFaculty(inst.id, facultyInput[inst.id]);
                      setFacultyInput({ ...facultyInput, [inst.id]: "" });
                    }}
                    style={primaryButton}
                  >
                    Add Faculty
                  </button>
                </div>

                {relatedFaculties.length === 0 ? (
                  <p>No faculties yet.</p>
                ) : (
                  relatedFaculties.map((faculty) => {
                    const relatedCourses = courses.filter(c => c.facultyId === faculty.id);
                    const isEditingFaculty = editingFaculty === faculty.id;

                    return (
                      <div key={faculty.id} style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                        {/* Faculty Info */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {isEditingFaculty ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input
                                value={editFacultyName}
                                onChange={(e) => setEditFacultyName(e.target.value)}
                                style={bigInput}
                              />
                              <button
                                onClick={() => {
                                  handleEditFaculty(inst.id, faculty.id, editFacultyName);
                                  setEditingFaculty(null);
                                  setEditFacultyName("");
                                }}
                                style={primaryButton}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingFaculty(null);
                                  setEditFacultyName("");
                                }}
                                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8 }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <strong>{faculty.name}</strong>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  onClick={() => {
                                    setEditingFaculty(faculty.id);
                                    setEditFacultyName(faculty.name);
                                  }}
                                  style={primaryButton}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFaculty(inst.id, faculty.id)}
                                  style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8 }}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Add Course */}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <input
                            placeholder="New Course Name"
                            value={courseInput[faculty.id] || ""}
                            onChange={(e) => setCourseInput({ ...courseInput, [faculty.id]: e.target.value })}
                            style={bigInput}
                          />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddCourse(inst.id, faculty.id, courseInput[faculty.id]);
                              setCourseInput({ ...courseInput, [faculty.id]: "" });
                            }}
                            style={primaryButton}
                          >
                            Add Course
                          </button>
                        </div>

                        {/* Courses List */}
                        {relatedCourses.map((course) => {
                          const isEditingCourse = editingCourse.courseId === course.id && editingCourse.facultyId === faculty.id;
                          const requirements = course.admissionRequirements || [];

                          return (
                            <div key={course.id} style={{ background: "#fff", padding: 8, borderRadius: 8, marginTop: 8 }}>
                              {isEditingCourse ? (
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <input
                                    value={editCourseName}
                                    onChange={(e) => setEditCourseName(e.target.value)}
                                    style={bigInput}
                                  />
                                  <button
                                    onClick={() => {
                                      handleEditCourse(inst.id, faculty.id, course.id, editCourseName);
                                      setEditingCourse({ facultyId: null, courseId: null });
                                      setEditCourseName("");
                                    }}
                                    style={primaryButton}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingCourse({ facultyId: null, courseId: null })}
                                    style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8 }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <strong>{course.name}</strong>
                                  <div style={{ fontSize: 13, color: "#475569" }}>{course.description}</div>

                                  {/* Admission Requirements */}
                                  <div style={{ marginTop: 6 }}>
                                    <strong>Requirements:</strong>
                                    <ul style={{ marginLeft: 16 }}>
                                      {requirements.map((req, i) => <li key={i}>{req}</li>)}
                                    </ul>

                                    {/* Add Requirement */}
                                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                      <input
                                        placeholder="New Requirement"
                                        value={newRequirementInput[course.id] || ""}
                                        onChange={(e) => setNewRequirementInput({ ...newRequirementInput, [course.id]: e.target.value })}
                                        style={bigInput}
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleAddRequirement(course.id, newRequirementInput[course.id]);
                                        }}
                                        style={primaryButton}
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>

                                  {/* Edit / Delete Course */}
                                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                    <button
                                      onClick={() => setEditingCourse({ facultyId: faculty.id, courseId: course.id })}
                                      style={primaryButton}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCourse(inst.id, faculty.id, course.id)}
                                      style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8 }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

      case "Companies":
        return (
          <section style={cardLarge}>
            <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20 }}>Companies</h2>
            {companies.length === 0 ? <p>No companies registered.</p> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {companies.map((c) => (
                  <div key={c.id} style={{ ...card }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <img src={c.photoURL || "https://via.placeholder.com/80"} alt={c.fullName || c.fullName} style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />
                      <div style={{ flex: 1 }}>
                        <strong>{c.fullName || c.fullName}</strong>
                        <div style={{ color: "#475569", fontSize: 13 }}>{c.documents?.email || c.email || "N/A"}</div>
                        <div style={{ marginTop: 6 }}>Status: {c.approved ? "Active" : "Suspended"}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {!c.approved ? <button onClick={() => handleApproveCompany(c.id)} style={primaryButton}>Approve</button> : <button onClick={() => handleSuspendCompany(c.id)} style={{ ...primaryButton, background: "#f59e0b" }}>Suspend</button>}
                        <button onClick={() => handleDeleteCompany(c.id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8 }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );

  case "Admissions":
  return (
    <section style={cardLarge}>
      <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20 }}>Student Applications</h2>

      {/* Modal for Viewing Student Details */}
      {viewStudent && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 14,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              width: 420,
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginBottom: 12, color: "#1e293b" }}>Student Details</h3>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
              <div
                onClick={() => setImagePreview(viewStudent.photoURL)}
                style={{
                  width: 120, height: 120,
                  borderRadius: "50%", overflow: "hidden",
                  background: "#f8fafc", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: viewStudent.photoURL ? "pointer" : "default",
                }}
              >
                {viewStudent.photoURL ? (
                  <img src={viewStudent.photoURL} alt="Student" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 12 }}>No Photo</div>
                )}
              </div>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>(Click to enlarge)</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 15, color: "#334155" }}>
              <div><strong>Name:</strong> {viewStudent.fullName || viewStudent.displayName || "N/A"}</div>
              <div><strong>Email:</strong> {viewStudent.email || "N/A"}</div>
              <div><strong>Phone:</strong> {viewStudent.phone || "N/A"}</div>
              <div><strong>Address:</strong> {viewStudent.address || "N/A"}</div>
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button onClick={() => setViewStudent(null)} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {imagePreview && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 10000,
          }}
          onClick={() => setImagePreview(null)}
        >
          <img src={imagePreview} alt="Full Preview" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }} />
        </div>
      )}

      {/* Applications Grouped by Institution */}
      {institutions.length === 0 ? (
        <p>No institutions found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {institutions.map((inst) => {
            const instApps = applications.filter(a => a.institutionId === inst.id);
            const isExpanded = expandedInstitution === inst.id;

            return (
              <div key={inst.id} style={{ ...card, padding: 12 }}>
                {/* Institution Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setExpandedInstitution(isExpanded ? null : inst.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={inst.photoURL || "https://via.placeholder.com/80"} alt={inst.fullName} style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover" }} />
                    <div>
                      <h3 style={{ margin: 0 }}>{inst.fullName}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{inst.description || "No description"}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 20 }}>{isExpanded ? "▲" : "▼"}</span>
                </div>

                {/* Applications Table */}
                {isExpanded && (
                  <div style={{ marginTop: 12 }}>
                    {instApps.length === 0 ? (
                      <p style={{ color: "#64748b" }}>No applications for this institution.</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                        <thead>
                          <tr style={{ textAlign: "left", borderBottom: "1px solid #eef2f7" }}>
                            <th style={{ padding: 8 }}>Student</th>
                            <th style={{ padding: 8 }}>Course</th>
                            <th style={{ padding: 8 }}>Applied On</th>
                            <th style={{ padding: 8 }}>Status</th>
                            <th style={{ padding: 8 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {instApps.map(a => (
                            <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: 8 }}>{a.fullName || "N/A"}</td>
                              <td style={{ padding: 8 }}>{a.courseName || "—"}</td>
                              <td style={{ padding: 8 }}>{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString() : "—"}</td>
                              <td style={{ padding: 8 }}>
                                <span style={{
                                  padding: "4px 8px",
                                  borderRadius: 16,
                                  fontWeight: 600,
                                  background: a.status === "admitted" ? "#dcfce7" : a.status === "rejected" ? "#fee2e2" : "#fef9c3",
                                  color: a.status === "admitted" ? "#166534" : a.status === "rejected" ? "#991b1b" : "#92400e"
                                }}>
                                  {a.status}
                                </span>
                              </td>
                              <td style={{ padding: 8 }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <select
                                    value={a.status}
                                    onChange={(e) => handleStatusChange(a.id, e.target.value)}
                                    style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid #e6eef6" }}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="admitted">Admitted</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const sDoc = await getDoc(doc(db, "students", a.studentId));
                                        if (sDoc.exists()) setViewStudent(sDoc.data());
                                        else showToast("error", "Student record not found");
                                      } catch (err) {
                                        console.error(err);
                                        showToast("error", "Failed to fetch student");
                                      }
                                    }}
                                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}
                                  >
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

     
  case "Reports":
  return (
    <section style={cardLarge}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#0b1220", fontWeight: 600 }}>Reports</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
          <BarChart3 size={18} />
          <span>Summary</span>
          <Clock size={18} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Report Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {[
          {
            label: "Students",
            count: reports.totalStudents,
            color: "#f59e0b",
            bg: "#fffbeb",
            icon: <GraduationCap size={36} color="#f59e0b" />,
          },
          {
            label: "Companies",
            count: reports.totalCompanies,
            color: "#10b981",
            bg: "#ecfdf5",
            icon: <Briefcase size={36} color="#10b981" />,
          },
          {
            label: "Course Apps",
            count: reports.totalApplications,
            color: "#8b5cf6",
            bg: "#f5f3ff",
            icon: <FileText size={36} color="#8b5cf6" />,
          },
          {
            label: "Job Apps",
            count: reports.totalJobApplications,
            color: "#ef4444",
            bg: "#fef2f2",
            icon: <Users size={36} color="#ef4444" />,
          },
        ].map((card, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 18,
              borderLeft: `5px solid ${card.color}`,
              background: card.bg,
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {card.icon}
            <div>
              <h3 style={{ margin: 0, fontSize: 22 }}>{card.count}</h3>
              <p style={{ margin: 0, color: "#334155" }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>
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
        <div style={{ padding: 20, fontSize: 20, fontWeight: 700, color: "#2563eb" }}>Admin Module</div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          {[
            { key: "Dashboard", icon: <Home size={16} />, label: "Dashboard" },
            { key: "Institutions", icon: <Building2 size={16} />, label: "Institutions" },
            { key: "Companies", icon: <Users size={16} />, label: "Companies" },
            { key: "Admissions", icon: <FileText size={16} />, label: "Admissions" },
            { key: "Reports", icon: <Bell size={16} />, label: "Reports" },
          ].map((item) => (
            <button key={item.key} style={navBtn(selectedSection === item.key)} onClick={() => setSelectedSection(item.key)}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 20 }}>
          <button onClick={handleLogout} style={{ ...primaryButton, width: "100%", background: "#ef4444", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28 }}>
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ ...primaryButton, padding: "6px 10px", fontSize: 14 }}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />} Menu
          </button>
          <h1 style={{ fontSize: 22, margin: 0 }}>Welcome, <span style={{ color: "#2563eb" }}>{admin?.fullName}</span></h1>
        </div>

        {errorMessage && <p style={{ color: "#ef4444" }}>{errorMessage}</p>}

        {renderSection()}
      </main>
    </div>
  );
}

export default AdminDashboard;

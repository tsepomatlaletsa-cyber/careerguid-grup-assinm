import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpen, FileText, LogOut, User, Briefcase, Home } from "lucide-react";

function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [newInstitutionName, setNewInstitutionName] = useState("");
  const [newInstitutionAddress, setNewInstitutionAddress] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingCourse, setEditingCourse] = useState({ facultyId: null, courseId: null });
  const [editFacultyName, setEditFacultyName] = useState("");
  const [editCourseName, setEditCourseName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setErrorMessage("Admin profile not found.");
          setLoading(false);
          return;
        }
        setAdmin(userDoc.data());

        const instSnap = await getDocs(collection(db, "institutions"));
        setInstitutions(instSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const compSnap = await getDocs(collection(db, "users"));
        setCompanies(
          compSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((u) => u.role === "company")
        );
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // ---------------- Institution Handlers ----------------
  const handleAddInstitution = async (e) => {
    e.preventDefault();
    if (!newInstitutionName || !newInstitutionAddress) {
      setErrorMessage("Please fill all fields.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "institutions"), {
        name: newInstitutionName,
        address: newInstitutionAddress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        faculties: {},
      });
      setInstitutions((prev) => [
        ...prev,
        { id: docRef.id, name: newInstitutionName, address: newInstitutionAddress, faculties: {} },
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
    try {
      await deleteDoc(doc(db, "institutions", id));
      setInstitutions((prev) => prev.filter((inst) => inst.id !== id));
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

  // ---------------- Faculty & Course Handlers ----------------
  const handleAddFaculty = async () => {
    if (!newFacultyName || !selectedInstitution) return;
    const instRef = doc(db, "institutions", selectedInstitution.id);
    const newFacultyId = Date.now().toString();
    const updatedFaculties = {
      ...selectedInstitution.faculties,
      [newFacultyId]: { name: newFacultyName, courses: [] },
    };
    try {
      await updateDoc(instRef, { faculties: updatedFaculties, updatedAt: serverTimestamp() });
      setSelectedInstitution((prev) => ({ ...prev, faculties: updatedFaculties }));
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === selectedInstitution.id ? { ...inst, faculties: updatedFaculties } : inst
        )
      );
      setNewFacultyName("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to add faculty.");
    }
  };

  const handleDeleteFaculty = async (fid) => {
    if (!selectedInstitution) return;
    const instRef = doc(db, "institutions", selectedInstitution.id);
    const updatedFaculties = { ...selectedInstitution.faculties };
    delete updatedFaculties[fid];
    try {
      await updateDoc(instRef, { faculties: updatedFaculties, updatedAt: serverTimestamp() });
      setSelectedInstitution((prev) => ({ ...prev, faculties: updatedFaculties }));
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === selectedInstitution.id ? { ...inst, faculties: updatedFaculties } : inst
        )
      );
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete faculty.");
    }
  };

  const handleAddCourse = async (fid) => {
    if (!newCourseName || !selectedInstitution) return;
    const instRef = doc(db, "institutions", selectedInstitution.id);
    const updatedFaculties = { ...selectedInstitution.faculties };
    const newCourseId = Date.now().toString();
    updatedFaculties[fid].courses.push({ id: newCourseId, name: newCourseName });
    try {
      await updateDoc(instRef, { faculties: updatedFaculties, updatedAt: serverTimestamp() });
      setSelectedInstitution((prev) => ({ ...prev, faculties: updatedFaculties }));
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === selectedInstitution.id ? { ...inst, faculties: updatedFaculties } : inst
        )
      );
      setNewCourseName("");
      setEditingFaculty(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to add course.");
    }
  };

  const handleDeleteCourse = async (fid, cid) => {
    if (!selectedInstitution) return;
    const instRef = doc(db, "institutions", selectedInstitution.id);
    const updatedFaculties = { ...selectedInstitution.faculties };
    updatedFaculties[fid].courses = updatedFaculties[fid].courses.filter((c) => c.id !== cid);
    try {
      await updateDoc(instRef, { faculties: updatedFaculties, updatedAt: serverTimestamp() });
      setSelectedInstitution((prev) => ({ ...prev, faculties: updatedFaculties }));
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === selectedInstitution.id ? { ...inst, faculties: updatedFaculties } : inst
        )
      );
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete course.");
    }
  };

  const handleEditFacultyName = async (fid) => {
    if (!editFacultyName || !selectedInstitution) return;
    const instRef = doc(db, "institutions", selectedInstitution.id);
    const updatedFaculties = { ...selectedInstitution.faculties };
    updatedFaculties[fid].name = editFacultyName;
    try {
      await updateDoc(instRef, { faculties: updatedFaculties, updatedAt: serverTimestamp() });
      setSelectedInstitution((prev) => ({ ...prev, faculties: updatedFaculties }));
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === selectedInstitution.id ? { ...inst, faculties: updatedFaculties } : inst
        )
      );
      setEditingFaculty(null);
      setEditFacultyName("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to update faculty name.");
    }
  };

  const handleEditCourseName = async (fid, cid) => {
    if (!editCourseName || !selectedInstitution) return;
    const instRef = doc(db, "institutions", selectedInstitution.id);
    const updatedFaculties = { ...selectedInstitution.faculties };
    const courseIndex = updatedFaculties[fid].courses.findIndex((c) => c.id === cid);
    if (courseIndex > -1) updatedFaculties[fid].courses[courseIndex].name = editCourseName;
    try {
      await updateDoc(instRef, { faculties: updatedFaculties, updatedAt: serverTimestamp() });
      setSelectedInstitution((prev) => ({ ...prev, faculties: updatedFaculties }));
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === selectedInstitution.id ? { ...inst, faculties: updatedFaculties } : inst
        )
      );
      setEditingCourse({ facultyId: null, courseId: null });
      setEditCourseName("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to update course name.");
    }
  };

  // ---------------- Company Handlers ----------------
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
    try {
      await deleteDoc(doc(db, "users", id));
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete company.");
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Sidebar */}
      <aside style={{ width: "16rem", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#1d4ed8", borderBottom: "1px solid #e5e7eb" }}>Admin Module</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
          {[
            { icon: <Home size={16} />, label: "Dashboard" },
            { icon: <BookOpen size={16} />, label: "Institutions" },
            { icon: <FileText size={16} />, label: "Faculties & Courses" },
            { icon: <Briefcase size={16} />, label: "Companies" },
            { icon: <Bell size={16} />, label: "System Reports" },
          ].map((item, i) => (
            <button key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "none", cursor: "pointer", color: "#374151", transition: "background 0.3s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>{item.icon} {item.label}</button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "1rem" }}>
          <button onClick={handleLogout} style={{ width: "100%", background: "#ef4444", color: "white", padding: "0.5rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: 500, transition: "background 0.3s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")} onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
            <LogOut size={16} style={{ display: "inline-block", marginRight: "6px" }} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, color: "#111827", marginBottom: "1.5rem" }}>Welcome, {admin?.fullName}</h1>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

        {/* Institutions */}
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Add New Institution</h2>
          <form onSubmit={handleAddInstitution} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            <input type="text" placeholder="Institution Name" value={newInstitutionName} onChange={(e) => setNewInstitutionName(e.target.value)} style={{ padding: "0.5rem", fontSize: "1rem" }} />
            <input type="text" placeholder="Institution Address" value={newInstitutionAddress} onChange={(e) => setNewInstitutionAddress(e.target.value)} style={{ padding: "0.5rem", fontSize: "1rem" }} />
            <button type="submit" style={{ padding: "0.5rem", fontSize: "1rem", cursor: "pointer", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.5rem" }}>Add Institution</button>
          </form>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Existing Institutions</h2>
          {institutions.length === 0 ? <p>No institutions yet.</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {institutions.map((inst) => (
                <div key={inst.id} style={{ background: "#fff", padding: "1rem", borderRadius: "1rem", boxShadow: "0 3px 10px rgba(0,0,0,0.08)", cursor: "pointer" }} onClick={() => handleSelectInstitution(inst)}>
                  <p><strong>{inst.name}</strong> ({inst.address})</p>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteInstitution(inst.id); }} style={{ padding: "0.3rem 0.5rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.4rem", cursor: "pointer" }}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Faculties & Courses */}
        {selectedInstitution && (
          <section style={{ marginBottom: "2rem", padding: "1rem", background: "#fff", borderRadius: "1rem", boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Faculties & Courses for {selectedInstitution.name}</h2>
            <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
              <input type="text" placeholder="New Faculty Name" value={newFacultyName} onChange={(e) => setNewFacultyName(e.target.value)} style={{ flex: 1, padding: "0.5rem" }} />
              <button onClick={handleAddFaculty} style={{ padding: "0.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>Add Faculty</button>
            </div>

            {Object.entries(selectedInstitution.faculties).map(([fid, faculty]) => (
              <div key={fid} style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {editingFaculty === fid ? (
                    <>
                      <input value={editFacultyName} onChange={(e) => setEditFacultyName(e.target.value)} style={{ flex: 1, padding: "0.3rem" }} />
                      <button onClick={() => handleEditFacultyName(fid)} style={{ marginLeft: "0.5rem", background: "#2563eb", color: "#fff", border: "none", padding: "0.3rem 0.5rem", borderRadius: "0.3rem" }}>Save</button>
                    </>
                  ) : (
                    <>
                      <strong>{faculty.name}</strong>
                      <div>
                        <button onClick={() => { setEditingFaculty(fid); setEditFacultyName(faculty.name); }} style={{ marginRight: "0.5rem" }}>Edit</button>
                        <button onClick={() => handleDeleteFaculty(fid)} style={{ background: "#ef4444", color: "#fff", padding: "0.2rem 0.4rem", border: "none", borderRadius: "0.3rem" }}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  <input type="text" placeholder="New Course Name" value={editingFaculty === fid ? newCourseName : ""} onChange={(e) => setNewCourseName(e.target.value)} style={{ flex: 1, padding: "0.3rem" }} />
                  <button onClick={() => handleAddCourse(fid)} style={{ padding: "0.3rem 0.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.3rem", cursor: "pointer" }}>Add Course</button>
                </div>
                <ul style={{ marginTop: "0.5rem", listStyle: "disc", paddingLeft: "1.5rem" }}>
                  {faculty.courses.map((course) => (
                    <li key={course.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {editingCourse.courseId === course.id && editingCourse.facultyId === fid ? (
                        <>
                          <input value={editCourseName} onChange={(e) => setEditCourseName(e.target.value)} style={{ flex: 1, padding: "0.2rem" }} />
                          <button onClick={() => handleEditCourseName(fid, course.id)} style={{ marginLeft: "0.3rem", background: "#2563eb", color: "#fff", border: "none", padding: "0.2rem 0.4rem", borderRadius: "0.2rem" }}>Save</button>
                        </>
                      ) : (
                        <>
                          {course.name}
                          <div>
                            <button onClick={() => { setEditingCourse({ facultyId: fid, courseId: course.id }); setEditCourseName(course.name); }} style={{ marginRight: "0.3rem" }}>Edit</button>
                            <button onClick={() => handleDeleteCourse(fid, course.id)} style={{ background: "#ef4444", color: "#fff", padding: "0.2rem 0.4rem", border: "none", borderRadius: "0.2rem" }}>Delete</button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Companies Section */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Companies</h2>
          {companies.length === 0 ? (
            <p>No companies registered yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {companies.map((c) => (
                <div key={c.id} style={{ background: "#fff", padding: "1rem", borderRadius: "1rem", boxShadow: "0 3px 10px rgba(0,0,0,0.08)" }}>
                  <p><strong>{c.fullName}</strong> ({c.email})</p>
                  <p>Status: {c.approved ? "Active" : "Suspended"}</p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {!c.approved && <button onClick={() => handleApproveCompany(c.id)} style={{ padding: "0.4rem 0.75rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.4rem", cursor: "pointer" }}>Approve</button>}
                    {c.approved && <button onClick={() => handleSuspendCompany(c.id)} style={{ padding: "0.4rem 0.75rem", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "0.4rem", cursor: "pointer" }}>Suspend</button>}
                    <button onClick={() => handleDeleteCompany(c.id)} style={{ padding: "0.4rem 0.75rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.4rem", cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;

import React, { useState, useEffect } from "react";
import { auth, db } from "../pages/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Simple inline styles
const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  marginBottom: 20,
};
const primaryButton = {
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};
const bannerStyle = {
  width: "100%",
  height: 250,
  background: "url('https://www.hurix.com/wp-content/uploads/2020/02/Image_1-31.jpg') center/cover no-repeat",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: "2rem",
  fontWeight: "700",
  marginBottom: 30,
  borderRadius: 12,
  textShadow: "1px 1px 6px rgba(0,0,0,0.7)",
};

export default function InstitutionsSection({ student, applications, checkEligibility, handleApplyCourse }) {
  const [institutions, setInstitutions] = useState([]);
  const [expandedInst, setExpandedInst] = useState(null);
  const navigate = useNavigate();

  // Fetch institutions → faculties → courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const instSnap = await getDocs(collection(db, "institutions"));
        const instData = [];

        for (const instDoc of instSnap.docs) {
          const inst = { id: instDoc.id, ...instDoc.data() };

          // Faculties
          const facQuery = query(
            collection(db, "faculties"),
            where("institutionId", "==", inst.id)
          );
          const facSnap = await getDocs(facQuery);

          const faculties = [];
          for (const facDoc of facSnap.docs) {
            const fac = { id: facDoc.id, ...facDoc.data() };

            // Courses
            const courseQuery = query(
              collection(db, "courses"),
              where("facultyId", "==", fac.id)
            );
            const courseSnap = await getDocs(courseQuery);

            fac.courses = courseSnap.docs.map(c => ({ id: c.id, ...c.data() }));
            faculties.push(fac);
          }

          inst.faculties = faculties;
          instData.push(inst);
        }

        setInstitutions(instData);
      } catch (err) {
        console.error("Error fetching institutions:", err);
      }
    };

    fetchData();
  }, []);

  const handleApply = (instId, facId, course) => {
    if (!auth.currentUser) {
      alert("⚠️ Please login before applying!");
      navigate("/login");
      return;
    }
    handleApplyCourse(instId, facId, course);
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Banner */}
      <div style={bannerStyle}>Explore Institutions & Courses</div>

      {/* Institutions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {institutions.map(inst => {
          const isExpanded = expandedInst === inst.id;
          return (
            <div key={inst.id} style={card}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <img
                  src={inst.photoURL}
                  alt={inst.fullName}
                  style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover" }}
                />
                <div>
                  <h3>{inst.fullName}</h3>
                  <p>{inst.description}</p>
                  <p>
                    <strong>Email:</strong> {inst.documents?.email || "N/A"} | <strong>Website:</strong> {inst.website || "N/A"} <br />
                    <strong>Address:</strong> {inst.documents?.address || "N/A"}
                  </p>
                </div>
              </div>

              {/* Expand faculties & courses */}
              <button
                onClick={() => setExpandedInst(isExpanded ? null : inst.id)}
                style={{ ...primaryButton, marginTop: 12 }}
              >
                {isExpanded ? "Hide Courses" : "View Courses & Requirements"}
              </button>

              {isExpanded && inst.faculties?.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {inst.faculties.map(fac => (
                    <div key={fac.id} style={{ background: "#f1f5f9", padding: 12, borderRadius: 8 }}>
                      <h4>{fac.name}</h4>
                      <ul>
                        {fac.courses?.map(course => {
                          const applied = applications?.find(app => app.courseId === course.id);
                          const eligible = checkEligibility?.(student, course);
                          return (
                            <li key={course.id} style={{ marginBottom: 8 }}>
                              <div style={{ fontWeight: 700 }}>{course.name}</div>
                              <div>{course.description || "No description"}</div>
                              <small>Requirements:</small>
                              <ul>
                                {(course.admissionRequirements || []).map((r,i) => <li key={i}>{r}</li>)}
                              </ul>
                              {applied ? <span style={{ color: "green" }}>Applied</span> : eligible ? (
                                <button
                                  style={{ ...primaryButton, marginTop: 4 }}
                                  onClick={() => handleApply(inst.id, fac.id, course)}
                                >
                                  Apply
                                </button>
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
    </div>
  );
}

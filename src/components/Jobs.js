// src/components/Jobs.js
import React, { useEffect, useState } from "react";
import { db, auth } from "../pages/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState([]); // track applied jobs

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setStudent(user);

      try {
        // Fetch all jobs
        const jobsSnap = await getDocs(collection(db, "jobs"));
        const jobsList = jobsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setJobs(jobsList);

        // Fetch student's existing applications
        const appsSnap = await getDocs(
          query(collection(db, "applications"), where("studentId", "==", user.uid))
        );
        setAppliedJobs(appsSnap.docs.map((doc) => doc.data().jobId));
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleApply = async (jobId) => {
    if (!student) return;

    try {
      // Prevent duplicate applications
      if (appliedJobs.includes(jobId)) return;

      await addDoc(collection(db, "applications"), {
        studentId: student.uid,
        jobId,
        status: "pending",
        appliedAt: serverTimestamp(),
      });

      setAppliedJobs((prev) => [...prev, jobId]);
      alert("✅ Application submitted!");
    } catch (err) {
      console.error("Failed to apply:", err);
      alert("Failed to apply. Try again.");
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 50 }}>Loading jobs...</p>;
  if (jobs.length === 0) return <p style={{ textAlign: "center", marginTop: 50 }}>No jobs available.</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ color: "#1d4ed8", marginBottom: 10 }}>{job.title}</h3>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 8 }}>{job.description}</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              <strong>Qualifications:</strong>{" "}
              {Array.isArray(job.qualifications) ? job.qualifications.join(", ") : job.qualifications}
            </p>
          </div>

          <button
            onClick={() => handleApply(job.id)}
            disabled={appliedJobs.includes(job.id)}
            style={{
              marginTop: 15,
              background: appliedJobs.includes(job.id) ? "#9ca3af" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px",
              cursor: appliedJobs.includes(job.id) ? "not-allowed" : "pointer",
            }}
          >
            {appliedJobs.includes(job.id) ? "Applied" : "Apply"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Jobs;

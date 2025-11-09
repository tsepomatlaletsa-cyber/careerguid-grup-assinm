// src/components/ApplyJob.js
import React, { useState } from "react";
import { db, auth } from "../pages/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

function ApplyJob({ job }) {
  const [message, setMessage] = useState("");

  const handleApply = async () => {
    try {
      await addDoc(collection(db, "applicants"), {
        studentId: auth.currentUser.uid,
        fullName: auth.currentUser.displayName,
        email: auth.currentUser.email,
        jobId: job.id, // important! links applicant to job
        academicPerformance: 80, // fetch from student profile
        certificates: [], // fetch student certificates
        experienceYears: 0, // fetch student experience
        relevantSkills: [], // fetch student skills
        createdAt: serverTimestamp(),
      });
      setMessage("✅ Applied successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to apply.");
    }
  };

  return (
    <div>
      <button onClick={handleApply} style={{ padding: 8, borderRadius: 6, background: "#2563eb", color: "#fff" }}>
        Apply
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ApplyJob;

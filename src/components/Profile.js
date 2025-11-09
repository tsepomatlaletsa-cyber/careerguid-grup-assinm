// src/components/Profile.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../pages/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!auth.currentUser) return;
      try {
        const studentDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (studentDoc.exists()) {
          setStudent(studentDoc.data());
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (!student) return <p>Profile not found.</p>;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Profile</h2>
      <p><strong>Name:</strong> {student.fullName}</p>
      <p><strong>Email:</strong> {student.email}</p>
      <p><strong>Type:</strong> {student.studentType || "Undergraduate"}</p>
    </div>
  );
}

// Inline styles
const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};
const sectionTitle = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 10,
  color: "#1e3a8a",
};

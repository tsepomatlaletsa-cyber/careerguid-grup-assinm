// src/components/Applications.js
import React, { useEffect, useState } from "react";
import { db } from "../pages/firebase"; // adjust path if needed
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

function Applications({ studentId }) {
  const [applications, setApplications] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch institutions
        const instSnap = await getDocs(collection(db, "users"));
        const insts = instSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(i => i.role === "institution");
        setInstitutions(insts);

        // Fetch student applications
        const appSnap = await getDocs(
          query(
            collection(db, "applications"),
            where("studentId", "==", studentId),
            orderBy("createdAt", "desc")
          )
        );
        setApplications(appSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Failed to load applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) return <p>Loading applications...</p>;
  if (!applications.length) return <p>No applications found.</p>;

  return (
    <div style={card}>
      <h2>My Applications</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={th}>Institution</th>
            <th style={th}>Status</th>
            <th style={th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(a => {
            const inst = institutions.find(i => i.id === a.institutionId);
            return (
              <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{inst ? institutions.name || inst.name : "Unknown"}</td>
                <td style={td}>{a.status}</td>
                <td style={td}>{a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Styles
const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  marginBottom: 30
};
const th = { padding: "8px 10px", fontWeight: 600, color: "#333", textAlign: "left" };
const td = { padding: "8px 10px", color: "#444" };

export default Applications;

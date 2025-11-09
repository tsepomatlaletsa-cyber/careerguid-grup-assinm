import React, { useEffect, useState } from "react";
import { db, auth } from "../pages/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";

function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const instQuery = query(collection(db, "institutions"));
        const snapshot = await getDocs(instQuery);
        const insts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInstitutions(insts);
      } catch (err) {
        console.error("Failed to load institutions:", err);
        showMessage("❌ Failed to load institutions.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  const showMessage = (msg, duration = 4000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  };

  const handleApply = async (institutionId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showMessage("❌ You must be logged in.");
        return;
      }

      const q = query(
        collection(db, "applications"),
        where("studentId", "==", user.uid),
        where("institutionId", "==", institutionId)
      );
      const snap = await getDocs(q);

      if (snap.size >= 2) {
        showMessage("❌ You have already applied twice to this institution.");
        return;
      }

      await addDoc(collection(db, "applications"), {
        studentId: user.uid,
        institutionId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      showMessage("✅ Application submitted successfully!");
    } catch (err) {
      console.error("Failed to apply:", err);
      showMessage("❌ Failed to submit application.");
    }
  };

  const openModal = (inst) => setSelectedInstitution(inst);
  const closeModal = () => setSelectedInstitution(null);

  if (loading) return <p>Loading institutions...</p>;
  if (!institutions.length) return <p>No institutions found.</p>;

  return (
    <div style={container}>
      <h2 style={title}>Available Institutions</h2>
      <div style={grid}>
        {institutions.map(inst => (
          <div key={inst.id} style={card}>
            {inst.profileImageURL && (
              <img src={inst.profileImageURL} alt={inst.name} style={image} />
            )}
            <div style={cardBody}>
              <h3 style={cardTitle}>{inst.name}</h3>
              <p style={cardDesc}>{inst.description || "No description available."}</p>
              <div style={buttonGroup}>
                <button style={primaryBtn} onClick={() => handleApply(inst.id)}>Apply</button>
                <button style={outlineBtn} onClick={() => openModal(inst)}>View</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedInstitution && (
        <div style={modalOverlay} onClick={closeModal}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 12 }}>{selectedInstitution.name}</h2>
            {selectedInstitution.profileImageURL && (
              <img src={selectedInstitution.profileImageURL} alt={selectedInstitution.name} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />
            )}
            <p style={{ marginBottom: 12 }}>{selectedInstitution.description || "No description available."}</p>
            <p><strong>Email:</strong> {selectedInstitution.email || "N/A"}</p>
            <p><strong>Website:</strong> {selectedInstitution.website ? <a href={selectedInstitution.website} target="_blank" rel="noreferrer">{selectedInstitution.website}</a> : "N/A"}</p>
            <button style={primaryBtn} onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: message.startsWith("✅") ? "#16a34a" : "#dc2626",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 1000,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const container = { padding: 20, background: "#f5f7fb", minHeight: "80vh" };
const title = { fontSize: 22, fontWeight: 600, marginBottom: 20, color: "#1e3a8a" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 };
const card = { background: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" };
const cardBody = { padding: 16 };
const cardTitle = { color: "#1d4ed8", fontWeight: 600, marginBottom: 8 };
const cardDesc = { color: "#555", fontSize: 14, marginBottom: 12 };
const image = { width: "100%", height: 160, objectFit: "cover" };
const buttonGroup = { display: "flex", gap: 10 };
const primaryBtn = { flex: 1, background: "#2563eb", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
const outlineBtn = { flex: 1, background: "transparent", border: "1px solid #2563eb", color: "#2563eb", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContent = { background: "#fff", padding: 20, borderRadius: 12, width: "90%", maxWidth: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" };

export default Institutions;

// src/components/Uploads.js
import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../pages/firebase"; // adjust path if needed
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function Uploads() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");

  const showMessage = (msg, duration = 4000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  };

  // Fetch uploaded files
  useEffect(() => {
    const fetchFiles = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "uploads"),
          where("ownerId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setUploadedFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load uploads:", err);
      }
    };

    fetchFiles();
  }, []);

  // Upload file handler
  const handleFileUpload = (file, type = "transcript") => {
    if (!file || !auth.currentUser) return;
    setUploading(true);
    setUploadProgress(0);

    const uid = auth.currentUser.uid;
    const filenameSafe = `${Date.now()}_${file.name}`;
    const storagePath = `uploads/${uid}/${filenameSafe}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      snapshot => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(prog);
      },
      error => {
        console.error("Upload error:", error);
        showMessage("❌ Upload failed");
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        try {
          await addDoc(collection(db, "uploads"), {
            ownerId: uid,
            fileName: file.name,
            storagePath,
            downloadURL,
            type,
            createdAt: serverTimestamp(),
          });

          // Refresh uploaded files list
          const q = query(
            collection(db, "uploads"),
            where("ownerId", "==", uid),
            orderBy("createdAt", "desc")
          );
          const snap = await getDocs(q);
          setUploadedFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));

          showMessage("✅ File uploaded successfully!");
        } catch (err) {
          console.error("Saving metadata error:", err);
          showMessage("❌ Upload succeeded but saving metadata failed.");
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }
    );
  };

  return (
    <div style={card}>
      <h2>Uploads (Transcripts & Certificates)</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label style={fileLabel}>
          <input
            type="file"
            style={{ display: "none" }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={e => {
              const f = e.target.files[0];
              if (f) handleFileUpload(f, "transcript");
              e.target.value = null;
            }}
          />
          Upload Transcript
        </label>
        <label style={fileLabel}>
          <input
            type="file"
            style={{ display: "none" }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={e => {
              const f = e.target.files[0];
              if (f) handleFileUpload(f, "certificate");
              e.target.value = null;
            }}
          />
          Upload Certificate
        </label>

        {uploading && (
          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Uploading: {uploadProgress}%</div>
            <div style={{ background: "#e5e7eb", height: 8, borderRadius: 6 }}>
              <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#2563eb", borderRadius: 6 }} />
            </div>
          </div>
        )}
      </div>

      <h3 style={{ marginTop: 18 }}>My Uploaded Files</h3>
      {uploadedFiles.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {uploadedFiles.map(f => (
            <li key={f.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <a href={f.downloadURL} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                {f.fileName}
              </a>
              <span style={{ marginLeft: 10, color: "#6b7280", fontSize: 13 }}>({f.type})</span>
            </li>
          ))}
        </ul>
      )}

      {message && <div style={alertStyle(message.startsWith("✅"))}>{message}</div>}
    </div>
  );
}

// Styles
const card = { background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 30 };
const fileLabel = { background: "#fff", border: "1px dashed #cbd5e1", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const alertStyle = (success = true) => ({
  position: "fixed",
  top: 20,
  right: 20,
  background: success ? "#16a34a" : "#dc2626",
  color: "#fff",
  padding: "12px 20px",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  zIndex: 1000,
});

export default Uploads;

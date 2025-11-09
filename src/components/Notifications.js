// src/components/Notifications.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../pages/firebase"; // adjust path if needed
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "notifications"),
          where("recipientId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) return <p>Loading notifications...</p>;
  if (!notifications.length) return <p>No notifications.</p>;

  return (
    <div style={card}>
      <h2>Notifications</h2>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
        {notifications.map(n => (
          <li key={n.id} style={notificationCard}>
            <p style={{ margin: 0, fontWeight: 500 }}>{n.title || "Notification"}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              {n.message}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>
              {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : "-"}
            </p>
          </li>
        ))}
      </ul>
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

const notificationCard = {
  background: "#f9fafb",
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
};

export default Notifications;

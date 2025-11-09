import { db } from "../pages/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const seedInstitutions = async () => {
  try {
    const institutions = [
      {
        name: "National University of Lesotho",
        email: "info@nul.ls",
        website: "https://www.nul.ls",
        address: "Roma, Maseru",
        description: "Leading academic institution in Lesotho.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/en/2/27/NUL_logo.png",
      },
      {
        name: "Botho University",
        email: "contact@bothouniversity.com",
        website: "https://www.bothouniversity.com",
        address: "Maseru, Lesotho",
        description: "A modern private university offering global education.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d4/Botho_University_logo.png",
      },
    ];

    for (const inst of institutions) {
      await addDoc(collection(db, "institutions"), {
        ...inst,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Added: ${inst.name}`);
    }

    alert("🎓 Institutions added successfully!");
  } catch (err) {
    console.error("Error seeding institutions:", err);
    alert("❌ Failed to seed institutions.");
  }
};

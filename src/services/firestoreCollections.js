import { db } from "../pages/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

// -------- Admins --------
export const addAdmin = async (data) => {
  return await addDoc(collection(db, "admins"), { ...data, createdAt: new Date() });
};

// -------- Institutions --------
export const addInstitution = async (data) => {
  return await addDoc(collection(db, "institutions"), { ...data, createdAt: new Date() });
};

// -------- Faculties --------
export const addFaculty = async (data) => {
  return await addDoc(collection(db, "faculties"), { ...data, createdAt: new Date() });
};

// -------- Courses --------
export const addCourse = async (data) => {
  return await addDoc(collection(db, "courses"), { ...data, createdAt: new Date() });
};

// -------- Students --------
export const addStudent = async (data) => {
  return await addDoc(collection(db, "students"), { ...data, createdAt: new Date() });
};

// -------- Companies --------
export const addCompany = async (data) => {
  return await addDoc(collection(db, "companies"), { ...data, createdAt: new Date() });
};

// -------- Job Posts --------
export const addJobPost = async (data) => {
  return await addDoc(collection(db, "jobPosts"), { ...data, createdAt: new Date() });
};

// -------- Applications --------
export const addApplication = async (data) => {
  return await addDoc(collection(db, "applications"), { ...data, createdAt: new Date() });
};

// -------- Admissions --------
export const addAdmission = async (data) => {
  return await addDoc(collection(db, "admissions"), { ...data, createdAt: new Date() });
};

// -------- Get all documents from a collection (example) --------
export const getAllDocuments = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

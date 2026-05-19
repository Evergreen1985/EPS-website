import path from "path";

export const USERS = {
  admin:    { username: "admin",          password: "Evergreen@2025", url: "/admin-login" },
  owner:    { username: "owner",          password: "Evergreen@2025", url: "/admin-login" },
  teacher:  { username: "praveena",       password: "Teacher@123",    url: "/teacher-login" },
  teacher2: { username: "bhagyalakshmi", password: "Teacher@123",    url: "/teacher-login" },
  // bhagyalakshmi is a Coordinator — redirects to /admin after login
  driver:   { username: "praveena",       password: "Teacher@123",    url: "/teacher-login" },
};

const authDir = path.join(__dirname, "../.auth");

export const AUTH = {
  admin:    path.join(authDir, "admin.json"),
  owner:    path.join(authDir, "owner.json"),
  teacher:  path.join(authDir, "teacher.json"),
  teacher2: path.join(authDir, "teacher2.json"),
  driver:   path.join(authDir, "teacher.json"),  // same as teacher (praveena)
};

export const BASE = "http://localhost:3000";

export const TODAY = new Date().toISOString().slice(0, 10);

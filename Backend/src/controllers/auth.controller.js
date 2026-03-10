import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: admin._id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({ token });
}

export async function me(req, res) {
  const admin = await Admin.findById(req.user.sub).select("-passwordHash");
  if (!admin) return res.status(404).json({ message: "Admin not found" });
  return res.json({ email: admin.email });
}

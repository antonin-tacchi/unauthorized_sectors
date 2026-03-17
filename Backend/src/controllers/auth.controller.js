import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const IS_PROD = process.env.NODE_ENV === "production";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? "none" : "strict", // "none" requis pour cross-origin (Hostinger ↔ Railway)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  path: "/",
};

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET + "_refresh", { expiresIn: "7d" });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const payload = { sub: admin._id, email: admin.email };
  const accessToken  = signAccess(payload);
  const refreshToken = signRefresh(payload);

  res.cookie("refresh_token", refreshToken, COOKIE_OPTS);
  return res.json({ token: accessToken });
}

export async function refresh(req, res) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + "_refresh");
    const admin = await Admin.findById(decoded.sub).select("-passwordHash");
    if (!admin) return res.status(401).json({ message: "Admin not found" });

    const payload = { sub: admin._id, email: admin.email };
    const accessToken = signAccess(payload);
    const newRefresh  = signRefresh(payload);

    res.cookie("refresh_token", newRefresh, COOKIE_OPTS);
    return res.json({ token: accessToken });
  } catch {
    res.clearCookie("refresh_token", COOKIE_OPTS);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
}

export async function logout(req, res) {
  res.clearCookie("refresh_token", COOKIE_OPTS);
  return res.json({ success: true });
}

export async function me(req, res) {
  const admin = await Admin.findById(req.user.sub).select("-passwordHash");
  if (!admin) return res.status(404).json({ message: "Admin not found" });
  return res.json({ email: admin.email });
}

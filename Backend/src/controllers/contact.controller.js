import { createTransporter, buildContactHtml, buildConfirmHtml } from "../services/mailer.service.js";

const ALLOWED_SUBJECTS = [
  "Custom MLO",
  "Exterior Mapping",
  "Optimization",
  "Bug Report",
  "Other",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContact(req, res) {
  const { email, discord, subject, message } = req.body;

  if (!email || !EMAIL_RE.test(email))
    return res.status(400).json({ message: "Invalid or missing email." });
  if (!message || message.trim().length === 0)
    return res.status(400).json({ message: "Message is required." });
  if (!subject || !ALLOWED_SUBJECTS.includes(subject))
    return res.status(400).json({ message: "Invalid subject." });

  const smtpReady =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.CONTACT_EMAIL;

  if (!smtpReady) {
    console.log("[CONTACT — SMTP non configuré]", { email, discord: discord || "(none)", subject, message: message.trim() });
    return res.status(200).json({ success: true, message: "Message received" });
  }

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `[Portfolio] ${subject} — ${email}`,
      html: buildContactHtml({ email, discord, subject, message }),
    });

    await transporter.sendMail({
      from: `"Antonin TACCHI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Message bien reçu — Antonin TACCHI",
      html: buildConfirmHtml({ subject }),
    });

    return res.status(200).json({ success: true, message: "Message sent" });
  } catch (err) {
    console.error("[CONTACT ERROR]", err.message);
    return res.status(500).json({ message: "Failed to send email. Please try again later." });
  }
}

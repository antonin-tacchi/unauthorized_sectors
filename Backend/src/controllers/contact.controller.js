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

  // Validation
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Invalid or missing email." });
  }
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ message: "Message is required." });
  }
  if (!subject || !ALLOWED_SUBJECTS.includes(subject)) {
    return res.status(400).json({ message: "Invalid subject." });
  }

  console.log("[CONTACT]", {
    email,
    discord: discord || "(none)",
    subject,
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  });

  return res.status(200).json({ success: true, message: "Message received" });
}

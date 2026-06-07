import nodemailer from "nodemailer";

export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function buildContactHtml({ email, discord, subject, message }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#e5e5e5;border-radius:8px;overflow:hidden;">
      <div style="background:#7c3aed;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;color:#fff;">Nouveau message — Portfolio</h1>
      </div>
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#a1a1aa;width:120px;">Sujet</td><td style="padding:8px 0;font-weight:600;">${subject}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Email</td><td style="padding:8px 0;">${email}</td></tr>
          ${discord ? `<tr><td style="padding:8px 0;color:#a1a1aa;">Discord</td><td style="padding:8px 0;">${discord}</td></tr>` : ""}
        </table>
        <hr style="border:none;border-top:1px solid #27272a;margin:24px 0;"/>
        <p style="white-space:pre-wrap;line-height:1.6;">${message.trim()}</p>
      </div>
      <div style="padding:16px 32px;background:#18181b;font-size:12px;color:#71717a;">
        Reçu le ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}
      </div>
    </div>
  `;
}

export function buildConfirmHtml({ subject }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#e5e5e5;border-radius:8px;overflow:hidden;">
      <div style="background:#7c3aed;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;color:#fff;">Message bien reçu ✓</h1>
      </div>
      <div style="padding:32px;">
        <p>Merci pour ton message concernant <strong>${subject}</strong>.</p>
        <p>Je te répondrai dans les plus brefs délais, généralement sous 24-48h.</p>
        <p style="margin-top:32px;color:#a1a1aa;">— Antonin TACCHI</p>
      </div>
    </div>
  `;
}

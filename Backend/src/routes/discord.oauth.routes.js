import { Router } from "express";
import Ticket from "../models/Ticket.js";
import { addUserToChannel } from "../services/discord.bot.js";

const router = Router();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// POST /api/discord/exchange — échange le code OAuth2 et ajoute l'utilisateur au serveur
// Body: { code, redirectUri, state (ticketNumber) }
router.post("/exchange", async (req, res) => {
  const { code, redirectUri, state: ticketNumber } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({ message: "Missing code or redirectUri" });
  }

  try {
    // 1. Échanger le code contre un access_token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      return res.status(400).json({ message: "Token exchange failed" });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Récupérer l'ID Discord de l'utilisateur
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return res.status(400).json({ message: "Failed to fetch user info" });
    }

    const user = await userRes.json();

    // 3. Ajouter l'utilisateur au serveur via le bot
    if (GUILD_ID && BOT_TOKEN) {
      const addRes = await fetch(
        `https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ access_token: accessToken }),
        }
      );
      // 201 = ajouté, 204 = déjà membre — les deux sont OK
      if (addRes.status !== 201 && addRes.status !== 204) {
        const addErr = await addRes.text();
        console.error("Add member failed:", addErr);
      }
    }

    // 4. Add the user to their private ticket channel (if ticketNumber provided)
    // Retry up to 5x with 1s delay — channel creation is fire-and-forget and may not be saved yet
    if (ticketNumber) {
      (async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          const ticket = await Ticket.findOne({ ticketNumber }).lean();
          if (ticket?.discordChannelId) {
            addUserToChannel(ticket.discordChannelId, user.id).catch(() => {});
            break;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      })().catch(() => {});
    }

    res.json({ joined: true, username: user.username });
  } catch (err) {
    console.error("Discord OAuth exchange error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

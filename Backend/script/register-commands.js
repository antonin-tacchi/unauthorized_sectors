import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gérer les tickets")
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("Lister les tickets (défaut: open)")
        .addStringOption((opt) =>
          opt
            .setName("priority")
            .setDescription("Filtrer par priorité")
            .setRequired(false)
            .addChoices(
              { name: "🔴 High", value: "high" },
              { name: "🟡 Medium", value: "medium" },
              { name: "🟢 Low", value: "low" },
            ),
        )
        .addStringOption((opt) =>
          opt
            .setName("status")
            .setDescription("Filtrer par statut (défaut: open)")
            .setRequired(false)
            .addChoices(
              { name: "Open", value: "open" },
              { name: "In Progress", value: "in-progress" },
              { name: "Resolved", value: "resolved" },
              { name: "Closed", value: "closed" },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("Voir un ticket spécifique")
        .addStringOption((opt) =>
          opt
            .setName("number")
            .setDescription("Numéro du ticket (ex: TK-0001)")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Fermer un ticket et archiver son thread")
        .addStringOption((opt) =>
          opt.setName("number").setDescription("Numéro du ticket").setRequired(true),
        ),
    )
    .toJSON(),
];

const rest = new REST().setToken(TOKEN);

console.log("Registering slash commands...");
await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
console.log("✅ Slash commands registered.");

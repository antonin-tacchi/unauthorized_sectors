import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import { findList, findByTicketNumber, closeByTicketNumber } from "../models/Ticket.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TICKETS_CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID;
const ARCHIVE_CATEGORY_ID = process.env.DISCORD_ARCHIVE_CATEGORY_ID;
const ADMIN_USER_ID = process.env.DISCORD_ADMIN_USER_ID;

// ── Role IDs (filled after running setup-server.js) ─────────────────────────
const ROLE_IDS = {
  french:  process.env.DISCORD_ROLE_FRENCH_ID,
  english: process.env.DISCORD_ROLE_ENGLISH_ID,
  fivem:   process.env.DISCORD_ROLE_FIVEM_ID,
  mapper:  process.env.DISCORD_ROLE_MAPPER_ID,
  client:  process.env.DISCORD_ROLE_CLIENT_ID,
  visitor: process.env.DISCORD_ROLE_VISITOR_ID,
  staff:   process.env.DISCORD_ROLE_STAFF_ID,
};

// ── Channel IDs for special behaviour ───────────────────────────────────────
const LANG_SELECT_CHANNEL_ID = process.env.DISCORD_LANG_SELECT_CHANNEL_ID;
const SCREENSHOT_CHANNEL_IDS = new Set(
  [
    process.env.DISCORD_SCREENSHOTS_FR_CHANNEL_ID,
    process.env.DISCORD_SCREENSHOTS_EN_CHANNEL_ID,
  ].filter(Boolean),
);

// Maps button customId → role key
const LANG_BUTTONS = { "role:lang:french": "french", "role:lang:english": "english" };
const PROFILE_BUTTONS = {
  "role:profile:fivem":  "fivem",
  "role:profile:mapper": "mapper",
  "role:profile:client": "client",
};
// Language roles are mutually exclusive; profile roles stack
const LANG_ROLE_KEYS = ["french", "english"];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ── Colors ──────────────────────────────────────────────────────────────────
const PRIORITY_COLORS = { low: 0x22c55e, medium: 0xf59e0b, high: 0xef4444 };
const STATUS_COLORS = {
  open: 0x6b5cff,
  "in-progress": 0xf59e0b,
  resolved: 0x22c55e,
  closed: 0x6b7280,
};

// ── Embed builder ────────────────────────────────────────────────────────────
function buildTicketEmbed(ticket) {
  const fields = [
    { name: "Subject", value: ticket.subject, inline: true },
    { name: "Email", value: ticket.email, inline: true },
  ];
  if (ticket.discord) fields.push({ name: "Discord", value: ticket.discord, inline: true });
  if (ticket.budget) fields.push({ name: "Budget", value: ticket.budget, inline: true });
  if (ticket.timeline) fields.push({ name: "Délai", value: ticket.timeline, inline: true });
  fields.push(
    { name: "Status", value: ticket.status, inline: true },
    { name: "Priority", value: ticket.priority.toUpperCase(), inline: true },
  );
  if (ticket.adminNotes) fields.push({ name: "Admin Notes", value: ticket.adminNotes });
  fields.push({ name: "Message", value: ticket.message.slice(0, 1024) });

  return new EmbedBuilder()
    .setTitle(`🎫 Ticket ${ticket.ticketNumber}`)
    .setColor(PRIORITY_COLORS[ticket.priority] ?? 0x6b5cff)
    .addFields(fields)
    .setFooter({ text: `Ticket ${ticket.ticketNumber}` })
    .setTimestamp(new Date(ticket.createdAt));
}

// ── Images-only enforcement for screenshot channels ───────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!SCREENSHOT_CHANNEL_IDS.has(message.channelId)) return;

  const hasImage = message.attachments.some((a) => a.contentType?.startsWith("image/"))
    || message.embeds.some((e) => e.image || e.thumbnail);

  if (!hasImage) {
    try {
      await message.delete();
      const warn = await message.channel.send({
        content: `<@${message.author.id}> 🖼️ Ce salon accepte uniquement des images. | This channel only accepts images.`,
      });
      setTimeout(() => warn.delete().catch(() => {}), 6000);
    } catch (err) {
      console.error("Failed to delete non-image message:", err.message);
    }
  }
});

// ── Auto-assign Visitor role on join ─────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  if (member.guild.id !== GUILD_ID || !ROLE_IDS.visitor) return;
  try {
    await member.roles.add(ROLE_IDS.visitor, "Auto-assigned on join");
    console.log(`Visitor role assigned to ${member.user.tag}`);
  } catch (err) {
    console.error("Failed to assign Visitor role:", err.message);
  }
});

// ── Button handler: language + profile role selection ─────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const { customId, member, guild } = interaction;

    // Language selection (one-shot: once chosen, channel hidden for this member)
    if (customId in LANG_BUTTONS) {
      const selectedLangKey = LANG_BUTTONS[customId];
      try {
        await interaction.deferReply({ ephemeral: true });

        // Fetch fresh member to ensure roles cache is up-to-date
        const freshMember = await guild.members.fetch(interaction.user.id);

        // Block if already has a language role — one-shot only
        const alreadyHasLang = LANG_ROLE_KEYS.some(
          (k) => ROLE_IDS[k] && freshMember.roles.cache.has(ROLE_IDS[k]),
        );
        if (alreadyHasLang) {
          return interaction.editReply({
            content: "❌ Tu as déjà choisi ta langue. | You already chose your language.",
          });
        }

        // Add selected language role + remove visitor
        if (ROLE_IDS[selectedLangKey]) await freshMember.roles.add(ROLE_IDS[selectedLangKey]);
        if (ROLE_IDS.visitor) await freshMember.roles.remove(ROLE_IDS.visitor).catch(() => {});

        // Hide the lang-select channel for this member (one-shot effect)
        if (LANG_SELECT_CHANNEL_ID) {
          try {
            const langCh = await client.channels.fetch(LANG_SELECT_CHANNEL_ID);
            await langCh.permissionOverwrites.create(freshMember, { ViewChannel: false });
          } catch {
            // Non-blocking
          }
        }

        const isFrench = selectedLangKey === "french";
        await interaction.editReply({
          content: isFrench
            ? "✅ Bienvenue ! Tu as maintenant accès aux salons francophones.\nPense à choisir ton profil dans **🎭・choisir-son-profil**."
            : "✅ Welcome! You now have access to the English channels.\nDon't forget to pick your profile in **🎭・choisir-son-profil**.",
        });
      } catch (err) {
        console.error("Language role assignment failed:", err.message);
        if (!interaction.replied) await interaction.reply({ content: "❌ Error assigning role.", ephemeral: true });
      }
      return;
    }

    // Profile selection
    if (customId in PROFILE_BUTTONS) {
      const profileKey = PROFILE_BUTTONS[customId];
      try {
        await interaction.deferReply({ ephemeral: true });
        const roleId = ROLE_IDS[profileKey];
        if (!roleId) return interaction.editReply({ content: "❌ Role not configured." });

        // Toggle: if already has role, remove it; otherwise add it
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId);
          await interaction.editReply({ content: `✅ Role **${profileKey}** removed.` });
        } else {
          await member.roles.add(roleId);
          await interaction.editReply({ content: `✅ Role **${profileKey}** added!` });
        }
      } catch (err) {
        console.error("Profile role assignment failed:", err.message);
        if (!interaction.replied) await interaction.reply({ content: "❌ Error assigning role.", ephemeral: true });
      }
      return;
    }
  }
});

// ── Slash command handler ────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "ticket") return;

  await interaction.deferReply({ ephemeral: true });
  const sub = interaction.options.getSubcommand();

  try {
    if (sub === "list") {
      const priority = interaction.options.getString("priority");
      const status = interaction.options.getString("status") ?? "open";

      const tickets = await findList({ status, priority, limit: 15 });

      if (!tickets.length) {
        return interaction.editReply({ content: "✅ Aucun ticket trouvé pour ces filtres." });
      }

      const lines = tickets.map((t) => {
        const priorityIcon = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
        return `${priorityIcon} \`${t.ticketNumber}\` **${t.subject}** — ${t.email} — <t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:R>`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`📋 Tickets — ${status}${priority ? ` / ${priority.toUpperCase()}` : ""}`)
        .setColor(STATUS_COLORS[status] ?? 0x6b5cff)
        .setDescription(lines.join("\n"))
        .setFooter({ text: `${tickets.length} ticket(s)` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "view") {
      const number = interaction.options.getString("number").toUpperCase();
      const ticket = await findByTicketNumber(number);
      if (!ticket) {
        return interaction.editReply({ content: `❌ Ticket \`${number}\` introuvable.` });
      }
      return interaction.editReply({ embeds: [buildTicketEmbed(ticket)] });
    }

    if (sub === "close") {
      const number = interaction.options.getString("number").toUpperCase();
      const ticket = await closeByTicketNumber(number);

      if (!ticket) {
        return interaction.editReply({ content: `❌ Ticket \`${number}\` introuvable.` });
      }

      // Archive the channel if it exists
      if (ticket.discordChannelId) {
        archiveTicketChannel(ticket.discordChannelId).catch(() => {});
      }

      return interaction.editReply({
        content: `✅ Ticket \`${number}\` fermé.`,
        embeds: [buildTicketEmbed(ticket)],
      });
    }
  } catch (err) {
    console.error("Slash command error:", err);
    return interaction.editReply({ content: "❌ Une erreur est survenue." });
  }
});

client.once("ready", () => {
  console.log(`Discord bot ready as ${client.user.tag}`);
});

// ── Start bot ────────────────────────────────────────────────────────────────
export async function startBot() {
  if (!TOKEN) return;
  try {
    await client.login(TOKEN);
  } catch (err) {
    console.error("Discord bot failed to start:", err.message);
  }
}

// ── Create a private channel per ticket ──────────────────────────────────────
// Channel is only visible to the bot + admin. Client is added after OAuth.
export async function createTicketChannel(ticket) {
  if (!TOKEN || !TICKETS_CATEGORY_ID || !GUILD_ID || !client.isReady()) {
    console.error("createTicketChannel: early return — TOKEN:", !!TOKEN, "CATEGORY:", !!TICKETS_CATEGORY_ID, "GUILD:", !!GUILD_ID, "ready:", client.isReady());
    return null;
  }
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) return null;

    const channelName = `ticket-${ticket.ticketNumber.toLowerCase()}`;
    const embed = buildTicketEmbed(ticket);

    // Permission overwrites: deny @everyone (type=0 role), allow bot + admin (type=1 user)
    // @everyone role ID == guild ID in Discord
    const permissionOverwrites = [
      {
        id: GUILD_ID,
        type: 0, // role
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: client.user.id,
        type: 1, // member
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageChannels,
        ],
      },
    ];

    if (ADMIN_USER_ID) {
      permissionOverwrites.push({
        id: ADMIN_USER_ID,
        type: 1, // member
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageChannels,
        ],
      });
    }

    const channel = await guild.channels.create({
      name: channelName,
      parent: TICKETS_CATEGORY_ID,
      permissionOverwrites,
      reason: `New ticket — ${ticket.ticketNumber}`,
    });

    await channel.send({ embeds: [embed] });

    return channel.id;
  } catch (err) {
    console.error("Failed to create ticket channel:", err.message, err.stack?.split('\n')[1]);
    return null;
  }
}

// ── Add a Discord user to their ticket channel ────────────────────────────────
export async function addUserToChannel(channelId, discordUserId) {
  console.log("addUserToChannel called:", channelId, discordUserId);
  if (!client.isReady()) { console.error("addUserToChannel: bot not ready"); return; }
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) { console.error("addUserToChannel: channel not found", channelId); return; }

    // Fetch the guild member so discord.js resolves the overwrite as a member (type 1), not a role
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(discordUserId);
    if (!member) { console.error("addUserToChannel: member not found in guild", discordUserId); return; }

    await channel.permissionOverwrites.create(member, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
    console.log("addUserToChannel: success for user", discordUserId);
  } catch (err) {
    console.error("Failed to add user to channel:", err.message, err.stack?.split('\n')[1]);
  }
}

// ── Archive a ticket channel (move to ARCHIVE category, make read-only) ────────
export async function archiveTicketChannel(channelId) {
  if (!client.isReady()) return;
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return;

    const options = { name: `🔒-${channel.name}` };
    if (ARCHIVE_CATEGORY_ID) options.parent = ARCHIVE_CATEGORY_ID;

    await channel.edit(options);

    // Make everyone in the channel read-only
    const overwrites = channel.permissionOverwrites.cache;
    for (const [id, overwrite] of overwrites) {
      if (id === client.user.id) continue; // keep bot permissions
      await channel.permissionOverwrites.edit(id, {
        SendMessages: false,
      });
    }

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔒 Ticket fermé")
          .setColor(0x6b7280)
          .setDescription("Ce ticket a été fermé et est maintenant en lecture seule.")
          .setTimestamp(),
      ],
    });
  } catch (err) {
    console.error("Failed to archive ticket channel:", err.message);
  }
}

// ── Delete a ticket channel entirely ─────────────────────────────────────────
export async function deleteTicketChannel(channelId) {
  if (!client.isReady() || !channelId) return;
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    await channel.delete("Ticket deleted from admin panel");
  } catch (err) {
    console.error("Failed to delete ticket channel:", err.message);
  }
}

export { client };

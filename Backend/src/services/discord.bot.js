import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import Ticket from "../models/Ticket.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TICKETS_CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID;
const ARCHIVE_CATEGORY_ID = process.env.DISCORD_ARCHIVE_CATEGORY_ID;
const ADMIN_USER_ID = process.env.DISCORD_ADMIN_USER_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
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

// ── Slash command handler ────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "ticket") return;

  await interaction.deferReply({ ephemeral: true });
  const sub = interaction.options.getSubcommand();

  try {
    if (sub === "list") {
      const priority = interaction.options.getString("priority");
      const status = interaction.options.getString("status") ?? "open";

      const filter = { status };
      if (priority) filter.priority = priority;

      const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).limit(15).lean();

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
      const ticket = await Ticket.findOne({ ticketNumber: number }).lean();
      if (!ticket) {
        return interaction.editReply({ content: `❌ Ticket \`${number}\` introuvable.` });
      }
      return interaction.editReply({ embeds: [buildTicketEmbed(ticket)] });
    }

    if (sub === "close") {
      const number = interaction.options.getString("number").toUpperCase();
      const ticket = await Ticket.findOneAndUpdate(
        { ticketNumber: number },
        { status: "closed" },
        { new: true },
      ).lean();

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

export { client };

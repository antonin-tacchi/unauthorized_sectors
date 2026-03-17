/**
 * setup-server.js
 * Run once to restructure the Discord server.
 *
 * Usage: node --env-file=.env script/setup-server.js
 *
 * What it does:
 *  - Creates roles (🇫🇷 Français, 🇬🇧 English, interest roles, Staff)
 *  - Creates categories + channels with language-based permissions
 *  - Posts the language-select embed with buttons in #🌐・choisir-sa-langue
 *  - Posts the profile-select embed with buttons in #🎭・choisir-son-profil
 *  - Sets up auto-join: new members automatically get 👀 Visitor role
 *  - Skips TICKETS + ARCHIVES categories (preserved as-is)
 *
 * After running, copy the printed IDs into your .env.
 */

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TICKETS_CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID;
const ARCHIVE_CATEGORY_ID = process.env.DISCORD_ARCHIVE_CATEGORY_ID;

if (!TOKEN || !GUILD_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLE_DEFS = [
  // Language roles (hoisted = shown separately in member list)
  { key: "french",  name: "🇫🇷 Français",      color: 0x0055A4, hoist: true,  mentionable: false },
  { key: "english", name: "🇬🇧 English",        color: 0x012169, hoist: true,  mentionable: false },
  // Interest / profile roles
  { key: "fivem",   name: "🎮 FiveM Player",    color: 0x8B5CF6, hoist: false, mentionable: false },
  { key: "mapper",  name: "🗺️ Mapper",           color: 0xF59E0B, hoist: false, mentionable: false },
  { key: "client",  name: "💼 Client",           color: 0x22C55E, hoist: false, mentionable: false },
  // Entry role — automatically assigned on join
  { key: "visitor", name: "👀 Visitor",          color: 0x6B7280, hoist: false, mentionable: false },
  // Staff
  { key: "staff",   name: "🔧 Staff",            color: 0xEF4444, hoist: true,  mentionable: true  },
];

// ── Server structure ──────────────────────────────────────────────────────────
// Each category has a `channels` array. Each channel has:
//   name, topic (optional), type (default: GuildText), readOnly (optional)
//   langRole: 'french' | 'english' | null  → restrict visibility by language role
//   staffOnly: true → visible to Staff only

function buildStructure(roles, botId) {
  const everyoneDeny  = [PermissionsBitField.Flags.ViewChannel];
  const everyoneAllow = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory];
  const sendAllow     = [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions];

  // Bot always has full access — required to post embeds & manage channels
  const botAllow = {
    id: botId,
    type: 1, // member
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.EmbedLinks,
    ],
  };

  function perm(opts = {}) {
    const { langRole, readOnly } = opts;
    const overwrites = [botAllow];

    overwrites.push({ id: GUILD_ID, type: 0, deny: everyoneDeny });

    if (langRole) {
      overwrites.push({
        id: langRole.id, type: 0,
        allow: readOnly ? everyoneAllow : [...everyoneAllow, ...sendAllow],
      });
    } else {
      if (roles.french) overwrites.push({
        id: roles.french.id, type: 0,
        allow: readOnly ? everyoneAllow : [...everyoneAllow, ...sendAllow],
      });
      if (roles.english) overwrites.push({
        id: roles.english.id, type: 0,
        allow: readOnly ? everyoneAllow : [...everyoneAllow, ...sendAllow],
      });
    }

    if (roles.staff) overwrites.push({
      id: roles.staff.id, type: 0,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages,
      ],
    });

    return overwrites;
  }

  function visitorPerm() {
    return [
      botAllow,
      { id: GUILD_ID, type: 0, deny: everyoneDeny },
      { id: roles.visitor?.id, type: 0, allow: everyoneAllow },
      { id: roles.french?.id,  type: 0, allow: [...everyoneAllow, ...sendAllow] },
      { id: roles.english?.id, type: 0, allow: [...everyoneAllow, ...sendAllow] },
      { id: roles.staff?.id,   type: 0, allow: [...everyoneAllow, ...sendAllow, PermissionsBitField.Flags.ManageMessages] },
    ];
  }

  return [
    // ── 1. ACCUEIL / WELCOME ─────────────────────────────────────────────────
    {
      name: "📋 ─── ACCUEIL / WELCOME ───",
      categoryPerms: visitorPerm(),
      channels: [
        {
          key: "rules",
          name: "📜・règles-rules",
          topic: "Règles du serveur | Server rules",
          perms: visitorPerm(),
          readOnly: true,
        },
        {
          key: "announcements",
          name: "📢・annonces-announcements",
          topic: "Annonces officielles | Official announcements",
          perms: visitorPerm(),
          readOnly: true,
        },
        {
          key: "lang_select",
          name: "🌐・choisir-sa-langue",
          topic: "Choisissez votre langue | Choose your language",
          perms: [
            { id: GUILD_ID, type: 0, deny: everyoneDeny },
            { id: roles.visitor?.id, type: 0, allow: everyoneAllow },
            { id: roles.french?.id,  type: 0, allow: everyoneAllow },
            { id: roles.english?.id, type: 0, allow: everyoneAllow },
            { id: roles.staff?.id,   type: 0, allow: [...everyoneAllow, ...sendAllow] },
          ],
        },
        {
          key: "role_select",
          name: "🎭・choisir-son-profil",
          topic: "Choisissez vos rôles | Choose your roles",
          perms: [
            { id: GUILD_ID, type: 0, deny: everyoneDeny },
            { id: roles.visitor?.id, type: 0, allow: everyoneAllow },
            { id: roles.french?.id,  type: 0, allow: everyoneAllow },
            { id: roles.english?.id, type: 0, allow: everyoneAllow },
            { id: roles.staff?.id,   type: 0, allow: [...everyoneAllow, ...sendAllow] },
          ],
        },
      ],
    },

    // ── 2. COMMUNAUTÉ FRANÇAISE ───────────────────────────────────────────────
    {
      name: "🇫🇷 ─── COMMUNAUTÉ FRANÇAISE ───",
      categoryPerms: perm({ langRole: roles.french }),
      channels: [
        {
          key: "general_fr",
          name: "💬・général-discussion",
          topic: "Discussion générale 🇫🇷",
          perms: perm({ langRole: roles.french }),
        },
        {
          key: "presentation_fr",
          name: "👋・présentations",
          topic: "Présentez-vous à la communauté",
          perms: perm({ langRole: roles.french }),
        },
        {
          key: "fivem_fr",
          name: "🎮・fivem-discussion",
          topic: "Tout sur FiveM — mods, RP, serveurs",
          perms: perm({ langRole: roles.french }),
        },
        {
          key: "mapping_fr",
          name: "🗺️・mapping-créations",
          topic: "Partagez vos créations de mapping FiveM",
          perms: perm({ langRole: roles.french }),
        },
        {
          key: "screenshots_fr",
          name: "📸・screenshots",
          topic: "🖼️ Images uniquement | Images only — no text",
          perms: perm({ langRole: roles.french }),
          imagesOnly: true,
        },
        {
          key: "aide_fr",
          name: "❓・aide-support",
          topic: "Besoin d'aide ? Créez un ticket ici",
          perms: perm({ langRole: roles.french }),
          helpTicket: true,
        },
      ],
    },

    // ── 3. ENGLISH COMMUNITY ─────────────────────────────────────────────────
    {
      name: "🇬🇧 ─── ENGLISH COMMUNITY ───",
      categoryPerms: perm({ langRole: roles.english }),
      channels: [
        {
          key: "general_en",
          name: "💬・general-chat",
          topic: "General discussion 🇬🇧",
          perms: perm({ langRole: roles.english }),
        },
        {
          key: "intro_en",
          name: "👋・introductions",
          topic: "Introduce yourself to the community",
          perms: perm({ langRole: roles.english }),
        },
        {
          key: "fivem_en",
          name: "🎮・fivem-discussion",
          topic: "All about FiveM — mods, RP, servers",
          perms: perm({ langRole: roles.english }),
        },
        {
          key: "screenshots_en",
          name: "📸・screenshots",
          topic: "🖼️ Images only — no text messages",
          perms: perm({ langRole: roles.english }),
          imagesOnly: true,
        },
        {
          key: "help_en",
          name: "❓・help-support",
          topic: "Need help? Create a ticket here",
          perms: perm({ langRole: roles.english }),
          helpTicket: true,
        },
      ],
    },

    // ── 4. SHOWCASE / PORTFOLIO ───────────────────────────────────────────────
    {
      name: "🎨 ─── CRÉATIONS / SHOWCASE ───",
      categoryPerms: perm({}),
      channels: [
        {
          key: "portfolio",
          name: "🏆・portfolio",
          topic: "Portfolio officiel | Official portfolio",
          perms: perm({ readOnly: true }),
        },
        {
          key: "wip",
          name: "🔨・work-in-progress",
          topic: "Projets en cours | Ongoing projects",
          perms: perm({}),
        },
        {
          key: "inspiration",
          name: "💡・inspiration",
          topic: "Inspirations & références | Inspiration & references",
          perms: perm({}),
        },
      ],
    },

    // ── 5. STAFF ZONE ─────────────────────────────────────────────────────────
    {
      name: "🔧 ─── STAFF ───",
      categoryPerms: [
        { id: GUILD_ID, type: 0, deny: everyoneDeny },
        { id: roles.staff?.id, type: 0, allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ]},
      ],
      channels: [
        {
          key: "staff_general",
          name: "🔧・staff-général",
          topic: "Canal interne Staff",
          perms: [
            { id: GUILD_ID, type: 0, deny: everyoneDeny },
            { id: roles.staff?.id, type: 0, allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ]},
          ],
        },
        {
          key: "staff_tickets",
          name: "📊・suivi-tickets",
          topic: "Suivi et gestion des tickets clients",
          perms: [
            { id: GUILD_ID, type: 0, deny: everyoneDeny },
            { id: roles.staff?.id, type: 0, allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ]},
          ],
        },
      ],
    },
  ];
}

// ── Embed content ─────────────────────────────────────────────────────────────
function buildLangEmbed() {
  return new EmbedBuilder()
    .setTitle("🌐  Choisissez votre langue  |  Choose your language")
    .setColor(0x6b5cff)
    .setDescription(
      "**Français** — Cliquez sur 🇫🇷 pour accéder aux salons francophones.\n" +
      "**English** — Click 🇬🇧 to access the English channels.\n\n" +
      "_Vous pouvez changer de langue à tout moment | You can change language at any time._"
    )
    .setFooter({ text: "unauthorized_sectors • Language Selection" })
    .setTimestamp();
}

function buildLangButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("role:lang:french")
      .setLabel("🇫🇷  Français")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("role:lang:english")
      .setLabel("🇬🇧  English")
      .setStyle(ButtonStyle.Primary),
  );
}

function buildProfileEmbed() {
  return new EmbedBuilder()
    .setTitle("🎭  Choisissez votre profil  |  Choose your profile")
    .setColor(0x8B5CF6)
    .setDescription(
      "**🎮 FiveM Player** — Tu joues à FiveM\n" +
      "**🗺️ Mapper** — Tu crées des maps FiveM\n" +
      "**💼 Client** — Tu as passé ou souhaites passer commande\n\n" +
      "_Cumul possible | Multiple roles allowed_"
    )
    .setFooter({ text: "unauthorized_sectors • Profile Selection" })
    .setTimestamp();
}

function buildProfileButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("role:profile:fivem")
      .setLabel("🎮 FiveM Player")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("role:profile:mapper")
      .setLabel("🗺️ Mapper")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("role:profile:client")
      .setLabel("💼 Client")
      .setStyle(ButtonStyle.Success),
  );
}

function buildHelpEmbed(lang = "fr") {
  const isFr = lang === "fr";
  return new EmbedBuilder()
    .setTitle(isFr ? "❓  Besoin d'aide ?" : "❓  Need help?")
    .setColor(0x6b5cff)
    .setDescription(
      isFr
        ? "Tu as une question ou besoin d'assistance sur une commande ?\n\nClique sur le bouton ci-dessous pour créer un **ticket sur notre site** et nous te répondrons dès que possible."
        : "Do you have a question or need assistance with a commission?\n\nClick the button below to create a **ticket on our website** and we'll get back to you as soon as possible.",
    )
    .setFooter({ text: "unauthorized_sectors" })
    .setTimestamp();
}

function buildHelpButton(lang = "fr") {
  const isFr = lang === "fr";
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel(isFr ? "🎫  Créer un ticket" : "🎫  Create a ticket")
      .setStyle(ButtonStyle.Link)
      .setURL(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/contact` : "https://unauthorized-sectors.com/contact"),
  );
}

function buildRulesEmbed() {
  return new EmbedBuilder()
    .setTitle("📜  Règles du serveur  |  Server Rules")
    .setColor(0xEF4444)
    .addFields(
      {
        name: "🇫🇷  Règles générales",
        value:
          "1. Respectez tous les membres\n" +
          "2. Pas de spam, de pub ou de harcèlement\n" +
          "3. Restez dans le sujet du canal\n" +
          "4. Pas de contenu NSFW\n" +
          "5. Suivez les directives Discord",
      },
      {
        name: "🇬🇧  General Rules",
        value:
          "1. Respect all members\n" +
          "2. No spam, ads, or harassment\n" +
          "3. Stay on topic per channel\n" +
          "4. No NSFW content\n" +
          "5. Follow Discord's guidelines",
      },
      {
        name: "🎫  Tickets & Commissions",
        value:
          "Use our website to submit a commission request.\n" +
          "Utilisez notre site pour soumettre une demande de commission.",
      },
    )
    .setFooter({ text: "unauthorized_sectors" })
    .setTimestamp();
}

// ── Main setup ────────────────────────────────────────────────────────────────
async function setup() {
  await client.login(TOKEN);
  await new Promise((resolve) => client.once("ready", resolve));

  const guild = await client.guilds.fetch(GUILD_ID, { force: true });
  console.log(`\n✅ Connected to: ${guild.name} (${guild.id})`);

  // ── 1. Create roles ────────────────────────────────────────────────────────
  console.log("\n── Creating / fetching roles ──");
  const existingRoles = await guild.roles.fetch();
  const roles = {};

  for (const def of ROLE_DEFS) {
    let role = existingRoles.find((r) => r.name === def.name);
    if (!role) {
      role = await guild.roles.create({
        name: def.name,
        colors: [def.color],
        hoist: def.hoist,
        mentionable: def.mentionable,
        reason: "Server setup by setup-server.js",
      });
      console.log(`  ➕ Created role: ${def.name} (${role.id})`);
    } else {
      console.log(`  ✔  Role exists: ${def.name} (${role.id})`);
    }
    roles[def.key] = role;
  }

  // ── 2. Create categories + channels ───────────────────────────────────────
  const structure = buildStructure(roles, client.user.id);
  const channelIds = {};
  const existingChannels = await guild.channels.fetch();

  console.log("\n── Creating categories & channels ──");

  // Determine next position (after TICKETS and ARCHIVES)
  const skipIds = new Set([TICKETS_CATEGORY_ID, ARCHIVE_CATEGORY_ID]);

  for (const catDef of structure) {
    // Check if category already exists
    let category = existingChannels.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === catDef.name,
    );

    if (!category) {
      // Create category WITHOUT overwrites first, then set them after
      category = await guild.channels.create({
        name: catDef.name,
        type: ChannelType.GuildCategory,
        reason: "Server setup",
      });
      console.log(`  📁 Created category: ${catDef.name}`);
    } else {
      console.log(`  📁 Category exists: ${catDef.name}`);
    }

    // Set/update category permission overwrites after creation
    if (catDef.categoryPerms) {
      try {
        await category.permissionOverwrites.set(catDef.categoryPerms);
      } catch (err) {
        console.warn(`  ⚠  Could not set perms on category ${catDef.name}: ${err.message}`);
      }
    }

    for (const chDef of catDef.channels) {
      // Match existing channel by name inside this parent category
      const normalizedName = chDef.name
        .toLowerCase()
        .replace(/[^\x00-\x7F]/g, "") // strip non-ASCII (emojis, etc.)
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      let channel = existingChannels.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.parentId === category.id &&
          (c.name === normalizedName || c.name.endsWith(normalizedName) || normalizedName.endsWith(c.name)),
      );

      if (!channel) {
        // Create WITHOUT permissionOverwrites — channels inherit from parent category
        const createOpts = {
          name: chDef.name,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: "Server setup",
        };
        if (chDef.topic) createOpts.topic = chDef.topic;

        channel = await guild.channels.create(createOpts);
        console.log(`    ➕ Created: #${chDef.name}`);
      } else {
        console.log(`    ✔  Exists:  #${chDef.name}`);
      }

      channelIds[chDef.key] = channel.id;

      if (chDef.readOnly) {
        try {
          await channel.permissionOverwrites.create(guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
          });
        } catch {
          console.warn(`    ⚠  Could not set read-only on #${chDef.name} (set manually)`);
        }
      }
    }
  }

  // ── Delete channels that no longer exist in the structure ─────────────────
  const channelsToDelete = ["🗺️・mapping-showcase"];
  for (const name of channelsToDelete) {
    const ch = existingChannels.find(
      (c) => c.type === ChannelType.GuildText && c.name.includes("mapping-showcase"),
    );
    if (ch) {
      try {
        await ch.delete("Removed from server structure");
        console.log(`  🗑  Deleted: #${ch.name}`);
      } catch {
        console.warn(`  ⚠  Could not delete #${name} (do it manually)`);
      }
    }
  }

  // ── 3. Post embeds ─────────────────────────────────────────────────────────
  console.log("\n── Posting setup embeds ──");

  /**
   * Ensure the bot can access a channel, then post an embed.
   * Falls back gracefully with a warning if permissions are still blocked.
   */
  async function postEmbed(channelId, label, sendFn) {
    if (!channelId) return;
    try {
      const channel = await client.channels.fetch(channelId);

      // Force-grant bot access to this specific channel before posting
      try {
        await channel.permissionOverwrites.create(client.user, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          EmbedLinks: true,
        });
      } catch {
        // Silently ignore — if category perms already grant access this isn't needed
      }

      const msgs = await channel.messages.fetch({ limit: 10 }).catch(() => ({ some: () => false }));
      if (msgs.some?.((m) => m.author.id === client.user.id)) {
        console.log(`  ✔  ${label} embed already exists`);
        return;
      }

      await sendFn(channel);
      console.log(`  ✅ Posted ${label} embed`);
    } catch (err) {
      console.warn(`  ⚠  Could not post ${label} embed (${err.message})`);
      console.warn(`     → Post it manually in channel ID: ${channelId}`);
    }
  }

  await postEmbed(channelIds.rules, "📜 Rules", (ch) =>
    ch.send({ embeds: [buildRulesEmbed()] }),
  );

  await postEmbed(channelIds.lang_select, "🌐 Language select", (ch) =>
    ch.send({ embeds: [buildLangEmbed()], components: [buildLangButtons()] }),
  );

  await postEmbed(channelIds.role_select, "🎭 Profile select", (ch) =>
    ch.send({ embeds: [buildProfileEmbed()], components: [buildProfileButtons()] }),
  );

  await postEmbed(channelIds.aide_fr, "❓ Aide FR", (ch) =>
    ch.send({ embeds: [buildHelpEmbed("fr")], components: [buildHelpButton("fr")] }),
  );

  await postEmbed(channelIds.help_en, "❓ Help EN", (ch) =>
    ch.send({ embeds: [buildHelpEmbed("en")], components: [buildHelpButton("en")] }),
  );

  // ── 4. Print IDs to add to .env ───────────────────────────────────────────
  console.log("\n── Add these to your .env ──");
  console.log(`DISCORD_ROLE_FRENCH_ID=${roles.french?.id}`);
  console.log(`DISCORD_ROLE_ENGLISH_ID=${roles.english?.id}`);
  console.log(`DISCORD_ROLE_FIVEM_ID=${roles.fivem?.id}`);
  console.log(`DISCORD_ROLE_MAPPER_ID=${roles.mapper?.id}`);
  console.log(`DISCORD_ROLE_CLIENT_ID=${roles.client?.id}`);
  console.log(`DISCORD_ROLE_VISITOR_ID=${roles.visitor?.id}`);
  console.log(`DISCORD_ROLE_STAFF_ID=${roles.staff?.id}`);
  console.log(`DISCORD_LANG_SELECT_CHANNEL_ID=${channelIds.lang_select}`);
  console.log(`DISCORD_SCREENSHOTS_FR_CHANNEL_ID=${channelIds.screenshots_fr}`);
  console.log(`DISCORD_SCREENSHOTS_EN_CHANNEL_ID=${channelIds.screenshots_en}`);

  console.log("\n✅ Server setup complete!");
  process.exit(0);
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});

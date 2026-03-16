import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    discord: { type: String, trim: true, default: "" },
    subject: {
      type: String,
      required: true,
      enum: ["Custom MLO", "Exterior Mapping", "Optimization", "Bug Report", "Other"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    budget: { type: String, trim: true, default: "" },
    timeline: { type: String, trim: true, default: "" },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    discordMessageId: { type: String, default: "" },
    discordThreadId: { type: String, default: "" },
    discordChannelId: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-increment ticket number: TK-0001, TK-0002, …
ticketSchema.pre("save", async function () {
  if (this.ticketNumber) return;
  const last = await this.constructor
    .findOne({}, { ticketNumber: 1 })
    .sort({ createdAt: -1 })
    .lean();
  let seq = 1;
  if (last?.ticketNumber) {
    const n = parseInt(last.ticketNumber.replace("TK-", ""), 10);
    if (!isNaN(n)) seq = n + 1;
  }
  this.ticketNumber = `TK-${String(seq).padStart(4, "0")}`;
});

export default mongoose.model("Ticket", ticketSchema);

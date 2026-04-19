import mongoose from "mongoose";

const WithdrawSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    network: {
      type: String,
      enum: ["TRC20", "BEP20"],
      required: true,
    },
    txId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminInvoice: {
      data: { type: Buffer, default: null },
      contentType: { type: String, default: null },
      filename: { type: String, default: null },
      size: { type: Number, default: null },
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast admin queries (status + createdAt)
WithdrawSchema.index({ status: 1, createdAt: -1 });

// Compound index for fast pending withdraw deduplication and query speed
WithdrawSchema.index(
    { user: 1, txId: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } }
);

export default mongoose.models.Withdraw ||
  mongoose.model("Withdraw", WithdrawSchema);
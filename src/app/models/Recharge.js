import mongoose from "mongoose";

const RechargeSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        network: { type: String, required: true },
        amount: { type: Number, required: true },
        txId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
            default: undefined,
        },


        // Submitter metadata (fallback when the uploader is not authenticated)
        submitterEmail: { type: String, trim: true, lowercase: true },
        submitterName: { type: String, trim: true },

        slip: {
            data: { type: Buffer },
            contentType: { type: String },
            filename: { type: String },
            size: { type: Number },
        },


        status: { type: String, enum: ["pending", "confirmed", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

// Optimize user recharge history queries by user + creation date
RechargeSchema.index({ user: 1, createdAt: -1 });
// Optimize admin listing by created time when sorting latest recharges
RechargeSchema.index({ createdAt: -1 });

export default mongoose.models.Recharge || mongoose.model("Recharge", RechargeSchema);

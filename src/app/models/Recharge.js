import mongoose from "mongoose";

const RechargeSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        network: { type: String, required: true },
        amount: { type: Number, required: true },
        txId: { type: String, required: true, index: true },

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

export default mongoose.models.Recharge || mongoose.model("Recharge", RechargeSchema);

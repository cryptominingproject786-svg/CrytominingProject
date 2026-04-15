import mongoose from "mongoose";

const ReferralBonusSchema = new mongoose.Schema(
    {
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        referredUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        investment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Investment",
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            default: 0.25,
        },
        description: {
            type: String,
            default: "First referral investment bonus",
        },
        awardedAt: {
            type: Date,
            default: Date.now,
        },
        type: {
            type: String,
            required: true,
            default: "firstReferralBonus",
            enum: ["firstReferralBonus"],
            index: true,
        },
    },
    { timestamps: true }
);

ReferralBonusSchema.index(
    { parent: 1, referredUser: 1, type: 1 },
    { unique: true, partialFilterExpression: { type: { $exists: true } } }
);

export default mongoose.models.ReferralBonus || mongoose.model("ReferralBonus", ReferralBonusSchema);

import mongoose from "mongoose";

const InvestmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        minerName: String,

        amount: Number,

        cycleDays: Number,

        monthlyRoR: Number,

        dailyProfit: Number,

        totalProfit: Number,

        totalReturn: Number,

        claimedProfit: {
            type: Number,
            default: 0
        },

        startDate: {
            type: Date,
            default: Date.now
        },

        maturityDate: Date,

        lastProfitAt: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active"
        }

    },
    { timestamps: true }
);

export default mongoose.models.Investment ||
    mongoose.model("Investment", InvestmentSchema);
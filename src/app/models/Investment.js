import mongoose from "mongoose";

const InvestmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        minerName: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        investmentCycle: {
            type: Number, // days
            required: true,
        },
        monthlyRoR: {
            type: Number, // Monthly Rate of Return as decimal (e.g., 0.70 for 70%)
            required: true,
        },
        dailyProfit: {
            type: Number,
            required: true,
        },
        totalProfit: {
            type: Number,
            required: true,
        },
        totalReturn: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active",
        },
        startDate: {
            type: Date,
            default: () => new Date(),
        },
        maturityDate: {
            type: Date,
            required: true,
        },
        profitWithdrawn: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Investment ||
    mongoose.model("Investment", InvestmentSchema);

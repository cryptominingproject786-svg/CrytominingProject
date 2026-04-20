import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false, // 🔐 never return password by default
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            minlength: 7,
            maxlength: 20,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        // ✅ Wallet balance — credited on recharge confirmation, deducted on investment
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Investment-related fields
        investedAmount: {
            type: Number,
            default: 0,
        },

        totalEarnings: {
            type: Number,
            default: 0,
        },

        teamEarnings: {
            type: Number,
            default: 0,
        },

        dailyProfit: {
            type: Number,
            default: 0,
        },

        reservedBalance: {
            type: Number,
            default: 0,
            min: 0,
            index: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // Verification
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
            select: false,
        },
        otpExpiry: {
            type: Date,
        },
        resetToken: {
            type: String,
            select: false,
        },
        resetTokenExpiry: {
            type: Date,
        },

        // Referral
        referralCode: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        firstInvestmentAt: {
            type: Date,
        },
        referralCount: {
            type: Number,
            default: 0,
        },
        activeInvestmentsCount: {
            type: Number,
            default: 0,
            min: 0,
            index: true,
        },
        referralDailyLastPaidAt: {
            type: Date,
            default: null,
            index: true,
        },

        // Recharges
        recharges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recharge" }],
        lastRechargeAt: { type: Date },
        lastRechargeAmount: { type: Number },
        lastRechargeTxId: { type: String },
        lastRechargeSlipFilename: { type: String },
        lastRechargeSlipSize: { type: Number },

        // Investments
        investments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Investment" }],

        // Security & tracking
        lastLogin: {
            type: Date,
        },
    },
    { timestamps: true }
);

// 🔐 Password Hashing
UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// 🔐 Password Compare Method
UserSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model("User", UserSchema);


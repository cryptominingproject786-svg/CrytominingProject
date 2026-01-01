import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
            trim: true,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
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

        dailyProfit: {
            type: Number,
            default: 0,
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
        },
        referralCount: {
            type: Number,
            default: 0,
        },

        // Security & tracking
        lastLogin: {
            type: Date,
        },
    },
    { timestamps: true }
);

/// 🔐 Password Hashing
// Use async middleware pattern (no `next` param) to avoid "next is not a function" errors
UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

/// 🔐 Password Compare Method
UserSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.models.User ||
    mongoose.model("User", UserSchema);

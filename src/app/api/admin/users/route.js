import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import Recharge from "../../../models/Recharge";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(DEFAULT_PAGE, Number(url.searchParams.get("page")) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(5, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    await connectDB();

    const totalUsers = await User.countDocuments({ role: "user", isActive: true });
    const pageCount = Math.max(1, Math.ceil(totalUsers / limit));

    const users = await User.aggregate([
        { $match: { role: "user", isActive: true } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                let: { id: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$referredBy", "$$id"] } } },
                    { $sort: { createdAt: -1 } },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1,
                            balance: 1,
                            investedAmount: 1,
                            createdAt: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: "recharges",
                            let: { userId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$user", "$$userId"] },
                                                { $eq: ["$status", "confirmed"] },
                                            ],
                                        },
                                    },
                                },
                                { $group: { _id: null, deposited: { $sum: "$amount" } } },
                            ],
                            as: "deposits",
                        },
                    },
                    {
                        $addFields: {
                            depositedAmount: {
                                $ifNull: [{ $arrayElemAt: ["$deposits.deposited", 0] }, 0],
                            },
                        },
                    },
                    { $project: { deposits: 0 } },
                    { $limit: 4 },
                ],
                as: "referrals",
            },
        },
        {
            $lookup: {
                from: "users",
                let: { id: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$referredBy", "$$id"] } } },
                    { $count: "count" },
                ],
                as: "referralCountData",
            },
        },
        {
            $lookup: {
                from: "recharges",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$user", "$$userId"] },
                            status: "confirmed",
                        },
                    },
                    { $group: { _id: null, deposited: { $sum: "$amount" } } },
                ],
                as: "deposits",
            },
        },
        {
            $addFields: {
                referralCount: {
                    $ifNull: [{ $arrayElemAt: ["$referralCountData.count", 0] }, 0],
                },
                depositedAmount: {
                    $ifNull: [{ $arrayElemAt: ["$deposits.deposited", 0] }, 0],
                },
            },
        },
        {
            $project: {
                password: 0,
                otp: 0,
                otpExpiry: 0,
                resetToken: 0,
                resetTokenExpiry: 0,
                recharges: 0,
                investments: 0,
                referredBy: 0,
                referralCountData: 0,
                deposits: 0,
            },
        },
    ]);

    const safeUsers = users.map((user) => ({
        ...user,
        _id: user._id.toString(),
        createdAt: user.createdAt?.toISOString() ?? null,
        firstInvestmentAt: user.firstInvestmentAt?.toISOString() ?? null,
        referrals: (user.referrals || []).map((child) => ({
            ...child,
            _id: child._id.toString(),
            createdAt: child.createdAt?.toISOString() ?? null,
        })),
    }));

    return NextResponse.json({
        data: {
            page,
            pageCount,
            totalUsers,
            users: safeUsers,
        },
        status: 200,
    });
}

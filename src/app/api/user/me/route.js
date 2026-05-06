import { NextResponse } from "next/server";
import { getAuthToken, getAuthUserId } from "../../../lib/authToken";
import { getUserDashboardData } from "../../../lib/userDashboard";
import { setCachedJson } from "../../../lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const token = await getAuthToken(req);
        const userId = getAuthUserId(token);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const cachedData = await getUserDashboardData(userId);
        if (!cachedData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await setCachedJson(`user:me:${userId}`, cachedData.profile, 5);
        return NextResponse.json({ data: cachedData.profile });
    } catch (err) {
        console.error("user/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
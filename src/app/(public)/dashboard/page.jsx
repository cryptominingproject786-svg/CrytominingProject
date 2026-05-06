import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import DashboardClientShell from "./DashboardClientShell";
import { getUserDashboardData } from "../../lib/userDashboard";

export const dynamic = "force-dynamic";

export default async function UserHome() {
    const token = await getToken({
        req: { headers: headers(), cookies: cookies() },
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
        redirect("/join");
    }

    const cachedData = await getUserDashboardData(token.id);
    if (!cachedData) {
        redirect("/join");
    }

    return (
        <DashboardClientShell
            initialUserData={cachedData.profile}
            initialInvestments={cachedData.investments}
        />
    );
}

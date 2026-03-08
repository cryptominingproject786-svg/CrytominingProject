import connectDB from "../../lib/mongoDb";
import Recharge from "../../models/Recharge";
import User from "../../models/User"; // ✅ important

import AdminClient from "../dashbord/AdminClient";

export default async function AdminPage() {
    await connectDB();

    const recharges = await Recharge.find()
        .select("-slip.data")
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("user", "email")
        .lean();

    const safeData = recharges.map(r => ({
        _id: r._id.toString(),   // ✅ convert ObjectId
        user: r.user
            ? { ...r.user, _id: r.user._id.toString() }
            : null,
        network: r.network,
        amount: r.amount,
        txId: r.txId,
        status: r.status,
        createdAt: r.createdAt?.toISOString(),
        slip: {
            hasImage: !!r.slip?.contentType
        }
    }));

    return <AdminClient initialData={safeData} />;

}

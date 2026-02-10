import RechargeClient from "./RechargeClient";

export default async function RechargeNetworkPage({ params }) {
    const { network } = await params;

    return <RechargeClient network={network} />;
}

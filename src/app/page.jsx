import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("./HomeClient"), {
  ssr: true,
});

export const metadata = {
  title: "BittXS Mining — Passive Crypto Income",
  description:
    "Join BittXS Mining for secure daily earnings, transparent payouts, and global crypto mining infrastructure.",
  openGraph: {
    title: "BittXS Mining — Passive Crypto Income",
    description:
      "Join BittXS Mining for secure daily earnings, transparent payouts, and global crypto mining infrastructure.",
    type: "website",
    siteName: "BittXS Mining",
    images: [
      {
        url: "/banner.png",
        alt: "BittXS Mining platform overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BittXS Mining — Passive Crypto Income",
    description:
      "Join BittXS Mining for secure daily earnings, transparent payouts, and global crypto mining infrastructure.",
    images: ["/banner.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <main>
      <HomeClient />
    </main>
  );
}

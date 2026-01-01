import Link from "next/link";

function Navbar() {
    return (
        <nav
            className="relative w-full h-20 flex items-center justify-between px-10 text-white bg-cover bg-center"
            style={{ backgroundImage: "url('/banner.png')" }}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* Left navigation */}
            <div className="relative z-10 flex items-center gap-8 font-black">
                <Link href="/" className="hover:text-yellow-400 transition">
                    Home
                </Link>
                <Link href="/mining" className="hover:text-yellow-400 transition">
                    Mining
                </Link>
                <Link href="/privacy" className="hover:text-yellow-400 transition">
                    Privacy
                </Link>
                <Link href="/about" className="hover:text-yellow-400 transition">
                    About Us
                </Link>
            </div>

            {/* Right navigation */}
            <div className="relative z-10 flex items-center gap-4 font-black">
                <Link href="/join" className="hover:text-yellow-400 transition">
                    Join
                </Link>
                <Link
                    href="/signup"
                    className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400 transition font-black"
                >
                    Sign Up
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;

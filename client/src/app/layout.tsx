import type { Metadata } from "next";
import { Saira_Condensed, Kanit } from "next/font/google";
import "./globals.css";

const saira = Saira_Condensed({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-saira",
});

const kanit = Kanit({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    variable: "--font-kanit",
});

export const metadata: Metadata = {
    title: "CareerSim — Codebasics",
    description:
        "Master data analytics careers through realistic simulation. Build your profile, crack interviews, and negotiate offers.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${kanit.variable} ${saira.variable} font-sans antialiased text-white bg-[#181830]`}>{children}</body>
        </html>
    );
}

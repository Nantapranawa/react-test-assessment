import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "./lib/DataContext";
import { AuthProvider } from "./lib/AuthContext";
import AppShell from "./components/AppShell";

export const metadata: Metadata = {
    title: "Assessment Planning Platform",
    description: "Telkom HCSP Division - Assessment Planning Platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <AuthProvider>
                    <DataProvider>
                        <AppShell>
                            {children}
                        </AppShell>
                    </DataProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

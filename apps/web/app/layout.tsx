import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { DataProvider } from "./lib/DataContext";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Excel Data Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DataProvider>
          {/* --- VISUAL ELEMENT: MAIN APP CONTAINER --- 
              This wrapper uses 'flex' to put the Sidebar and Main Content side-by-side. 
          */}
          <div className="flex h-screen bg-white">

            {/* --- VISUAL ELEMENT: LEFT SIDEBAR --- 
                The persistent navigation menu on the left.
            */}
            <Sidebar />

            {/* --- VISUAL ELEMENT: MAIN CONTENT AREA --- 
                This is where individual pages (like page.tsx) are rendered.
                The 'flex-1' makes it take up all remaining space.
            */}
            <main className="flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
              {children}
            </main>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}

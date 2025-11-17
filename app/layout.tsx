import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "No-Code Architects Toolkit - Dashboard",
  description: "Modern dashboard for No-Code Architects Toolkit API - Media processing made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}

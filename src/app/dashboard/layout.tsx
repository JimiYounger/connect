import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your million-dollar dashboard layout",
};

export default function DashboardLayout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden">
      {children}
    </div>
  );
}

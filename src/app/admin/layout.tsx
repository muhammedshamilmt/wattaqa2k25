import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { PropsWithChildren } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex min-h-screen bg-gray-50 font-poppins"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}>

        <Sidebar />
        <div className="w-full bg-transparent">
          <Header />
          <main className="w-full relative">
            <div className="bg-white min-h-[calc(100vh-64px)] relative p-3 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
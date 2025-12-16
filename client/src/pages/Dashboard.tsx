import { useAuth } from "@/contexts/AuthContext";
import ClientDashboard from "./ClientDashboard";
import StoreDashboard from "./StoreDashboard";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  switch (user.role) {
    case "store":
      return <StoreDashboard />;
    case "admin":
      return <ClientDashboard />;
    default:
      return <ClientDashboard />;
  }
}

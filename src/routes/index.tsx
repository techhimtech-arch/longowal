import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMD Dashboard — Enterprise Performance" },
      { name: "description", content: "Real-time enterprise performance overview with KPIs, sales trends, orders, and collections." },
      { property: "og:title", content: "CMD Dashboard" },
      { property: "og:description", content: "Real-time enterprise performance overview." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FolderKanban, ArrowLeftRight, Download } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [connectionCount, projectCount, crosswalkCount, exportCount] =
    await Promise.all([
      prisma.connection.count({ where: { userId } }),
      prisma.project.count({ where: { userId } }),
      prisma.crosswalk.count({ where: { userId } }),
      prisma.exportHistory.count({ where: { userId } }),
    ]);

  const stats = [
    { label: "Connections", value: connectionCount, icon: Database },
    { label: "Projects", value: projectCount, icon: FolderKanban },
    { label: "Crosswalks", value: crosswalkCount, icon: ArrowLeftRight },
    { label: "Exports", value: exportCount, icon: Download },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

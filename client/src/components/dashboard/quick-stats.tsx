import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Coffee, Clock } from "lucide-react";
import { DashboardStats } from "@shared/schema";

export default function QuickStats() {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Default values for stats with type safety
  const statsData = {
    clockedIn: stats?.stats?.clockedIn ?? 0,
    onBreak: stats?.stats?.onBreak ?? 0,
    late: stats?.stats?.late ?? 0,
  };

  const statCards = [
    {
      title: "Employees Clocked In",
      value: statsData.clockedIn,
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "On Break",
      value: statsData.onBreak,
      icon: Coffee,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Late Arrivals",
      value: statsData.late,
      icon: Clock,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`} className="hover:shadow-md transition-all border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center`}>
                <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">{stat.title}</p>
              <p className={`text-4xl font-semibold ${stat.color}`} data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

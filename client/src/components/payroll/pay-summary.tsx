import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatCurrency, formatHours, getPayPeriodRange } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export default function PaySummary() {
  const currentUser = getCurrentUser();
  const payPeriod = getPayPeriodRange();

  const { data: timeEntries } = useQuery({
    queryKey: ["/api/time-entries", {
      startDate: payPeriod.start.toISOString(),
      endDate: payPeriod.end.toISOString(),
    }],
  });

  // Calculate totals
  const totalHours = timeEntries?.entries?.reduce((total: number, entry: any) => {
    return total + (parseFloat(entry.totalHours || "0"));
  }, 0) || 0;

  const hourlyRate = parseFloat(currentUser?.hourlyRate || "0");
  const grossPay = totalHours * hourlyRate;
  const deductions = grossPay * 0.15; // Simplified 15% deduction
  const netPay = grossPay - deductions;

  const summaryCards = [
    {
      title: "Total Hours",
      value: formatHours(totalHours),
      color: "text-primary",
      bgColor: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Gross Pay",
      value: formatCurrency(grossPay),
      color: "text-accent",
      bgColor: "bg-accent/10",
      border: "border-accent/20",
    },
    {
      title: "Net Pay",
      value: formatCurrency(netPay),
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      border: "border-chart-2/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className={`border-2 ${card.border}`}>
          <CardContent className={`p-6 ${card.bgColor}`}>
            <div className="text-center">
              <p className={`text-sm font-medium ${card.color} mb-2`}>
                {card.title}
              </p>
              <p 
                className={`text-3xl font-bold ${card.color}`}
                data-testid={`pay-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {card.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

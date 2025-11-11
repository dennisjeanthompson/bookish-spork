import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Download, Calendar, Users, DollarSign, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { isManager } from "@/lib/auth";
import { useLocation } from "wouter";

interface HoursReportData {
  startDate: string;
  endDate: string;
  employees: EmployeeHours[];
  summary: {
    totalHours: number;
    totalPay: number;
    totalShifts: number;
    employeeCount: number;
  };
}

interface EmployeeHours {
  employeeId: string;
  employeeName: string;
  position: string;
  hourlyRate: number;
  totalHours: number;
  totalShifts: number;
  estimatedPay: number;
  hoursByDay: { date: string; hours: number }[];
}

export default function HoursReport() {
  const [, setLocation] = useLocation();
  const managerRole = isManager();

  // Redirect if not manager
  if (!managerRole) {
    setLocation('/mobile-dashboard');
    return null;
  }

  const now = new Date();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Update dates when range changes
  const handleRangeChange = (range: 'week' | 'month' | 'custom') => {
    setDateRange(range);
    if (range === 'week') {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (range === 'month') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    }
  };

  // Fetch hours report
  const { data: reportData, isLoading } = useQuery<HoursReportData>({
    queryKey: ['/api/hours/report', startDate, endDate, selectedEmployee],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedEmployee !== 'all' && { employeeId: selectedEmployee }),
      });
      const response = await apiRequest('GET', `/api/hours/report?${params}`);
      return response.json();
    },
  });

  // Fetch all employees for filter
  const { data: employeesData } = useQuery<{ employees: any[] }>({
    queryKey: ['/api/hours/all-employees'],
  });

  const employees = employeesData?.employees || [];

  // Export to CSV
  const handleExport = () => {
    if (!reportData) return;

    const csvRows = [
      ['Employee Name', 'Position', 'Hourly Rate', 'Total Hours', 'Total Shifts', 'Estimated Pay'],
      ...reportData.employees.map(emp => [
        emp.employeeName,
        emp.position,
        emp.hourlyRate.toFixed(2),
        emp.totalHours.toFixed(2),
        emp.totalShifts.toString(),
        emp.estimatedPay.toFixed(2),
      ]),
      [],
      ['Summary'],
      ['Total Hours', reportData.summary.totalHours.toFixed(2)],
      ['Total Pay', reportData.summary.totalPay.toFixed(2)],
      ['Total Shifts', reportData.summary.totalShifts.toString()],
      ['Employee Count', reportData.summary.employeeCount.toString()],
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hours-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Hours Report</h2>
        <p className="text-muted-foreground">Detailed breakdown of employee hours worked</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 text-primary mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range Preset */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={(value: any) => handleRangeChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRange('custom');
                }}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRange('custom');
                }}
              />
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleExport} disabled={!reportData || isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {reportData.summary.totalHours.toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">Total Pay</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    ₱{reportData.summary.totalPay.toFixed(0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">Total Shifts</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {reportData.summary.totalShifts}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">Employees</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {reportData.summary.employeeCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-200 dark:bg-orange-800 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Hours Breakdown</CardTitle>
          <CardDescription>
            Showing hours from {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading report...</div>
          ) : reportData && reportData.employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Total Shifts</TableHead>
                  <TableHead className="text-right">Estimated Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.employees.map((employee) => (
                  <TableRow key={employee.employeeId}>
                    <TableCell className="font-medium">{employee.employeeName}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>₱{employee.hourlyRate.toFixed(2)}/hr</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{employee.totalHours.toFixed(1)}h</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.totalShifts}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ₱{employee.estimatedPay.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hours data found for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


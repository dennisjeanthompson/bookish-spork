import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, Clock, Users, Plus, FileText, CheckCircle, XCircle, Loader2, Download, Send } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PayrollPeriod {
  id: string;
  branchId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalHours?: number | string;
  totalPay?: number | string;
  createdAt?: string;
}

interface PayrollEntry {
  id: string;
  userId: string;
  payrollPeriodId: string;
  totalHours: number | string;
  regularHours: number | string;
  overtimeHours: number | string;
  grossPay: number | string;
  deductions: number | string;
  netPay: number | string;
  status: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    email: string;
  };
}

export default function PayrollManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("periods");

  // Fetch payroll periods
  const { data: periodsData, isLoading: periodsLoading } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payroll/periods');
      return response.json();
    },
  });

  // Fetch payroll entries for selected period
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['payroll-entries-branch', selectedPeriod?.id],
    queryFn: async () => {
      const url = selectedPeriod 
        ? `/api/payroll/entries/branch?periodId=${selectedPeriod.id}`
        : '/api/payroll/entries/branch';
      const response = await apiRequest('GET', url);
      return response.json();
    },
    enabled: !!selectedPeriod,
  });

  // Create payroll period mutation
  const createPeriodMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string }) => {
      const response = await apiRequest('POST', '/api/payroll/periods', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payroll Period Created",
        description: "New payroll period has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      setIsCreateDialogOpen(false);
      setStartDate("");
      setEndDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payroll period",
        variant: "destructive",
      });
    },
  });

  // Send payslip mutation
  const sendPayslipMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await apiRequest('POST', `/api/payroll/entries/${entryId}/send`, {});
      return response.json();
    },
    onSuccess: (data, entryId) => {
      toast({
        title: "Payslip Sent",
        description: "Payslip has been sent to the employee",
      });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries-branch'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send payslip",
        variant: "destructive",
      });
    },
  });

  // Process payroll mutation
  const processPayrollMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const response = await apiRequest('POST', `/api/payroll/periods/${periodId}/process`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payroll Processed",
        description: data.message || "Payroll has been processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries-branch'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payroll",
        variant: "destructive",
      });
    },
  });

  // Approve payroll entry mutation
  const approveEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await apiRequest('PUT', `/api/payroll/entries/${entryId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry Approved",
        description: "Payroll entry has been approved",
      });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries-branch'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve entry",
        variant: "destructive",
      });
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await apiRequest('PUT', `/api/payroll/entries/${entryId}/paid`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Marked as Paid",
        description: "Payroll entry has been marked as paid",
      });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries-branch'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as paid",
        variant: "destructive",
      });
    },
  });

  const handleCreatePeriod = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    createPeriodMutation.mutate({ startDate, endDate });
  };

  const handleProcessPayroll = (periodId: string) => {
    if (window.confirm("Are you sure you want to process payroll for this period? This will calculate pay for all employees with shifts.")) {
      processPayrollMutation.mutate(periodId);
    }
  };

  const periods = periodsData?.periods || [];
  const entries = entriesData?.entries || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payroll Management</h2>
          <p className="text-muted-foreground">
            Manage payroll periods, process payments, and approve entries
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Pay Period
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Payroll Period</DialogTitle>
              <DialogDescription>
                Set up a new payroll period for your employees
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePeriod} disabled={createPeriodMutation.isPending}>
                {createPeriodMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Period
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="periods">
            <Calendar className="h-4 w-4 mr-2" />
            Payroll Periods
          </TabsTrigger>
          <TabsTrigger value="entries">
            <FileText className="h-4 w-4 mr-2" />
            Payroll Entries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Periods</CardTitle>
              <CardDescription>
                Manage and process payroll periods for your branch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {periodsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : periods.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Payroll Periods</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first payroll period to get started
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payroll Period
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {periods.map((period: PayrollPeriod) => (
                    <Card key={period.id} className="border-2">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {format(new Date(period.startDate), "MMM d, yyyy")} -{" "}
                                {format(new Date(period.endDate), "MMM d, yyyy")}
                              </h3>
                              <Badge
                                variant={
                                  period.status === 'open' ? 'default' :
                                  period.status === 'closed' ? 'secondary' : 'outline'
                                }
                              >
                                {period.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {period.totalHours && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Hours</p>
                                  <p className="text-xl font-semibold">
                                    {parseFloat(String(period.totalHours)).toFixed(1)}h
                                  </p>
                                </div>
                              )}
                              {period.totalPay && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Pay</p>
                                  <p className="text-xl font-semibold text-green-600">
                                    ₱{parseFloat(String(period.totalPay)).toFixed(2)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {period.status === 'open' && (
                              <Button
                                onClick={() => handleProcessPayroll(period.id)}
                                disabled={processPayrollMutation.isPending}
                              >
                                {processPayrollMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <DollarSign className="h-4 w-4 mr-2" />
                                )}
                                Process Payroll
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPeriod(period);
                                setActiveTab("entries");
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Entries
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Entries</CardTitle>
              <CardDescription>
                {selectedPeriod
                  ? `Entries for period: ${format(new Date(selectedPeriod.startDate), "MMM d")} - ${format(new Date(selectedPeriod.endDate), "MMM d, yyyy")}`
                  : "Select a payroll period to view entries"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedPeriod ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Period Selected</h3>
                  <p className="text-muted-foreground">
                    Select a payroll period from the "Payroll Periods" tab to view entries
                  </p>
                </div>
              ) : entriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Entries</h3>
                  <p className="text-muted-foreground mb-4">
                    No payroll entries found for this period
                  </p>
                  {selectedPeriod.status === 'open' && (
                    <Button onClick={() => handleProcessPayroll(selectedPeriod.id)}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Payroll
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="text-right">Total Hours</TableHead>
                      <TableHead className="text-right">Gross Pay</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry: PayrollEntry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.employee?.firstName} {entry.employee?.lastName}
                        </TableCell>
                        <TableCell>{entry.employee?.position}</TableCell>
                        <TableCell className="text-right">
                          {parseFloat(String(entry.totalHours)).toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          ₱{parseFloat(String(entry.grossPay)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -₱{parseFloat(String(entry.deductions)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₱{parseFloat(String(entry.netPay)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.status === 'paid' ? 'default' :
                              entry.status === 'approved' ? 'secondary' : 'outline'
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveEntryMutation.mutate(entry.id)}
                                disabled={approveEntryMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {entry.status === 'approved' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => markPaidMutation.mutate(entry.id)}
                                  disabled={markPaidMutation.isPending}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Mark Paid
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendPayslipMutation.mutate(entry.id)}
                                  disabled={sendPayslipMutation.isPending}
                                  title="Send payslip to employee"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {entry.status === 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendPayslipMutation.mutate(entry.id)}
                                disabled={sendPayslipMutation.isPending}
                                title="Send payslip to employee"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

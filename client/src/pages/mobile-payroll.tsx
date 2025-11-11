import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUser, getAuthState } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import MobileHeader from "@/components/layout/mobile-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

interface PayrollEntry {
  id: string;
  totalHours: number | string;
  grossPay: number | string;
  netPay: number | string;
  deductions: number | string;
  status: string;
  createdAt: string;
}

export default function MobilePayroll() {
  const currentUser = getCurrentUser();
  const { isAuthenticated, user } = getAuthState();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Wait for authentication to load
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // This component is only accessible on mobile server, so all users are employees

  // Fetch payroll entries
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ['mobile-payroll', currentUser?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payroll');
      return response.json();
    },
  });

  const payrollEntries: PayrollEntry[] = payrollData?.entries || [];

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      // Clear auth state
      localStorage.removeItem('auth-user');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDownloadPayslip = async (entryId: string) => {
    try {
      const response = await apiRequest('GET', `/api/payroll/payslip/${entryId}`);
      const payslipData = await response.json();

      // Create HTML payslip
      const payslipHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payslip - ${payslipData.payslip.employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .pay-details { margin-bottom: 30px; }
            .pay-section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
            .pay-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total { border-top: 2px solid #333; padding-top: 10px; font-weight: bold; font-size: 1.1em; }
            .footer { text-align: center; margin-top: 40px; font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>The Café</h1>
            <h2>Payroll Management System</h2>
          </div>

          <div class="pay-details">
            <div class="pay-section">
              <h3>Employee Information</h3>
              <div class="pay-row">
                <span>Name:</span>
                <span>${payslipData.payslip.employeeName}</span>
              </div>
              <div class="pay-row">
                <span>Period:</span>
                <span>${format(new Date(payslipData.payslip.period), "MMMM d, yyyy")}</span>
              </div>
              <div class="pay-row">
                <span>Position:</span>
                <span>${payslipData.payslip.position}</span>
              </div>
            </div>

            <div class="pay-section">
              <h3>Hours Worked</h3>
              <div class="pay-row">
                <span>Total Hours:</span>
                <span>${payslipData.payslip.totalHours}h</span>
              </div>
            </div>

            <div class="pay-section">
              <h3>Compensation</h3>
              <div class="pay-row">
                <span>Gross Pay:</span>
                <span>₱${parseFloat(payslipData.payslip.grossPay).toFixed(2)}</span>
              </div>
              <div class="pay-row">
                <span>Deductions:</span>
                <span>-₱${parseFloat(payslipData.payslip.deductions).toFixed(2)}</span>
              </div>
              <div class="pay-row total">
                <span>Net Pay:</span>
                <span>₱${parseFloat(payslipData.payslip.netPay).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This payslip was generated electronically and is valid without signature.</p>
          </div>
        </body>
        </html>
      `;

      // Download the file
      const blob = new Blob([payslipHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${payslipData.payslip.employeeName}_${format(new Date(payslipData.payslip.period), "yyyy-MM-dd")}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Payslip Downloaded",
        description: "Payslip has been downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download payslip",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="Payroll"
        subtitle="Payment history"
        showBack={true}
        onBack={() => setLocation('/mobile-dashboard')}
      />

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₱{payrollEntries.reduce((sum, entry) =>
                    sum + parseFloat(String(entry.netPay)), 0).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {payrollEntries.reduce((sum, entry) =>
                    sum + parseFloat(String(entry.totalHours)), 0).toFixed(1)}h
                </p>
                <p className="text-sm text-muted-foreground">Hours Worked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Entries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Payment History</CardTitle>
            <CardDescription>
              Your recent payroll entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Loading payroll data...</p>
              </div>
            ) : payrollEntries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payroll entries yet</p>
                <p className="text-xs">Payroll entries will appear here after processing</p>
              </div>
            ) : (
              payrollEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">
                        {format(parseISO(entry.createdAt), "MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pay Period
                      </p>
                    </div>
                    <Badge
                      variant={
                        entry.status === 'paid' ? 'default' :
                        entry.status === 'approved' ? 'secondary' : 'outline'
                      }
                    >
                      {entry.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Hours</p>
                      <p className="font-semibold">
                        {parseFloat(String(entry.totalHours)).toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Pay</p>
                      <p className="font-semibold">
                        ₱{parseFloat(String(entry.grossPay)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Net Pay</p>
                      <p className="text-xl font-bold text-green-600">
                        ₱{parseFloat(String(entry.netPay)).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPayslip(entry.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Payslip
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
}

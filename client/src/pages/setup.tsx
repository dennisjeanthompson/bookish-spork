import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coffee, LogIn } from "lucide-react";

export default function Setup() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [showLogin, setShowLogin] = useState(false);
  
  // Branch data
  const [branchData, setBranchData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // Manager data
  const [managerData, setManagerData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    email: "",
    hourlyRate: "25.00",
  });

  const setupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Setup failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setup Complete!",
        description: "Your cafe management system is ready. Redirecting to login...",
      });
      
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBranchNext = () => {
    if (!branchData.name || !branchData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required branch fields",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!managerData.username || !managerData.password || !managerData.firstName || 
        !managerData.lastName || !managerData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required manager fields",
        variant: "destructive",
      });
      return;
    }

    if (managerData.password !== managerData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (managerData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setupMutation.mutate({
      branch: branchData,
      manager: {
        username: managerData.username,
        password: managerData.password,
        firstName: managerData.firstName,
        lastName: managerData.lastName,
        email: managerData.email,
        hourlyRate: managerData.hourlyRate,
      },
    });
  };

  // If user clicks login button, redirect to login page
  if (showLogin) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-2xl shadow-md">
              <Coffee className="h-12 w-12" />
            </div>
          </div>
          <CardTitle className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Welcome to The Café</CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
            Let's set up your cafe management system
          </CardDescription>
          <div className="flex justify-center gap-2 pt-4">
            <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </div>
          
          {/* Login link for existing users/employees */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Already have an account? Login here</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100">Step 1: Branch Information</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Tell us about your cafe location</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name *</Label>
                <Input
                  id="branchName"
                  placeholder="e.g., Downtown Branch"
                  value={branchData.name}
                  onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchAddress">Address *</Label>
                <Input
                  id="branchAddress"
                  placeholder="e.g., 123 Main St, Downtown"
                  value={branchData.address}
                  onChange={(e) => setBranchData({ ...branchData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchPhone">Phone Number</Label>
                <Input
                  id="branchPhone"
                  placeholder="e.g., (555) 123-4567"
                  value={branchData.phone}
                  onChange={(e) => setBranchData({ ...branchData, phone: e.target.value })}
                />
              </div>

              <Button onClick={handleBranchNext} className="w-full bg-orange-600 hover:bg-orange-700 text-white" size="lg">
                Next: Create Manager Account
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleManagerSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100">Step 2: Manager Account</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Create the primary manager account</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={managerData.firstName}
                    onChange={(e) => setManagerData({ ...managerData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={managerData.lastName}
                    onChange={(e) => setManagerData({ ...managerData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={managerData.email}
                  onChange={(e) => setManagerData({ ...managerData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={managerData.username}
                  onChange={(e) => setManagerData({ ...managerData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={managerData.password}
                  onChange={(e) => setManagerData({ ...managerData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={managerData.confirmPassword}
                  onChange={(e) => setManagerData({ ...managerData, confirmPassword: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={managerData.hourlyRate}
                  onChange={(e) => setManagerData({ ...managerData, hourlyRate: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                  disabled={setupMutation.isPending}
                >
                  {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


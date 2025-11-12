import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { setAuthState } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Login failed - Error data:', errorData);
        } catch (e) {
          console.error('Login failed - Could not parse error response');
          errorData = { message: 'Invalid credentials' };
        }
        console.error('Full response status:', response.status, response.statusText);
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      // Update auth state
      setAuthState({ user: data.user, isAuthenticated: true });
      
      // Show success message
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.firstName} ${data.user.lastName}`,
      });
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center mb-2">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-2xl shadow-md">
              <Coffee className="h-12 w-12" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to The Café
            </CardTitle>
            <CardDescription className="text-base text-gray-600 dark:text-gray-400">
              Sign in to access your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 dark:text-gray-300 font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
                placeholder="Enter your username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
                placeholder="Enter your password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-sm"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Coffee,
  LayoutDashboard,
  Calendar,
  ArrowRightLeft,
  DollarSign,
  Bell,
  Users,
  BarChart3,
  Store,
  Settings,
  LogOut,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniCalendar } from '@/components/calendar/mini-calendar';
import { getCurrentUser, isManager } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { setAuthState } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["employee", "manager"] },
  { name: "Schedule", href: "/schedule", icon: Calendar, roles: ["employee", "manager"] },
  { name: "Shift Trading", href: "/shift-trading", icon: ArrowRightLeft, roles: ["employee", "manager"] },
  { name: "Pay Summary", href: "/payroll", icon: DollarSign, roles: ["employee", "manager"] },
  { name: "Notifications", href: "/notifications", icon: Bell, roles: ["employee", "manager"] },
  { name: "Employees", href: "/employees", icon: Users, roles: ["manager"] },
  { name: "Hours Report", href: "/hours-report", icon: Clock, roles: ["manager"] },
  { name: "Payroll Mgmt", href: "/payroll-management", icon: DollarSign, roles: ["manager"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["manager"] },
  { name: "Branches", href: "/branches", icon: Store, roles: ["manager"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const currentUser = getCurrentUser();
  const isManagerRole = isManager();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setAuthState({ user: null, isAuthenticated: false });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(currentUser?.role || "employee")
  );

  return (
    <div className="w-64 bg-card border-r border-border shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Coffee className="h-6 w-6 text-primary-foreground coffee-steam" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">The Café</h1>
            <p className="text-sm text-muted-foreground">Smart Payroll System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )}
                data-testid={`nav-${item.href.slice(1) || 'dashboard'}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Mini Calendar */}
      <div className="p-4 border-t border-border">
        <MiniCalendar />
      </div>

      {/* User Profile */}
      <div className="p-4 bg-card border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-sm">
              {currentUser && getInitials(currentUser.firstName, currentUser.lastName)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm" data-testid="text-user-name">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-user-role">
              {currentUser?.role === "manager" ? "Manager" : "Employee"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

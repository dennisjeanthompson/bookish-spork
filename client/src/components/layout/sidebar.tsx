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
      return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col shadow-sm">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <Coffee className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">The Café</h1>
            <p className="text-xs text-muted-foreground">Smart Payroll System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
            {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mini Calendar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <MiniCalendar />
      </div>

      {/* User Profile */}
            {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {user?.role || 'Employee'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
    </div>
  );
}

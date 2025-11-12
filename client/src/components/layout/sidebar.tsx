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
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
            <Coffee className="h-6 w-6 text-white coffee-steam" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">The Café</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Smart Payroll System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1">{
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm",
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <MiniCalendar />
      </div>

      {/* User Profile */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">
              {currentUser && getInitials(currentUser.firstName, currentUser.lastName)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100" data-testid="text-user-name">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-user-role">
              {currentUser?.role === "manager" ? "Manager" : "Employee"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
            className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

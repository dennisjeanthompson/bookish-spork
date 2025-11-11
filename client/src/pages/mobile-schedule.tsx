import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isToday, isTomorrow, parseISO, addDays, startOfWeek, endOfWeek } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUser, getAuthState } from "@/lib/auth";
import { useLocation } from "wouter";
import MobileHeader from "@/components/layout/mobile-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  position: string;
  status: string;
  break?: {
    startTime: string;
    endTime: string;
  };
}

export default function MobileSchedule() {
  const currentUser = getCurrentUser();
  const { isAuthenticated, user } = getAuthState();
  const [, setLocation] = useLocation();
  const [selectedWeek, setSelectedWeek] = useState(new Date());

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

  // Fetch shifts for the week
  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['mobile-schedule-shifts', currentUser?.id, selectedWeek],
    queryFn: async () => {
      const weekStart = startOfWeek(selectedWeek);
      const weekEnd = endOfWeek(selectedWeek);
      const response = await apiRequest(
        'GET',
        `/api/shifts?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
      );
      return response.json();
    },
  });

  const shifts: Shift[] = shiftsData?.shifts || [];

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfWeek(selectedWeek), i);
    const dayShifts = shifts.filter(shift => {
      const shiftDate = parseISO(shift.startTime);
      return format(shiftDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });

    return {
      date: day,
      shifts: dayShifts,
      isToday: isToday(day),
      isTomorrow: isTomorrow(day),
    };
  });

  const getShiftTimeLabel = (shift: Shift) => {
    const start = parseISO(shift.startTime);
    if (isToday(start)) return "Today";
    if (isTomorrow(start)) return "Tomorrow";
    return format(start, "EEE");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="My Schedule"
        subtitle={`${format(startOfWeek(selectedWeek), "MMM d")} - ${format(endOfWeek(selectedWeek), "MMM d")}`}
        showBack={true}
        onBack={() => setLocation('/mobile-dashboard')}
      />

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(prev => addDays(prev, -7))}
          >
            ← Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(prev => addDays(prev, 7))}
          >
            Next →
          </Button>
        </div>

        {/* Schedule Cards */}
        <div className="space-y-3">
          {weekDays.map((day) => (
            <Card key={format(day.date, 'yyyy-MM-dd')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {day.isToday && <Badge className="bg-primary">Today</Badge>}
                    {day.isTomorrow && <Badge variant="secondary">Tomorrow</Badge>}
                    {format(day.date, "EEEE, MMMM d")}
                  </CardTitle>
                  <Badge variant="outline">
                    {day.shifts.length} shift{day.shifts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {day.shifts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No shifts scheduled</p>
                  </div>
                ) : (
                  day.shifts.map((shift) => {
                    const start = parseISO(shift.startTime);
                    const end = parseISO(shift.endTime);
                    const isNow = isToday(start);

                    return (
                      <div
                        key={shift.id}
                        className={`p-4 rounded-lg border-2 ${
                          isNow
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={isNow ? 'default' : 'secondary'}>
                                {getShiftTimeLabel(shift)}
                              </Badge>
                              <Badge variant="outline">{shift.position}</Badge>
                            </div>
                          </div>
                          {isNow && (
                            <Badge className="bg-green-600">Active</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                          </span>
                        </div>
                        {shift.break && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Break: {format(parseISO(shift.break.startTime), 'h:mm a')} -{' '}
                            {format(parseISO(shift.break.endTime), 'h:mm a')}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

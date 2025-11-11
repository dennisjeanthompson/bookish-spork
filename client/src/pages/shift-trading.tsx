import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Plus } from "lucide-react";
import ShiftCard from "@/components/shifts/shift-card";

export default function ShiftTrading() {
  const { data: availableShifts } = useQuery({
    queryKey: ["/api/shift-trades/available"],
  });

  const { data: myTrades } = useQuery({
    queryKey: ["/api/shift-trades"],
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Shift Trading</h2>
          <p className="text-muted-foreground">Exchange shifts with your colleagues</p>
        </div>
        
        <Button data-testid="button-post-shift">
          <Plus className="h-4 w-4 mr-2" />
          Post Available Shift
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Shifts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRightLeft className="h-5 w-5 text-primary mr-2" />
              Available Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableShifts?.trades?.length > 0 ? (
                availableShifts.trades.map((trade: any) => (
                  <ShiftCard
                    key={trade.id}
                    trade={trade}
                    type="available"
                    data-testid={`shift-available-${trade.id}`}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No available shifts to trade
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Posted Shifts */}
        <Card>
          <CardHeader>
            <CardTitle>My Posted Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTrades?.trades?.length > 0 ? (
                myTrades.trades.map((trade: any) => (
                  <ShiftCard
                    key={trade.id}
                    trade={trade}
                    type="my"
                    data-testid={`shift-my-${trade.id}`}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  You haven't posted any shifts for trade
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

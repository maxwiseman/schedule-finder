import { Users } from "lucide-react";
import type { ScheduleData } from "@/lib/use-stream-generation";

interface ScheduleViewProps {
  scheduleData: ScheduleData;
  classmates: Record<
    string,
    Array<{
      userId: string;
      userName: string;
      userEmail: string;
      period: number;
      dayType: string;
    }>
  >;
}

export function ScheduleView({ scheduleData, classmates }: ScheduleViewProps) {
  const renderPeriodRow = (
    periodName: string,
    periodNumber: number,
    period: any
  ) => {
    const renderDayContent = (dayData: any, dayType: "red" | "blue") => {
      if (dayData === undefined) {
        return <div className="text-muted-foreground text-sm">No data</div>;
      }

      if (dayData === null) {
        const freeKey = `FREE-FREE PERIOD-${periodNumber}-${dayType}`;
        const freeClassmates = classmates[freeKey] || [];

        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground italic">
                Free Period
              </div>
              <div className="text-xs text-muted-foreground">
                No class scheduled
              </div>
            </div>
            {freeClassmates.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{freeClassmates.length} also free</span>
              </div>
            )}
          </div>
        );
      }

      const courseKey = `${dayData.courseCode}-${dayData.teacherName}-${periodNumber}-${dayType}`;
      const courseClassmates = classmates[courseKey] || [];

      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="font-medium">{dayData.courseName || "..."}</div>
            <div className="text-sm text-muted-foreground">
              {dayData.teacherName || "..."}
              {dayData.roomNumber && ` • ${dayData.roomNumber}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {dayData.courseCode || "..."}
            </div>
          </div>
          {courseClassmates.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {courseClassmates.length} classmate
                {courseClassmates.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      );
    };

    return (
      <tr key={periodName} className="border-b">
        <td className="p-3 font-medium">{periodName}</td>
        <td className="p-3">{renderDayContent(period?.redDay, "red")}</td>
        <td className="p-3">{renderDayContent(period?.blueDay, "blue")}</td>
      </tr>
    );
  };

  const renderAdvisoryRow = (advisory: any) => {
    if (!advisory) {
      return (
        <tr className="border-b">
          <td className="p-3 font-medium">Advisory</td>
          <td className="p-3 text-center text-muted-foreground" colSpan={2}>
            No data
          </td>
        </tr>
      );
    }

    const advisoryKey = `ADV-${advisory.teacherName}-5-both`;
    const advisoryClassmates = classmates[advisoryKey] || [];

    return (
      <tr className="border-b">
        <td className="p-3 font-medium">Advisory</td>
        <td className="p-3 text-center" colSpan={2}>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="font-medium">{advisory.teacherName}</div>
              {advisory.roomNumber && (
                <div className="text-xs text-muted-foreground">
                  {advisory.roomNumber}
                </div>
              )}
            </div>
            {advisoryClassmates.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                <Users className="h-3 w-3" />
                <span>
                  {advisoryClassmates.length} classmate
                  {advisoryClassmates.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="border rounded-md">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left w-24">Period</th>
            <th className="p-3 text-left text-red-600">Red Day</th>
            <th className="p-3 text-left text-blue-600">Blue Day</th>
          </tr>
        </thead>
        <tbody>
          {renderPeriodRow("1st", 1, scheduleData.firstPeriod)}
          {renderPeriodRow("2nd", 2, scheduleData.secondPeriod)}
          {renderPeriodRow("3rd", 3, scheduleData.thirdPeriod)}
          {renderPeriodRow("4th", 4, scheduleData.fourthPeriod)}
          {renderAdvisoryRow(scheduleData.advisory)}
        </tbody>
      </table>
    </div>
  );
}

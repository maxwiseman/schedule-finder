import { useState, useEffect } from "react";
import { Search, Users, Calendar, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ScheduleData } from "@/lib/use-stream-generation";

interface ClassmatesViewProps {
  scheduleData: ScheduleData;
  classmates: Record<
    string,
    Array<{
      userId: string;
      userName: string;
      period: number;
      dayType: string;
    }>
  >;
}

interface ClassmateInfo {
  userId: string;
  userName: string;
  sharedClasses: Array<{
    courseName: string;
    courseCode: string;
    teacherName: string;
    period: number;
    dayType: string;
    roomNumber?: string;
  }>;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

// Component to display a schedule in the dialog
function ScheduleDialog({ scheduleData }: { scheduleData: ScheduleData }) {
  const renderPeriodRow = (
    periodName: string,
    periodNumber: number,
    period: any
  ) => {
    const renderDayContent = (dayData: any, dayType: "red" | "blue") => {
      if (dayData === undefined) {
        return (
          <div className="text-muted-foreground text-sm terminal-list-item">
            No data
          </div>
        );
      }

      if (dayData === null) {
        return (
          <div className="space-y-2 terminal-slide-in">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground italic">
                [FREE PERIOD]
              </div>
              <div className="text-xs text-muted-foreground">
                No class scheduled
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-2 terminal-slide-in">
          <div className="space-y-1">
            <div className="font-medium">{dayData.courseName || "..."}</div>
            <div className="text-sm text-muted-foreground">
              {dayData.teacherName || "..."}
              {dayData.roomNumber && ` • ${dayData.roomNumber}`}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {dayData.courseCode || "..."}
            </div>
          </div>
        </div>
      );
    };

    return (
      <tr
        key={periodName}
        className="border-b border-border terminal-slide-in"
        style={{ animationDelay: `${periodNumber * 0.1}s` }}
      >
        <td className="p-3 font-medium font-mono uppercase tracking-wide hidden md:table-cell">
          {periodName}
        </td>
        <td className="p-3">{renderDayContent(period?.redDay, "red")}</td>
        <td className="p-3">{renderDayContent(period?.blueDay, "blue")}</td>
      </tr>
    );
  };

  const renderAdvisoryRow = (advisory: any) => {
    if (!advisory) {
      return (
        <tr className="border-b border-border">
          <td className="p-3 font-medium font-mono uppercase tracking-wide hidden md:table-cell">
            Adv
          </td>
          <td
            className="p-3 text-center text-muted-foreground terminal-list-item"
            colSpan={2}
          >
            No data
          </td>
        </tr>
      );
    }

    return (
      <tr
        className="border-b border-border terminal-slide-in"
        style={{ animationDelay: "0.5s" }}
      >
        <td className="p-3 font-medium font-mono uppercase tracking-wide hidden md:table-cell">
          Adv
        </td>
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
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="border border-border terminal-animate-in">
      <table className="w-full font-mono">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="p-3 text-left w-24 uppercase tracking-wide hidden md:table-cell">
              Period
            </th>
            <th className="p-3 text-left text-red-400 uppercase tracking-wide">
              Red Day
            </th>
            <th className="p-3 text-left text-blue-400 uppercase tracking-wide">
              Blue Day
            </th>
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

export function ClassmatesView({
  scheduleData,
  classmates,
}: ClassmatesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassmate, setSelectedClassmate] =
    useState<ClassmateInfo | null>(null);
  const [classmateSchedule, setClassmateSchedule] =
    useState<ScheduleData | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch all users with a schedule
  useEffect(() => {
    async function fetchUsers() {
      // Try to get current user ID from scheduleData (advisory or any period)
      // This is a hack; ideally, userId should be passed as a prop
      let userId: string | null = null;
      // Try to infer from classmates keys
      for (const key in classmates) {
        if (classmates[key]?.[0]?.userId) {
          userId = classmates[key][0].userId;
          break;
        }
      }
      setCurrentUserId(userId);
      const res = await fetch(
        `/api/users${userId ? `?excludeUserId=${userId}` : ""}`
      );
      const data = await res.json();
      setAllUsers(data.users || []);
    }
    fetchUsers();
  }, [classmates]);

  // Function to fetch a classmate's schedule
  const fetchClassmateSchedule = async (userId: string) => {
    setIsLoadingSchedule(true);
    try {
      const response = await fetch(`/api/schedules?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }
      const data = await response.json();
      setClassmateSchedule(data.schedule);
    } catch (error) {
      console.error("Error fetching classmate schedule:", error);
      setClassmateSchedule(null);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // Handle opening the dialog for a classmate
  const handleViewSchedule = async (classmate: ClassmateInfo | UserInfo) => {
    setSelectedClassmate(
      "userId" in classmate
        ? (classmate as ClassmateInfo)
        : { userId: classmate.id, userName: classmate.name, sharedClasses: [] }
    );
    setDialogOpen(true);
    await fetchClassmateSchedule(
      "userId" in classmate ? classmate.userId : classmate.id
    );
  };

  // Extract all unique classmates and their shared classes
  const extractClassmates = (): ClassmateInfo[] => {
    const classmateMap = new Map<string, ClassmateInfo>();

    // Helper to get course info from schedule
    const getCourseInfo = (period: number, dayType: string) => {
      if (period === 5) {
        // Advisory
        return scheduleData.advisory
          ? {
              courseName: "Advisory",
              courseCode: "ADV",
              teacherName: scheduleData.advisory.teacherName,
              roomNumber: scheduleData.advisory.roomNumber,
            }
          : null;
      }

      const periods = [
        scheduleData.firstPeriod,
        scheduleData.secondPeriod,
        scheduleData.thirdPeriod,
        scheduleData.fourthPeriod,
      ];
      const periodData = periods[period - 1];

      if (!periodData) return null;

      const courseData =
        dayType === "red" ? periodData.redDay : periodData.blueDay;

      if (!courseData || courseData === null) {
        return {
          courseName: "[FREE PERIOD]",
          courseCode: "FREE",
          teacherName: "No class scheduled",
        };
      }

      return {
        courseName: courseData.courseName || "",
        courseCode: courseData.courseCode || "",
        teacherName: courseData.teacherName || "",
        roomNumber: courseData.roomNumber,
      };
    };

    // Process all classmate entries
    Object.entries(classmates).forEach(([key, students]) => {
      // Parse the key to get course info
      const keyParts = key.split("-");
      if (keyParts.length < 4) return;

      const period = parseInt(keyParts[keyParts.length - 2] || "0");
      const dayType = keyParts[keyParts.length - 1] || "";

      const courseInfo = getCourseInfo(period, dayType);
      if (!courseInfo) return;

      students.forEach((student) => {
        if (!classmateMap.has(student.userId)) {
          classmateMap.set(student.userId, {
            userId: student.userId,
            userName: student.userName,
            sharedClasses: [],
          });
        }

        const classmate = classmateMap.get(student.userId)!;
        classmate.sharedClasses.push({
          ...courseInfo,
          period,
          dayType: dayType as string,
        });
      });
    });

    // Sort classmates by name and sort their shared classes
    return Array.from(classmateMap.values())
      .map((classmate) => ({
        ...classmate,
        sharedClasses: classmate.sharedClasses.sort((a, b) => {
          if (a.period !== b.period) return a.period - b.period;
          return a.dayType.localeCompare(b.dayType);
        }),
      }))
      .sort((a, b) => a.userName.localeCompare(b.userName));
  };

  const allClassmates = extractClassmates();
  const sharedClassmateIds = new Set(allClassmates.map((c) => c.userId));

  // Filter classmates based on search term
  const searchLower = searchTerm.toLowerCase();
  const filteredClassmates = allClassmates.filter((classmate) => {
    return (
      classmate.userName.toLowerCase().includes(searchLower) ||
      classmate.sharedClasses.some(
        (cls) =>
          cls.courseName.toLowerCase().includes(searchLower) ||
          cls.courseCode.toLowerCase().includes(searchLower) ||
          cls.teacherName.toLowerCase().includes(searchLower)
      )
    );
  });

  // Everyone else (not in any shared class)
  const filteredEveryoneElse = allUsers
    .filter((user) => !sharedClassmateIds.has(user.id))
    .filter((user) => user.name.toLowerCase().includes(searchLower));

  const getPeriodLabel = (period: number, dayType: string) => {
    if (period === 5) return "Advisory";
    const periodNames = ["1st", "2nd", "3rd", "4th"];
    const dayColor =
      dayType === "red"
        ? "text-red-400"
        : dayType === "blue"
        ? "text-blue-400"
        : "text-muted-foreground";
    return (
      <span className="font-mono uppercase tracking-wide">
        {periodNames[period - 1]} •{" "}
        <span className={dayColor}>
          {dayType === "both" ? "Both" : dayType} day
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-4 terminal-animate-in">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search classmates or all users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground font-mono terminal-prompt">
        {filteredClassmates.length} classmates with shared classes,{" "}
        {filteredEveryoneElse.length} other users
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Shared Classmates */}
      <div className="space-y-3">
        {filteredClassmates.length > 0 && (
          <>
            <div className="font-mono uppercase tracking-wide text-primary text-xs pb-1">
              Shared Classes
            </div>
            {filteredClassmates.map((classmate, index) => (
              <Card
                key={classmate.userId}
                className="terminal-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg terminal-header">
                        {classmate.userName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium font-mono uppercase tracking-wide">
                          {classmate.sharedClasses.length} shared class
                          {classmate.sharedClasses.length !== 1 ? "es" : ""}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSchedule(classmate)}
                      className="font-mono uppercase tracking-wide"
                    >
                      <Eye className="h-4 w-4" />
                      View Schedule
                    </Button>
                  </div>
                </CardHeader>
                {classmate.sharedClasses.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {classmate.sharedClasses.map((sharedClass, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/30 border border-border terminal-slide-in"
                          style={{ animationDelay: `${index * 0.02}s` }}
                        >
                          <div>
                            <div className="font-medium text-sm terminal-header">
                              {sharedClass.courseCode === "FREE" ? (
                                <span className="text-muted-foreground italic">
                                  {sharedClass.courseName}
                                </span>
                              ) : (
                                sharedClass.courseName
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {sharedClass.teacherName}
                              {sharedClass.roomNumber &&
                                ` • ${sharedClass.roomNumber}`}
                            </div>
                            {sharedClass.courseCode !== "FREE" && (
                              <div className="text-xs text-muted-foreground font-mono bg-muted/50 px-1 py-0.5 w-fit mt-1">
                                {sharedClass.courseCode}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {getPeriodLabel(
                                sharedClass.period,
                                sharedClass.dayType
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Everyone Else */}
      <div className="space-y-3">
        {filteredEveryoneElse.length > 0 && (
          <>
            <div className="font-mono uppercase tracking-wide text-muted-foreground text-xs pb-1 pt-4">
              Everyone Else
            </div>
            {filteredEveryoneElse.map((user, index) => (
              <Card
                key={user.id}
                className="terminal-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="pb-0 block">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg terminal-header">
                      {user.name}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSchedule(user)}
                      className="font-mono uppercase tracking-wide"
                    >
                      <Eye className="h-4 w-4" />
                      View Schedule
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="lg:max-w-6xl w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wide">
              {selectedClassmate?.userName}'s Schedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingSchedule ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground font-mono terminal-prompt">
                  Loading schedule...
                </div>
              </div>
            ) : classmateSchedule ? (
              <ScheduleDialog scheduleData={classmateSchedule} />
            ) : (
              <div className="text-center text-muted-foreground terminal-list-item py-8">
                No schedule found for this user.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

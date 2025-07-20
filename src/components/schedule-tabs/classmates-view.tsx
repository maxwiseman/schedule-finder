import { useState } from "react";
import { Search, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScheduleData } from "@/lib/use-stream-generation";

interface ClassmatesViewProps {
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

interface ClassmateInfo {
  userId: string;
  userName: string;
  userEmail: string;
  sharedClasses: Array<{
    courseName: string;
    courseCode: string;
    teacherName: string;
    period: number;
    dayType: string;
    roomNumber?: string;
  }>;
}

export function ClassmatesView({
  scheduleData,
  classmates,
}: ClassmatesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

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
          courseName: "Free Period",
          courseCode: "FREE",
          teacherName: "FREE PERIOD",
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
            userEmail: student.userEmail,
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

  // Filter classmates based on search term
  const filteredClassmates = allClassmates.filter((classmate) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      classmate.userName.toLowerCase().includes(searchLower) ||
      classmate.userEmail.toLowerCase().includes(searchLower) ||
      classmate.sharedClasses.some(
        (cls) =>
          cls.courseName.toLowerCase().includes(searchLower) ||
          cls.courseCode.toLowerCase().includes(searchLower) ||
          cls.teacherName.toLowerCase().includes(searchLower)
      )
    );
  });

  const getPeriodLabel = (period: number, dayType: string) => {
    if (period === 5) return "Advisory";
    const periodNames = ["1st", "2nd", "3rd", "4th"];
    const dayColor =
      dayType === "red"
        ? "text-red-600"
        : dayType === "blue"
        ? "text-blue-600"
        : "text-gray-600";
    return (
      <span>
        {periodNames[period - 1]} •{" "}
        <span className={dayColor}>
          {dayType === "both" ? "Both" : dayType} day
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search classmates or shared classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredClassmates.length} of {allClassmates.length} classmates
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Classmates list */}
      <div className="space-y-3">
        {filteredClassmates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                {searchTerm
                  ? "No classmates match your search."
                  : "No classmates found."}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClassmates.map((classmate) => (
            <Card key={classmate.userId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{classmate.userName}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {classmate.userEmail}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {classmate.sharedClasses.length} shared class
                    {classmate.sharedClasses.length !== 1 ? "es" : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {classmate.sharedClasses.map((sharedClass, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {sharedClass.courseName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sharedClass.teacherName}
                          {sharedClass.roomNumber &&
                            ` • ${sharedClass.roomNumber}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sharedClass.courseCode}
                        </div>
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
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

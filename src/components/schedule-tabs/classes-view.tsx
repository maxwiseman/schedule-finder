import { useState } from "react";
import { Search, Users, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScheduleData } from "@/lib/use-stream-generation";

interface ClassesViewProps {
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

interface ClassInfo {
  courseCode: string;
  courseName: string;
  teacherName: string;
  roomNumber?: string;
  period: number;
  dayType: string;
  students: Array<{
    userId: string;
    userName: string;
  }>;
}

export function ClassesView({ scheduleData, classmates }: ClassesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Extract all classes from schedule data
  const extractClasses = (): ClassInfo[] => {
    const classes: ClassInfo[] = [];

    // Helper to add a class
    const addClass = (courseData: any, period: number, dayType: string) => {
      if (!courseData) return;

      const key = `${courseData.courseCode}-${courseData.teacherName}-${period}-${dayType}`;
      const students = classmates[key] || [];

      classes.push({
        courseCode: courseData.courseCode || "",
        courseName: courseData.courseName || "",
        teacherName: courseData.teacherName || "",
        roomNumber: courseData.roomNumber,
        period,
        dayType,
        students: students.map((s) => ({
          userId: s.userId,
          userName: s.userName,
        })),
      });
    };

    // Process regular periods
    const periods = [
      { data: scheduleData.firstPeriod, period: 1 },
      { data: scheduleData.secondPeriod, period: 2 },
      { data: scheduleData.thirdPeriod, period: 3 },
      { data: scheduleData.fourthPeriod, period: 4 },
    ];

    periods.forEach(({ data, period }) => {
      // Handle red day
      if (data?.redDay !== undefined) {
        if (data.redDay === null) {
          // Add free period
          const freeKey = `FREE-FREE PERIOD-${period}-red`;
          const freeStudents = classmates[freeKey] || [];

          classes.push({
            courseCode: "FREE",
            courseName: "Free Period",
            teacherName: "No class scheduled",
            period,
            dayType: "red",
            students: freeStudents.map((s) => ({
              userId: s.userId,
              userName: s.userName,
            })),
          });
        } else {
          addClass(data.redDay, period, "red");
        }
      }

      // Handle blue day
      if (data?.blueDay !== undefined) {
        if (data.blueDay === null) {
          // Add free period
          const freeKey = `FREE-FREE PERIOD-${period}-blue`;
          const freeStudents = classmates[freeKey] || [];

          classes.push({
            courseCode: "FREE",
            courseName: "Free Period",
            teacherName: "No class scheduled",
            period,
            dayType: "blue",
            students: freeStudents.map((s) => ({
              userId: s.userId,
              userName: s.userName,
            })),
          });
        } else {
          addClass(data.blueDay, period, "blue");
        }
      }
    });

    // Process advisory
    if (scheduleData.advisory) {
      const advisoryKey = `ADV-${scheduleData.advisory.teacherName}-5-both`;
      const advisoryStudents = classmates[advisoryKey] || [];

      classes.push({
        courseCode: "ADV",
        courseName: "Advisory",
        teacherName: scheduleData.advisory.teacherName,
        roomNumber: scheduleData.advisory.roomNumber,
        period: 5,
        dayType: "both",
        students: advisoryStudents.map((s) => ({
          userId: s.userId,
          userName: s.userName,
        })),
      });
    }

    return classes;
  };

  const allClasses = extractClasses();

  // Filter classes based on search term
  const filteredClasses = allClasses.filter((classInfo) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      classInfo.courseName.toLowerCase().includes(searchLower) ||
      classInfo.courseCode.toLowerCase().includes(searchLower) ||
      classInfo.teacherName.toLowerCase().includes(searchLower) ||
      classInfo.students.some((student) =>
        student.userName.toLowerCase().includes(searchLower)
      )
    );
  });

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
          placeholder="Search classes, teachers, or students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground font-mono terminal-prompt">
        {filteredClasses.length} of {allClasses.length} classes
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Classes list */}
      <div className="space-y-3">
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground terminal-list-item">
                {searchTerm
                  ? "No classes match your search."
                  : "No classes found."}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((classInfo, index) => (
            <Card
              key={index}
              className="terminal-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg terminal-header">
                  {classInfo.courseCode === "FREE" ? (
                    <span className="text-muted-foreground italic">
                      [FREE PERIOD]
                    </span>
                  ) : (
                    classInfo.courseName
                  )}
                </CardTitle>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-sm text-muted-foreground font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {getPeriodLabel(classInfo.period, classInfo.dayType)}
                  </div>
                  <div>{classInfo.teacherName}</div>
                  {classInfo.roomNumber && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {classInfo.roomNumber}
                    </div>
                  )}
                </div>
                {classInfo.courseCode !== "FREE" && (
                  <div className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 w-fit">
                    {classInfo.courseCode}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {classInfo.students.length === 0 ? (
                  <div className="text-sm text-muted-foreground terminal-list-item">
                    No other students in this class
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium font-mono uppercase tracking-wide">
                        {classInfo.students.length} classmate
                        {classInfo.students.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 bg-muted/30 border border-border terminal-slide-in">
                      {classInfo.students.map((student) => (
                        <div
                          key={student.userId}
                          className="font-medium text-sm font-mono terminal-list-item"
                        >
                          {student.userName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

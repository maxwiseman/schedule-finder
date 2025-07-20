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
      userEmail: string;
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
    userEmail: string;
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
          userEmail: s.userEmail,
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
      if (data?.redDay && data.redDay !== null) {
        addClass(data.redDay, period, "red");
      }
      if (data?.blueDay && data.blueDay !== null) {
        addClass(data.blueDay, period, "blue");
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
          userEmail: s.userEmail,
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
          placeholder="Search classes, teachers, or students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredClasses.length} of {allClasses.length} classes
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Classes list */}
      <div className="space-y-3">
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                {searchTerm
                  ? "No classes match your search."
                  : "No classes found."}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((classInfo, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {classInfo.courseName}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                <div className="text-xs text-muted-foreground">
                  {classInfo.courseCode}
                </div>
              </CardHeader>
              <CardContent>
                {classInfo.students.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No other students in this class
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {classInfo.students.length} classmate
                        {classInfo.students.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {classInfo.students.map((student) => (
                        <div
                          key={student.userId}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {student.userName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {student.userEmail}
                            </div>
                          </div>
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

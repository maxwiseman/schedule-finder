"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Course {
  id: number;
  courseCode: string | null;
  courseName: string;
  teacherName: string;
  roomNumber: string | null;
}

interface Schedule {
  id: number;
  userId: string;
  user: User;
}

interface Enrollment {
  id: number;
  scheduleId: number;
  courseId: number;
  period: number;
  dayType: string;
  course: Course;
  schedule: Schedule;
}

interface DatabaseData {
  users: User[];
  courses: Course[];
  schedules: Schedule[];
  enrollments: Enrollment[];
}

export default function DbPageClient() {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/test/db");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const clearDatabase = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all test data? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/test/db", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to clear database");
      }
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl bg-background min-h-screen">
      <Card className="mb-6 terminal-animate-in">
        <CardHeader>
          <CardTitle>Database Test Viewer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchData} disabled={loading}>
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
            <Button
              variant="destructive"
              onClick={clearDatabase}
              disabled={loading}
            >
              Clear All Data
            </Button>
          </div>
          <p className="text-sm text-muted-foreground font-mono terminal-prompt">
            View all database contents for testing purposes.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive terminal-slide-in">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive font-mono">{error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <Card
            className="terminal-slide-in"
            style={{ animationDelay: "0.5s" }}
          >
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center border border-border p-4">
                  <div className="text-2xl font-bold font-mono text-primary">
                    {data.users.length}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
                    Users
                  </div>
                </div>
                <div className="text-center border border-border p-4">
                  <div className="text-2xl font-bold font-mono text-primary">
                    {data.courses.length}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
                    Courses
                  </div>
                </div>
                <div className="text-center border border-border p-4">
                  <div className="text-2xl font-bold font-mono text-primary">
                    {data.schedules.length}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
                    Schedules
                  </div>
                </div>
                <div className="text-center border border-border p-4">
                  <div className="text-2xl font-bold font-mono text-primary">
                    {data.enrollments.length}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
                    Enrollments
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users */}
          <Card
            className="terminal-slide-in"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader>
              <CardTitle>Users ({data.users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.users.length === 0 ? (
                <p className="text-muted-foreground font-mono terminal-list-item">
                  No users found
                </p>
              ) : (
                <div className="space-y-2">
                  {data.users.map((user, index) => (
                    <div
                      key={user.id}
                      className="border border-border p-3 terminal-slide-in"
                      style={{ animationDelay: `${0.05 * index}s` }}
                    >
                      <div className="font-medium font-mono">{user.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        <span className="text-primary">ID:</span> {user.id} •{" "}
                        <span className="text-primary">Created:</span>{" "}
                        {new Date(user.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Courses */}
          <Card
            className="terminal-slide-in"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader>
              <CardTitle>Courses ({data.courses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.courses.length === 0 ? (
                <p className="text-muted-foreground font-mono terminal-list-item">
                  No courses found
                </p>
              ) : (
                <div className="space-y-2">
                  {data.courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="border border-border p-3 terminal-slide-in"
                      style={{ animationDelay: `${0.05 * index}s` }}
                    >
                      <div className="font-medium font-mono">
                        {course.courseName}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        <span className="text-primary">Teacher:</span>{" "}
                        {course.teacherName}
                        {course.roomNumber && (
                          <>
                            {" "}
                            • <span className="text-primary">Room:</span>{" "}
                            {course.roomNumber}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        <span className="text-primary">Code:</span>{" "}
                        {course.courseCode || "N/A"} •{" "}
                        <span className="text-primary">ID:</span> {course.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedules */}
          <Card
            className="terminal-slide-in"
            style={{ animationDelay: "0.3s" }}
          >
            <CardHeader>
              <CardTitle>Schedules ({data.schedules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.schedules.length === 0 ? (
                <p className="text-muted-foreground font-mono terminal-list-item">
                  No schedules found
                </p>
              ) : (
                <div className="space-y-2">
                  {data.schedules.map((schedule, index) => (
                    <div
                      key={schedule.id}
                      className="border border-border p-3 terminal-slide-in"
                      style={{ animationDelay: `${0.05 * index}s` }}
                    >
                      <div className="font-medium font-mono">
                        <span className="text-primary">Schedule ID:</span>{" "}
                        {schedule.id}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        <span className="text-primary">User:</span>{" "}
                        {schedule.user?.name} ({schedule.user?.email})
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        <span className="text-primary">User ID:</span>{" "}
                        {schedule.userId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollments */}
          <Card
            className="terminal-slide-in"
            style={{ animationDelay: "0.4s" }}
          >
            <CardHeader>
              <CardTitle>Enrollments ({data.enrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.enrollments.length === 0 ? (
                <p className="text-muted-foreground font-mono terminal-list-item">
                  No enrollments found
                </p>
              ) : (
                <div className="space-y-2">
                  {data.enrollments.map((enrollment, index) => (
                    <div
                      key={enrollment.id}
                      className="border border-border p-3 terminal-slide-in"
                      style={{ animationDelay: `${0.05 * index}s` }}
                    >
                      <div className="font-medium font-mono">
                        {enrollment.course.courseName}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        <span className="text-primary">Period</span>{" "}
                        {enrollment.period} •{" "}
                        <span
                          className={
                            enrollment.dayType === "red"
                              ? "text-red-400"
                              : enrollment.dayType === "blue"
                              ? "text-blue-400"
                              : "text-muted-foreground"
                          }
                        >
                          {enrollment.dayType}
                        </span>{" "}
                        day
                        <br />
                        <span className="text-primary">Teacher:</span>{" "}
                        {enrollment.course.teacherName}
                        {enrollment.course.roomNumber && (
                          <>
                            {" "}
                            • <span className="text-primary">Room:</span>{" "}
                            {enrollment.course.roomNumber}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        <span className="text-primary">Student:</span>{" "}
                        {enrollment?.schedule?.user?.name} •{" "}
                        <span className="text-primary">Course Code:</span>{" "}
                        {enrollment.course.courseCode || "N/A"} •{" "}
                        <span className="text-primary">Enrollment ID:</span>{" "}
                        {enrollment.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

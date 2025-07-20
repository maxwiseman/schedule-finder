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
    <div className="container mx-auto p-8 max-w-6xl">
      <Card className="mb-6">
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
          <p className="text-sm text-gray-600">
            View all database contents for testing purposes.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({data.users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.users.length === 0 ? (
                <p className="text-gray-500">No users found</p>
              ) : (
                <div className="space-y-2">
                  {data.users.map((user) => (
                    <div key={user.id} className="border rounded p-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500">
                        ID: {user.id} • Created:{" "}
                        {new Date(user.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Courses ({data.courses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.courses.length === 0 ? (
                <p className="text-gray-500">No courses found</p>
              ) : (
                <div className="space-y-2">
                  {data.courses.map((course) => (
                    <div key={course.id} className="border rounded p-3">
                      <div className="font-medium">{course.courseName}</div>
                      <div className="text-sm text-gray-600">
                        Teacher: {course.teacherName}
                        {course.roomNumber && ` • Room: ${course.roomNumber}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Code: {course.courseCode || "N/A"} • ID: {course.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedules */}
          <Card>
            <CardHeader>
              <CardTitle>Schedules ({data.schedules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.schedules.length === 0 ? (
                <p className="text-gray-500">No schedules found</p>
              ) : (
                <div className="space-y-2">
                  {data.schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded p-3">
                      <div className="font-medium">
                        Schedule ID: {schedule.id}
                      </div>
                      <div className="text-sm text-gray-600">
                        User: {schedule.user.name} ({schedule.user.email})
                      </div>
                      <div className="text-xs text-gray-500">
                        User ID: {schedule.userId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollments ({data.enrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.enrollments.length === 0 ? (
                <p className="text-gray-500">No enrollments found</p>
              ) : (
                <div className="space-y-2">
                  {data.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border rounded p-3">
                      <div className="font-medium">
                        {enrollment.course.courseName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Period {enrollment.period} • {enrollment.dayType} day
                        <br />
                        Teacher: {enrollment.course.teacherName}
                        {enrollment.course.roomNumber &&
                          ` • Room: ${enrollment.course.roomNumber}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Student: {enrollment.schedule.user.name} • Course Code:{" "}
                        {enrollment.course.courseCode || "N/A"} • Enrollment ID:{" "}
                        {enrollment.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.users.length}</div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {data.courses.length}
                  </div>
                  <div className="text-sm text-gray-600">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {data.schedules.length}
                  </div>
                  <div className="text-sm text-gray-600">Schedules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {data.enrollments.length}
                  </div>
                  <div className="text-sm text-gray-600">Enrollments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

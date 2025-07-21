import { Calendar, BookOpen, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleView } from "./schedule-view";
import { ClassesView } from "./classes-view";
import { ClassmatesView } from "./classmates-view";
import type { ScheduleData } from "@/lib/use-stream-generation";

interface ScheduleTabsProps {
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

export function ScheduleTabs({ scheduleData, classmates }: ScheduleTabsProps) {
  return (
    <Tabs defaultValue="schedule" className="w-full terminal-animate-in">
      <TabsList className=" w-full h-auto py-1 bg-muted/50 border border-border">
        <TabsTrigger
          value="schedule"
          className="flex items-center py-1.5 gap-2 font-mono uppercase tracking-wide dark:data-[state=active]:bg-primary dark:data-[state=active]:text-background"
        >
          <Calendar className="h-4 w-4" />
          Schedule
        </TabsTrigger>
        <TabsTrigger
          value="classes"
          className="flex items-center py-1.5 gap-2 font-mono uppercase tracking-wide dark:data-[state=active]:bg-primary dark:data-[state=active]:text-background"
        >
          <BookOpen className="h-4 w-4" />
          Classes
        </TabsTrigger>
        <TabsTrigger
          value="classmates"
          className="flex items-center py-1.5 gap-2 font-mono uppercase tracking-wide dark:data-[state=active]:bg-primary dark:data-[state=active]:text-background"
        >
          <Users className="h-4 w-4" />
          Classmates
        </TabsTrigger>
      </TabsList>

      <TabsContent value="schedule" className="mt-6">
        <ScheduleView scheduleData={scheduleData} classmates={classmates} />
      </TabsContent>

      <TabsContent value="classes" className="mt-6">
        <ClassesView scheduleData={scheduleData} classmates={classmates} />
      </TabsContent>

      <TabsContent value="classmates" className="mt-6">
        <ClassmatesView scheduleData={scheduleData} classmates={classmates} />
      </TabsContent>
    </Tabs>
  );
}

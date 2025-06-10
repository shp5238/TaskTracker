import { useState } from "react";
import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { TodoList } from "@/components/todo-list";
import { CalendarView } from "@/components/calendar-view";
import { Notepad } from "@/components/notepad";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">TaskFlow</h1>
          </div>
          
          <PomodoroTimer />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="todos" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="todos" className="flex items-center gap-2">
                <i className="fas fa-list-check text-sm"></i>
                Todo List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <i className="fas fa-calendar text-sm"></i>
                Calendar
              </TabsTrigger>
              <TabsTrigger value="notepad" className="flex items-center gap-2">
                <i className="fas fa-sticky-note text-sm"></i>
                Notepad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos">
              <TodoList />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView />
            </TabsContent>

            <TabsContent value="notepad">
              <Notepad />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

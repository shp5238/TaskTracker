import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@shared/schema";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days from previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevMonthDay, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Add empty cells for days from next month to complete the grid
    const remainingCells = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    const upcoming = tasks
      .filter(task => task.dueDate && new Date(task.dueDate) >= today && !task.completed)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
    return upcoming;
  };

  const days = getDaysInMonth(currentDate);
  const upcomingTasks = getUpcomingTasks();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{getMonthName(currentDate)}</h2>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days.map((day, index) => {
              const dayTasks = getTasksForDate(day.date);
              const isCurrentDay = isToday(day.date);
              
              return (
                <div
                  key={index}
                  className={`min-h-20 p-2 border hover:bg-muted cursor-pointer ${
                    isCurrentDay ? 'bg-primary/10 border-primary' : 'bg-card'
                  }`}
                >
                  <div className={`text-sm ${
                    day.isCurrentMonth 
                      ? isCurrentDay 
                        ? 'text-primary font-semibold' 
                        : 'text-foreground'
                      : 'text-muted-foreground'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  {isCurrentDay && (
                    <div className="text-xs text-primary">Today</div>
                  )}
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          task.completed
                            ? 'bg-green-100 text-green-800'
                            : new Date(task.dueDate!) < new Date()
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks Sidebar */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Upcoming Tasks</h3>
          {upcomingTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming tasks</p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(task => {
                const isOverdue = new Date(task.dueDate!) < new Date();
                return (
                  <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                    <div className={`w-3 h-3 rounded-full ${
                      isOverdue ? 'bg-destructive' : 'bg-orange-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.dueDate!).toLocaleDateString()} - {isOverdue ? 'Overdue' : 'Due soon'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

export function useTaskReminders() {
  const { toast } = useToast();
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      tasks.forEach(task => {
        if (task.completed || !task.dueDate) return;

        const dueDate = new Date(task.dueDate);
        const timeUntilDue = dueDate.getTime() - now.getTime();
        const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

        // Show notification for tasks due within 24 hours
        if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
          const reminderKey = `reminder-${task.id}-${task.dueDate}`;
          const alreadyNotified = localStorage.getItem(reminderKey);

          if (!alreadyNotified) {
            const message = hoursUntilDue <= 1 
              ? `Task "${task.title}" is due in less than 1 hour!`
              : `Task "${task.title}" is due in ${Math.ceil(hoursUntilDue)} hours`;

            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: message,
                icon: '/favicon.ico',
              });
            }

            // Show toast notification
            toast({
              title: "Task Reminder",
              description: message,
              duration: 5000,
            });

            // Mark as notified
            localStorage.setItem(reminderKey, 'true');
          }
        }

        // Show overdue notifications
        if (timeUntilDue < 0) {
          const overdueKey = `overdue-${task.id}-${task.dueDate}`;
          const alreadyNotified = localStorage.getItem(overdueKey);

          if (!alreadyNotified) {
            const daysOverdue = Math.ceil(Math.abs(timeUntilDue) / (1000 * 60 * 60 * 24));
            const message = `Task "${task.title}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue!`;

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Overdue Task', {
                body: message,
                icon: '/favicon.ico',
              });
            }

            toast({
              title: "Overdue Task",
              description: message,
              variant: "destructive",
              duration: 8000,
            });

            localStorage.setItem(overdueKey, 'true');
          }
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every 30 minutes
    const interval = setInterval(checkReminders, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, toast]);

  return { tasks };
}
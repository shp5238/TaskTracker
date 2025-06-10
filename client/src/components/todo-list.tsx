import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Calendar, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, InsertTask } from "@shared/schema";

export function TodoList() {
  const [newTask, setNewTask] = useState<InsertTask>({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: "",
    completed: false,
  });
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("created");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: InsertTask) => apiRequest("POST", "/api/tasks", task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTask({ title: "", description: "", dueDate: "", assignedTo: "", completed: false });
      toast({ title: "Task created successfully" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertTask> }) =>
      apiRequest("PUT", `/api/tasks/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      createTaskMutation.mutate(newTask);
    }
  };

  const toggleTask = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { completed: !task.completed },
    });
  };

  const deleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const getTaskStatus = (task: Task) => {
    if (task.completed) return "completed";
    if (task.dueDate && new Date(task.dueDate) < new Date()) return "overdue";
    if (task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) return "due-soon";
    return "normal";
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (filter === "all") return true;
      if (filter === "pending") return !task.completed;
      if (filter === "completed") return task.completed;
      if (filter === "overdue") return getTaskStatus(task) === "overdue";
      return true;
    })
    .sort((a, b) => {
      if (sort === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "dueDate") return (a.dueDate || "").localeCompare(b.dueDate || "");
      if (sort === "assignee") return (a.assignedTo || "").localeCompare(b.assignedTo || "");
      return 0;
    });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Add Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <Input
                placeholder="Add a new task..."
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="flex-1"
              />
              <Button type="submit" disabled={createTaskMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Description</label>
                <Textarea
                  placeholder="Optional description..."
                  rows={2}
                  value={newTask.description || ""}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Due Date</label>
                <Input
                  type="date"
                  value={newTask.dueDate || ""}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Assign To</label>
                <Select value={newTask.assignedTo || ""} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="myself">Myself</SelectItem>
                    <SelectItem value="john-doe">John Doe</SelectItem>
                    <SelectItem value="jane-smith">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center space-x-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Sort by Created</SelectItem>
              <SelectItem value="dueDate">Sort by Due Date</SelectItem>
              <SelectItem value="assignee">Sort by Assignee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-500">
          {taskStats.total} tasks, {taskStats.completed} completed
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredAndSortedTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No tasks found. Create your first task above!</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedTasks.map((task) => {
            const status = getTaskStatus(task);
            return (
              <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.completed ? 'opacity-75' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium text-gray-900 ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {status === "overdue" && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                          {status === "due-soon" && (
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Due Soon</Badge>
                          )}
                          {status === "completed" && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {task.description && (
                        <p className={`text-sm text-gray-600 mt-1 ${task.completed ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        {task.dueDate && (
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

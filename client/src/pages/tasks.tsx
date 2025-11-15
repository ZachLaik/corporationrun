import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckSquare, FileText, Users, Scale } from "lucide-react";
import type { Task } from "@shared/schema";

const categoryIcons: Record<string, React.ReactNode> = {
  Documents: <FileText className="h-4 w-4" />,
  KYC: <Users className="h-4 w-4" />,
  Jurisdiction: <Scale className="h-4 w-4" />,
};

export default function TasksPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return <div className="flex-1 p-8">Loading...</div>;
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="flex-1 p-8 space-y-8 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Track incorporation progress and requirements
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <CheckSquare className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-pending-tasks">{pendingTasks.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <CheckSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-inprogress-tasks">{inProgressTasks.length}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-completed-tasks">{completedTasks.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <CheckSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              No pending tasks at the moment. The system will automatically create tasks as you progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                {categoryIcons[category] || <CheckSquare className="h-4 w-4" />}
                <h2 className="text-section font-semibold">{category}</h2>
                <span className="text-sm text-muted-foreground">({categoryTasks.length})</span>
              </div>

              <div className="space-y-3">
                {categoryTasks.map((task) => (
                  <Card key={task.id} className="hover-elevate" data-testid={`task-${task.id}`}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Checkbox
                        checked={task.status === 'completed'}
                        className="h-5 w-5"
                        data-testid={`checkbox-task-${task.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.description}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {task.assigneeId && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              U
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <StatusBadge status={task.status || 'pending'} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

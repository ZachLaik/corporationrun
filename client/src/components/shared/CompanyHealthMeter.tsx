import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface CompanyHealthMeterProps {
  score: number;
  missingItems: string[];
  pendingTasks: string[];
}

export function CompanyHealthMeter({ score, missingItems, pendingTasks }: CompanyHealthMeterProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 50) return "Good Progress";
    return "Needs Attention";
  };

  return (
    <Card data-testid="company-health-meter">
      <CardHeader>
        <CardTitle className="text-card-title">Company Health</CardTitle>
        <CardDescription>Track your incorporation progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="stroke-muted"
                strokeWidth="8"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              <circle
                className={`stroke-current ${getScoreColor(score)} transition-all duration-500`}
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
                style={{
                  strokeDasharray: `${2 * Math.PI * 42}`,
                  strokeDashoffset: `${2 * Math.PI * 42 * (1 - score / 100)}`,
                }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-3xl font-bold ${getScoreColor(score)}`} data-testid="health-score">
                {score}%
              </span>
              <span className="text-xs text-muted-foreground">
                {getScoreLabel(score)}
              </span>
            </div>
          </div>
          <Progress value={score} className="w-full" />
        </div>

        {missingItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span>Missing Items ({missingItems.length})</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {missingItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>Pending Tasks ({pendingTasks.length})</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {pendingTasks.slice(0, 3).map((task, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{task}</span>
                </li>
              ))}
              {pendingTasks.length > 3 && (
                <li className="text-xs text-muted-foreground italic">
                  +{pendingTasks.length - 3} more tasks
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

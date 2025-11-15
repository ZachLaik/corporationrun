import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Send } from "lucide-react";

type StatusType = 'drafting' | 'validating' | 'signing' | 'active' | 'pending' | 'sent' | 'signed' | 'invited' | 'pending_signature' | 'in_progress' | 'completed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: React.ReactNode }> = {
  drafting: {
    label: "Drafting",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />
  },
  validating: {
    label: "Validating",
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />
  },
  signing: {
    label: "Signing",
    variant: "outline",
    icon: <Send className="h-3 w-3" />
  },
  active: {
    label: "Active",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3 text-green-600" />
  },
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />
  },
  sent: {
    label: "Sent",
    variant: "outline",
    icon: <Send className="h-3 w-3" />
  },
  signed: {
    label: "Signed",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3 text-green-600" />
  },
  invited: {
    label: "Invited",
    variant: "secondary",
    icon: <Send className="h-3 w-3" />
  },
  pending_signature: {
    label: "Pending Signature",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />
  },
  in_progress: {
    label: "In Progress",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3 text-green-600" />
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`} data-testid={`status-${status}`}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

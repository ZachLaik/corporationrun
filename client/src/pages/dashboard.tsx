import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CompanyHealthMeter } from "@/components/shared/CompanyHealthMeter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus, FileText, Users, TrendingUp, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Company, Founder, Document } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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

  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["/api/company"],
    enabled: isAuthenticated,
  });

  const { data: founders = [] } = useQuery<Founder[]>({
    queryKey: ["/api/founders"],
    enabled: isAuthenticated && !!company,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated && !!company,
  });

  if (authLoading || companyLoading) {
    return (
      <div className="flex-1 p-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle>Welcome to incorporate.run</CardTitle>
            <CardDescription>
              Let's get started by creating your first company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => setLocation("/create-company")} data-testid="button-create-company" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Company
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const missingItems = [
    ...(!founders || founders.length === 0 ? ["Add founders to your team"] : []),
    ...(documents.filter(d => d.status === 'drafting').length > 0 ? ["Complete document drafts"] : []),
    ...(documents.filter(d => d.status === 'signing').length > 0 ? ["Pending signatures on documents"] : []),
  ];

  const pendingTasks = [
    ...founders.filter(f => f.status === 'invited').map(f => `${f.firstName || f.email} needs to accept invite`),
    ...documents.filter(d => d.status === 'signing').map(d => `Collect signatures for ${d.title}`),
  ];

  const healthScore = Math.max(0, 100 - (missingItems.length * 15 + pendingTasks.length * 10));

  return (
    <div className="flex-1 p-8 space-y-8 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page font-bold" data-testid="page-title">
            {company.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {company.jurisdiction === 'delaware' ? 'Delaware C-Corp' : 'France SAS'}
          </p>
        </div>
        <Button onClick={() => setLocation("/chat")} data-testid="button-ask-ai">
          Ask AI Assistant
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Founders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-founders">{founders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {founders.filter(f => f.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-documents">{documents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {documents.filter(d => d.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-tasks">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-health">{healthScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {healthScore >= 80 ? "Excellent" : healthScore >= 50 ? "Good" : "Needs work"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Founders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Founders</CardTitle>
                <CardDescription>Team members and equity holders</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.location.href = "/founders"} data-testid="button-view-founders">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {founders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No founders added yet</p>
                  <Button size="sm" className="mt-4" onClick={() => window.location.href = "/founders"} data-testid="button-add-founder">
                    Add Founder
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {founders.slice(0, 3).map((founder) => (
                    <div key={founder.id} className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate" data-testid={`founder-${founder.id}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {(founder.firstName?.[0] || founder.email[0]).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{founder.firstName} {founder.lastName}</p>
                          <p className="text-xs text-muted-foreground">{founder.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {founder.equityPercentage && (
                          <span className="text-sm font-medium">{founder.equityPercentage}%</span>
                        )}
                        <StatusBadge status={founder.status || 'invited'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Latest legal documents and contracts</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.location.href = "/contracts"} data-testid="button-view-contracts">
                View Library
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents created yet</p>
                  <Button size="sm" className="mt-4" onClick={() => window.location.href = "/contracts"} data-testid="button-create-document">
                    Create Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate" data-testid={`document-${doc.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={doc.status || 'drafting'} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CompanyHealthMeter
            score={healthScore}
            missingItems={missingItems}
            pendingTasks={pendingTasks}
          />
        </div>
      </div>
    </div>
  );
}

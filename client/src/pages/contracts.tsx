import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FileText, Shield, UserCheck, Handshake, Globe, FileCheck, Briefcase, DollarSign, Building2 } from "lucide-react";
import type { Document } from "@shared/schema";

const documentCategories = {
  "pre-startup": {
    label: "Pre-Startup",
    icon: Shield,
    templates: [
      { type: 'nda', title: 'NDA (Mutual)', description: 'Protect confidential information shared between parties' },
      { type: 'pre_founder_agreement', title: 'Pre-Founder Agreement', description: 'Define roles, vesting, and commitments' },
      { type: 'ip_assignment', title: 'IP Assignment', description: 'Assign intellectual property to the company' },
      { type: 'advisor_agreement', title: 'Advisor Agreement', description: 'Formalize advisor relationships and compensation' },
    ]
  },
  "website": {
    label: "Website & Marketing",
    icon: Globe,
    templates: [
      { type: 'terms_conditions', title: 'Terms & Conditions', description: 'Legal terms for your website or app' },
      { type: 'privacy_policy', title: 'Privacy Policy', description: 'Explain how you collect and use data' },
    ]
  },
  "work": {
    label: "Work & Collaboration",
    icon: Briefcase,
    templates: [
      { type: 'contractor_agreement', title: 'Contractor Agreement', description: 'Engage freelancers and contractors' },
    ]
  },
  "fundraising": {
    label: "Raising Money",
    icon: DollarSign,
    templates: [
      { type: 'safe', title: 'SAFE', description: 'Simple Agreement for Future Equity' },
    ]
  },
};

export default function ContractsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("pre-startup");

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

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return <div className="flex-1 p-8">Loading...</div>;
  }

  return (
    <div className="flex-1 p-8 space-y-8 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page font-bold">Contracts Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse templates and manage your legal documents
          </p>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          {Object.entries(documentCategories).map(([key, category]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2" data-testid={`tab-${key}`}>
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(documentCategories).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {category.templates.map((template) => {
                const existingDoc = documents.find(d => d.type === template.type);
                
                return (
                  <Card key={template.type} className="hover-elevate active-elevate-2" data-testid={`template-${template.type}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.title}</CardTitle>
                            <CardDescription className="mt-1">{template.description}</CardDescription>
                          </div>
                        </div>
                        {existingDoc && (
                          <StatusBadge status={existingDoc.status || 'drafting'} />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {existingDoc ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Created</span>
                            <span>{new Date(existingDoc.createdAt!).toLocaleDateString()}</span>
                          </div>
                          <Button variant="outline" className="w-full" data-testid={`button-view-${template.type}`}>
                            View Document
                          </Button>
                        </div>
                      ) : (
                        <Button className="w-full" data-testid={`button-draft-${template.type}`}>
                          Draft {template.title}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {documents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-section font-semibold">Your Documents</h2>
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover-elevate" data-testid={`document-${doc.id}`}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={doc.status || 'drafting'} />
                    <Button size="sm" variant="outline" data-testid={`button-open-${doc.id}`}>
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Scale, FileText, Shield } from "lucide-react";
import type { Company, Document } from "@shared/schema";

const incorporationDocs = {
  delaware: [
    { type: 'certificate_incorporation', title: 'Certificate of Incorporation', description: 'Legal formation document for Delaware C-Corp' },
    { type: 'bylaws', title: 'Bylaws', description: 'Internal governance rules and procedures' },
    { type: 'board_consent', title: 'First Board Consent', description: 'Initial board resolutions and officer appointments' },
  ],
  france: [
    { type: 'certificate_incorporation', title: 'Statuts (Articles of Association)', description: 'Legal formation document for France SAS' },
    { type: 'bylaws', title: 'Règlement Intérieur', description: 'Internal regulations and governance' },
    { type: 'board_consent', title: 'Décision du Président', description: 'Founding decisions and appointments' },
  ],
};

export default function IncorporationPage() {
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

  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["/api/company"],
    enabled: isAuthenticated,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated && !!company,
  });

  if (authLoading || companyLoading) {
    return <div className="flex-1 p-8">Loading...</div>;
  }

  if (!company) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Please create a company first</p>
            <Button className="mt-4" onClick={() => window.location.href = "/create-company"}>
              Create Company
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docs = incorporationDocs[company.jurisdiction as keyof typeof incorporationDocs] || [];
  const jurisdictionName = company.jurisdiction === 'delaware' ? 'Delaware C-Corp' : 'France SAS';

  return (
    <div className="flex-1 p-8 space-y-8 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page font-bold">Incorporation</h1>
          <p className="text-muted-foreground mt-1">
            Complete your {jurisdictionName} incorporation documents
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Selected Jurisdiction</CardTitle>
              <CardDescription className="mt-1">
                {company.jurisdiction === 'delaware' ? '🇺🇸 ' : '🇫🇷 '}
                {jurisdictionName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-green-600 dark:text-green-400">Benefits</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {company.jurisdiction === 'delaware' ? (
                  <>
                    <li>• Lower corporate tax (21%)</li>
                    <li>• Startup/investor-friendly</li>
                    <li>• Default for most VC-backed companies</li>
                  </>
                ) : (
                  <>
                    <li>• Flexible governance</li>
                    <li>• Easy to hire in EU</li>
                    <li>• Standard for French founders</li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2 text-yellow-600 dark:text-yellow-400">Considerations</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {company.jurisdiction === 'delaware' ? (
                  <>
                    <li>• Annual franchise tax required</li>
                    <li>• Need registered agent</li>
                    <li>• State filing fees apply</li>
                  </>
                ) : (
                  <>
                    <li>• Higher corporate tax rates</li>
                    <li>• More local compliance required</li>
                    <li>• French language documents</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-section font-semibold">Required Documents</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {docs.map((doc) => {
            const existingDoc = documents.find(d => d.type === doc.type);

            return (
              <Card key={doc.type} className="hover-elevate active-elevate-2" data-testid={`incorporation-doc-${doc.type}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{doc.title}</CardTitle>
                        <CardDescription className="mt-1">{doc.description}</CardDescription>
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
                      <Button variant="outline" className="w-full" data-testid={`button-view-${doc.type}`}>
                        View Document
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full" data-testid={`button-draft-${doc.type}`}>
                      Draft {doc.title}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Ready to Incorporate?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Before submitting your incorporation documents, make sure you have:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>All founders added with equity allocations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Pre-Founder Agreement signed by all founders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>IP Assignment documents completed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>All incorporation documents reviewed and signed</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

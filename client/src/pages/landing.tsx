import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, FileText, Users, TrendingUp, MessageSquare, CheckCircle2 } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: FileText,
      title: "Smart Documents",
      description: "AI-powered legal document drafting with built-in validation"
    },
    {
      icon: Users,
      title: "Founder Management",
      description: "Track equity, roles, and signature status in one place"
    },
    {
      icon: TrendingUp,
      title: "Investor Tools",
      description: "SAFE documents, cap table, and fundraising management"
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "Voice-first interface to query and manage your startup"
    },
    {
      icon: Scale,
      title: "Multi-Jurisdiction",
      description: "Support for Delaware C-Corp and France SAS incorporation"
    },
    {
      icon: CheckCircle2,
      title: "E-Signatures",
      description: "Magic-link email signatures with real-time tracking"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 mb-8">
              <Scale className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Voice-First Legal OS for Startups</span>
            </div>
            <h1 className="text-page font-bold tracking-tight text-foreground sm:text-6xl mb-6">
              Form and organize your startup
              <br />
              <span className="text-primary">as intuitive as a conversation</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Every legal document flows through Draft → Validate → Sign → Activate → Remember.
              AI agents handle the complexity while you stay in control.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
                className="h-12 px-8"
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                data-testid="button-learn-more"
                className="h-12 px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-section font-bold tracking-tight text-foreground">
              Everything you need to incorporate
            </h2>
            <p className="mt-4 text-muted-foreground">
              Professional legal tools designed to make startup formation delightful
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover-elevate active-elevate-2">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-card-title">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-body">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Card className="overflow-hidden bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-section font-bold mb-4">
                Ready to incorporate your startup?
              </h2>
              <p className="mx-auto max-w-2xl text-lg mb-8 text-primary-foreground/90">
                Join founders using AI-powered legal tools to handle incorporation, equity, and fundraising.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-cta-login"
                className="h-12 px-8"
              >
                Start for Free
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-semibold">incorporate.run</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 incorporate.run. Voice-first legal OS for startups.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

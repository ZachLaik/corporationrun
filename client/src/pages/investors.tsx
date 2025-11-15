import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvestorSchema } from "@shared/schema";
import { z } from "zod";
import type { Investor } from "@shared/schema";

const formSchema = insertInvestorSchema.omit({
  companyId: true, // Backend adds companyId automatically
  status: true, // Backend sets status
}).extend({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

type FormData = z.infer<typeof formSchema>;

export default function InvestorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/api/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast, setLocation]);

  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
    enabled: isAuthenticated,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      amount: "" as any, // Will be coerced to number
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/investors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      toast({
        title: "Success!",
        description: "Investor added successfully.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/api/login");
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    createMutation.mutate(data);
  };

  if (authLoading || isLoading) {
    return <div className="flex-1 p-8">Loading...</div>;
  }

  const totalInvestment = investors.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="flex-1 p-8 space-y-8 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page font-bold">Investors</h1>
          <p className="text-muted-foreground mt-1">
            Manage SAFE agreements and cap table
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-investor">
              <Plus className="h-4 w-4 mr-2" />
              Add Investor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Investor</DialogTitle>
              <DialogDescription>
                Create a SAFE agreement for a new investor
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Investor" {...field} value={field.value || ""} data-testid="input-investor-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="investor@example.com" {...field} value={field.value || ""} data-testid="input-investor-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} value={field.value ?? ""} data-testid="input-investor-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-investor">
                  {createMutation.isPending ? "Adding..." : "Add Investor & Generate SAFE"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-investment">
              ${totalInvestment.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {investors.length} investor{investors.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active SAFEs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="active-safes">
              {investors.filter(i => i.status === 'signed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {investors.filter(i => i.status === 'pending').length} pending signature{investors.filter(i => i.status === 'pending').length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {investors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <TrendingUp className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No investors yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Add investors to generate SAFE documents and manage your cap table
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-investor">
              <Plus className="h-4 w-4 mr-2" />
              Add First Investor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {investors.map((investor) => (
            <Card key={investor.id} className="hover-elevate active-elevate-2" data-testid={`investor-card-${investor.id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {investor.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{investor.name}</CardTitle>
                    <CardDescription className="truncate">{investor.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {investor.amount && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">${investor.amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={investor.status || 'pending'} />
                  {investor.safeDocumentId && (
                    <Button size="sm" variant="ghost" data-testid={`button-view-safe-${investor.id}`}>
                      View SAFE
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

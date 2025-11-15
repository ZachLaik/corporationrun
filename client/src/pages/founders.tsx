import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Mail, User, Briefcase, Percent } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFounderSchema } from "@shared/schema";
import { z } from "zod";
import type { Founder } from "@shared/schema";

const formSchema = insertFounderSchema.extend({
  email: z.string().email("Invalid email address"),
  equityPercentage: z.coerce.number().min(0).max(100).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function FoundersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: founders = [], isLoading } = useQuery<Founder[]>({
    queryKey: ["/api/founders"],
    enabled: isAuthenticated,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "",
      equityPercentage: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/founders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founders"] });
      toast({
        title: "Success!",
        description: "Founder invited successfully.",
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
          window.location.href = "/api/login";
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
    createMutation.mutate(data);
  };

  if (authLoading || isLoading) {
    return <div className="flex-1 p-8">Loading...</div>;
  }

  return (
    <div className="flex-1 p-8 space-y-8 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page font-bold">Founders</h1>
          <p className="text-muted-foreground mt-1">
            Manage your founding team and equity allocation
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-founder">
              <Plus className="h-4 w-4 mr-2" />
              Add Founder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Founder</DialogTitle>
              <DialogDescription>
                Invite a new founder to your team
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="founder@example.com" {...field} data-testid="input-founder-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} value={field.value || ""} data-testid="input-founder-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} value={field.value || ""} data-testid="input-founder-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="CEO, CTO, etc." {...field} value={field.value || ""} data-testid="input-founder-role" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="equityPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equity Percentage</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="25" {...field} data-testid="input-founder-equity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-founder">
                  {createMutation.isPending ? "Adding..." : "Add Founder"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {founders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No founders yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Add founding team members to track equity, roles, and manage signatures
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-founder">
              <Plus className="h-4 w-4 mr-2" />
              Add First Founder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {founders.map((founder) => (
            <Card key={founder.id} className="hover-elevate active-elevate-2" data-testid={`founder-card-${founder.id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {(founder.firstName?.[0] || founder.email[0]).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {founder.firstName && founder.lastName
                        ? `${founder.firstName} ${founder.lastName}`
                        : founder.email}
                    </CardTitle>
                    <CardDescription className="truncate">{founder.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {founder.role && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{founder.role}</span>
                  </div>
                )}
                {founder.equityPercentage !== null && founder.equityPercentage !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span>{founder.equityPercentage}% Equity</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={founder.status || 'invited'} />
                  {founder.idUploaded && (
                    <span className="text-xs text-green-600 dark:text-green-400">ID Verified</span>
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

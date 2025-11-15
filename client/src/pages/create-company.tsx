import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Flag } from "lucide-react";
import { insertCompanySchema } from "@shared/schema";

const formSchema = insertCompanySchema.extend({
  jurisdiction: z.enum(['delaware', 'france']),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateCompany() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      jurisdiction: "delaware",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/company", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Success!",
        description: "Your company has been created successfully.",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
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

  const jurisdictionData = {
    delaware: {
      name: "Delaware C-Corp",
      flag: "🇺🇸",
      description: "Most common choice for VC-backed startups",
      pros: ["Lower corporate tax (21%)", "Startup/investor-friendly", "Flexible stock structures"],
      cons: ["Annual franchise tax", "Need registered agent"],
    },
    france: {
      name: "France SAS",
      flag: "🇫🇷",
      description: "Great for EU-based startups",
      pros: ["Flexible governance", "Easy to hire in EU", "Standard for French founders"],
      cons: ["Higher corporate tax", "More local compliance"],
    },
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-section">Create Your Company</CardTitle>
              <CardDescription>
                {step === 1 ? "Choose your jurisdiction" : "Enter company details"}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <FormField
                  control={form.control}
                  name="jurisdiction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Select Jurisdiction</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-4 md:grid-cols-2"
                        >
                          {(['delaware', 'france'] as const).map((jurisdiction) => {
                            const data = jurisdictionData[jurisdiction];
                            return (
                              <div key={jurisdiction} className="relative">
                                <RadioGroupItem
                                  value={jurisdiction}
                                  id={jurisdiction}
                                  className="peer sr-only"
                                  data-testid={`radio-jurisdiction-${jurisdiction}`}
                                />
                                <label
                                  htmlFor={jurisdiction}
                                  className="flex flex-col gap-3 rounded-md border-2 border-muted bg-card p-4 hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary cursor-pointer"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">{data.flag}</span>
                                      <div>
                                        <p className="font-semibold">{data.name}</p>
                                        <p className="text-xs text-muted-foreground">{data.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <p className="font-medium text-green-600 dark:text-green-400 mb-1">Pros:</p>
                                      <ul className="space-y-0.5 text-muted-foreground">
                                        {data.pros.map((pro, idx) => (
                                          <li key={idx}>• {pro}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-1">Cons:</p>
                                      <ul className="space-y-0.5 text-muted-foreground">
                                        {data.cons.map((con, idx) => (
                                          <li key={idx}>• {con}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc." {...field} data-testid="input-company-name" />
                        </FormControl>
                        <FormDescription>
                          The legal name of your company
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What does your company do?"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-company-description"
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of your business
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex gap-3">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    data-testid="button-back"
                  >
                    Back
                  </Button>
                )}
                {step === 1 && (
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full"
                    data-testid="button-next"
                  >
                    Next
                  </Button>
                )}
                {step === 2 && (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending}
                    data-testid="button-create-company-submit"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Company"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

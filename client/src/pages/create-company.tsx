import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Building2, Flag, Mic, Volume2, VolumeX, Sparkles } from "lucide-react";
import { insertCompanySchema } from "@shared/schema";

const formSchema = insertCompanySchema.omit({
  userId: true, // Backend adds userId automatically from session
}).extend({
  jurisdiction: z.enum(['delaware', 'france']),
});

type FormData = z.infer<typeof formSchema>;

type ExtractCompanyResponse = {
  name?: string;
  description?: string | null;
  jurisdiction?: 'delaware' | 'france';
};

export default function CreateCompany() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [useVoiceMode, setUseVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [wasVoiceCreated, setWasVoiceCreated] = useState(false); // Track if company was voice-created
  const MAX_RETRIES = 3;
  const recognitionRef = useRef<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "" as string, // Ensure description is always string, never null
      jurisdiction: "delaware",
    },
    shouldUnregister: false, // Preserve field values when fields are unmounted between steps
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
      
      // If created via voice, guide to cofounder invitation flow
      if (wasVoiceCreated) {
        setTimeout(() => {
          setLocation("/founders");
        }, 1000);
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      // Reset voice flag on error so manual retry goes to dashboard
      setWasVoiceCreated(false);
      setUseVoiceMode(false);
      
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

  const onInvalid = (errors: any) => {
    console.log("Form validation failed:", errors);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.lang = 'en-US';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const startListening = (currentRetry: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    // Create fresh recognition instance for each attempt
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setConversation(transcript);
      setIsListening(false);
      
      // Extract company data using AI
      try {
        const response: ExtractCompanyResponse = await apiRequest("POST", "/api/chat/extract-company", {
          conversation: transcript
        });
        
        if (response && response.name) {
          // Success! Prefill form and auto-submit
          form.setValue("name", response.name);
          form.setValue("description", response.description ?? "");
          form.setValue("jurisdiction", response.jurisdiction ?? "delaware");
          
          const jurisdictionName = response.jurisdiction === 'delaware' ? 'Delaware C-Corp' : 'France SAS';
          speakText(`Perfect! I'm creating ${response.name} as a ${jurisdictionName}. Next, we'll invite your cofounders to sign the incorporation documents.`);
          
          // Set flag to track voice-driven creation
          setWasVoiceCreated(true);
          
          // Auto-submit the form after 2 seconds
          setTimeout(async () => {
            try {
              await form.handleSubmit((data) => {
                createMutation.mutate(data);
              })();
            } catch (error) {
              console.error("Auto-submit error:", error);
              // Fallback: show form for manual submission
              setStep(2);
              setUseVoiceMode(false);
              setRetryCount(0);
              setWasVoiceCreated(false);
              toast({
                title: "Please review",
                description: "Review the details and click Create Company.",
              });
            }
          }, 2000);
        } else {
          // Extraction failed, retry if we have attempts left
          const newRetryCount = currentRetry + 1;
          if (newRetryCount < MAX_RETRIES) {
            setRetryCount(newRetryCount);
            speakText(`I didn't catch all that. Try ${newRetryCount}: Please tell me your company name and whether Delaware or France.`);
            
            setTimeout(() => {
              startListening(newRetryCount);
            }, 4000);
          } else {
            speakText("I'm having trouble understanding. Let's use the form instead.");
            setTimeout(() => {
              setUseVoiceMode(false);
              setRetryCount(0);
              toast({
                title: "Voice mode ended",
                description: "Please fill out the form manually.",
              });
            }, 3000);
          }
        }
      } catch (error) {
        console.error("Voice extraction error:", error);
        speakText("Sorry, I had trouble processing that. Let's use the form instead.");
        
        setTimeout(() => {
          setUseVoiceMode(false);
          setRetryCount(0);
          toast({
            title: "Voice mode ended",
            description: "Please use the form to continue.",
            variant: "destructive",
          });
        }, 3000);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      
      // Handle errors based on type and retry count
      if (event.error === 'no-speech' && currentRetry < MAX_RETRIES) {
        speakText("I didn't hear anything. Let me try again.");
        setTimeout(() => {
          startListening(currentRetry + 1);
        }, 2000);
      } else {
        speakText("Sorry, voice input isn't working. Please use the form.");
        setTimeout(() => {
          setUseVoiceMode(false);
          setRetryCount(0);
        }, 2000);
      }
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setUseVoiceMode(false);
      setRetryCount(0);
      toast({
        title: "Voice input failed",
        description: "Please use the form instead.",
        variant: "destructive",
      });
    }
  };

  const startVoiceConversation = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    setUseVoiceMode(true);
    setRetryCount(0);
    
    speakText("Hi! I'm your AI legal assistant. Let's create your company together. Tell me about your company. What's the name, what does it do, and are you based in Delaware or France?");
    
    setTimeout(() => {
      startListening(0);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-section">Create Your Company</CardTitle>
                <CardDescription>
                  {useVoiceMode 
                    ? "Speak naturally - I'll fill out the form for you" 
                    : step === 1 ? "Choose your jurisdiction" : "Enter company details"
                  }
                </CardDescription>
              </div>
            </div>
            {step === 1 && !useVoiceMode && (
              <Button
                onClick={startVoiceConversation}
                variant="outline"
                size="lg"
                disabled={isListening || isSpeaking}
                data-testid="button-voice-mode"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Use Voice
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>
        <CardContent>
          {useVoiceMode && (
            <div className="mb-6 p-8 text-center space-y-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
              <div className="flex justify-center">
                <div className={`h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ${isListening ? 'animate-pulse ring-4 ring-primary/50' : ''}`}>
                  {isListening ? (
                    <Mic className="h-10 w-10 text-primary animate-pulse" />
                  ) : isSpeaking ? (
                    <Volume2 className="h-10 w-10 text-primary animate-pulse" />
                  ) : (
                    <Sparkles className="h-10 w-10 text-primary" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {isListening ? "I'm listening..." : isSpeaking ? "Speaking..." : "Voice Mode Active"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {conversation || "Waiting for your response..."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUseVoiceMode(false);
                  window.speechSynthesis.cancel();
                  if (recognitionRef.current) {
                    recognitionRef.current.stop();
                  }
                }}
                data-testid="button-cancel-voice"
              >
                Cancel Voice Mode
              </Button>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
              {step === 1 && !useVoiceMode && (
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
                            value={field.value ?? ""}
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

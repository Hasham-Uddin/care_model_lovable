import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Sparkles, Database, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthGuard } from "@/components/AuthGuard";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const DOMAIN_OPTIONS = [
  "Healthcare",
  "Hiring & Employment",
  "Education",
  "Policing & Criminal Justice",
  "Housing",
  "Lending & Finance",
  "Social Services",
  "Technology & AI",
];

export default function SyntheticDataGenerator() {
  const navigate = useNavigate();
  const [count, setCount] = useState(10);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  
  // Community data state
  const [isLoadingCommunityData, setIsLoadingCommunityData] = useState(false);
  const [communityData, setCommunityData] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<{ total_projects: number; total_interrogations: number } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (roles && roles.length > 0) {
        setUserRole(roles[0].role);
      }
    }
  };

  const isAdmin = userRole === 'evaluator' || userRole === 'facilitator' || userRole === 'admin';

  const handleDomainToggle = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const handleGenerate = async () => {
    if (count < 1 || count > 50) {
      toast.error("Please enter a count between 1 and 50");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-synthetic-data', {
        body: { 
          count,
          domains: selectedDomains.length > 0 ? selectedDomains : undefined
        }
      });

      if (error) throw error;

      setGeneratedData(data.data);
      toast.success(`Generated ${data.data.length} synthetic training examples!`);
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || "Failed to generate synthetic data");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadJSONL = (data: any[], prefix: string = 'tir-synthetic-data') => {
    if (data.length === 0) return;

    const jsonlContent = data.map(item => {
      const conversationPair = {
        messages: [
          {
            role: "system",
            content: "You are an AI assistant trained in the Theory of Interrogative Reasoning. When you encounter potential bias, you pause, invite interrogation from those with proximity to the issue, consider timing and belief systems, collaborate with diverse perspectives, and revise your outputs to be more equitable."
          },
          {
            role: "user",
            content: `Scenario: ${item.scenario}\n\nContext: ${item.initial_statement}\n\nInterrogate this statement using TIR principles.`
          },
          {
            role: "assistant",
            content: `**Interrogative Response (Proximity):**\n${item.interrogative_response}\n\n**Collaborative Reasoning:**\n${item.collaborative_reasoning}\n\n**Revised Outcome:**\n${item.revised_outcome}\n\n**Reflection:**\n${item.annotation}`
          }
        ],
        metadata: {
          domain: item.domain,
          affected_groups: item.affected_groups,
          harm_types: item.harm_types,
          tir_principles_applied: ["proximity", "belief", "timing", "collaboration"],
          source: item.source || 'synthetic'
        }
      };
      return JSON.stringify(conversationPair);
    }).join('\n');

    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-${Date.now()}.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSONL file downloaded!");
  };

  const handleDownloadCSV = (data: any[], prefix: string = 'tir-synthetic-data') => {
    if (data.length === 0) return;

    const headers = [
      'Domain',
      'Scenario',
      'Initial Statement',
      'Interrogative Response',
      'Collaborative Reasoning',
      'Revised Outcome',
      'Annotation',
      'Affected Groups',
      'Harm Types',
      'Source'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.domain || ''}"`,
        `"${(item.scenario || '').replace(/"/g, '""')}"`,
        `"${(item.initial_statement || '').replace(/"/g, '""')}"`,
        `"${(item.interrogative_response || '').replace(/"/g, '""')}"`,
        `"${(item.collaborative_reasoning || '').replace(/"/g, '""')}"`,
        `"${(item.revised_outcome || '').replace(/"/g, '""')}"`,
        `"${(item.annotation || '').replace(/"/g, '""')}"`,
        `"${(item.affected_groups || []).join('; ')}"`,
        `"${(item.harm_types || []).join('; ')}"`,
        `"${item.source || 'synthetic'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded!");
  };

  const handleLoadCommunityData = async () => {
    setIsLoadingCommunityData(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-community-training-data');

      if (error) throw error;

      setCommunityData(data.data || []);
      setCommunityStats(data.stats || null);
      
      if (data.data.length === 0) {
        toast.info(data.message || "No community data available yet");
      } else {
        toast.success(`Loaded ${data.data.length} community training examples!`);
      }
    } catch (error: any) {
      console.error('Community data error:', error);
      if (error.message?.includes('403') || error.message?.includes('Admin')) {
        toast.error("Admin access required to view community data");
      } else {
        toast.error(error.message || "Failed to load community data");
      }
    } finally {
      setIsLoadingCommunityData(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Training Data Generator</h1>
              <p className="text-muted-foreground">
                Generate and export TIR-based training data for LLM fine-tuning
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>

          <Tabs defaultValue="synthetic" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="synthetic" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Synthetic Data
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2" disabled={!isAdmin}>
                <Users className="w-4 h-4" />
                Community Data
                {!isAdmin && <Badge variant="outline" className="ml-1 text-xs">Admin</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* Synthetic Data Tab */}
            <TabsContent value="synthetic">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-6 md:col-span-1">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Configuration
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="count">Number of Examples (1-50)</Label>
                      <Input
                        id="count"
                        type="number"
                        min="1"
                        max="50"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="mb-3 block">Domains (optional)</Label>
                      <div className="space-y-2">
                        {DOMAIN_OPTIONS.map((domain) => (
                          <div key={domain} className="flex items-center space-x-2">
                            <Checkbox
                              id={domain}
                              checked={selectedDomains.includes(domain)}
                              onCheckedChange={() => handleDomainToggle(domain)}
                            />
                            <label
                              htmlFor={domain}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {domain}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Leave empty to generate across all domains
                      </p>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Data
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Generated Examples</h2>
                    {generatedData.length > 0 && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleDownloadCSV(generatedData)} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => handleDownloadJSONL(generatedData)} size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSONL
                        </Button>
                      </div>
                    )}
                  </div>

                  {generatedData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No data generated yet. Configure and click "Generate Data" to start.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {generatedData.map((item, index) => (
                        <Card key={index} className="p-4 border-l-4 border-l-primary/50">
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs font-semibold text-primary uppercase">
                                {item.domain}
                              </span>
                              <p className="text-sm font-medium mt-1">{item.scenario}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Initial Statement</p>
                              <p className="text-sm">{item.initial_statement}</p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Interrogative Response</p>
                              <p className="text-sm">{item.interrogative_response}</p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Revised Outcome</p>
                              <p className="text-sm font-medium text-primary">{item.revised_outcome}</p>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              {item.affected_groups?.map((group: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 bg-primary/10 rounded">
                                  {group}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Community Data Tab */}
            <TabsContent value="community">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-6 md:col-span-1">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Community Data
                  </h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">
                        Export real interrogation data from all projects where facilitators have enabled data contribution consent.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Only anonymized data from consenting projects is included.
                      </p>
                    </div>

                    {communityStats && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg text-center">
                          <p className="text-2xl font-bold text-primary">{communityStats.total_projects}</p>
                          <p className="text-xs text-muted-foreground">Projects</p>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-lg text-center">
                          <p className="text-2xl font-bold text-secondary">{communityStats.total_interrogations}</p>
                          <p className="text-xs text-muted-foreground">Examples</p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleLoadCommunityData}
                      disabled={isLoadingCommunityData}
                      className="w-full"
                      size="lg"
                    >
                      {isLoadingCommunityData ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Load Community Data
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Community Training Examples</h2>
                    {communityData.length > 0 && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleDownloadCSV(communityData, 'community-training-data')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => handleDownloadJSONL(communityData, 'community-training-data')} size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSONL
                        </Button>
                      </div>
                    )}
                  </div>

                  {communityData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No community data loaded. Click "Load Community Data" to fetch.</p>
                      <p className="text-xs mt-2">Only data from projects with donation consent will appear.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {communityData.map((item, index) => (
                        <Card key={index} className="p-4 border-l-4 border-l-secondary/50">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-secondary uppercase">
                                {item.mode} Mode
                              </span>
                              {item.verdict && (
                                <Badge variant="outline" className="text-xs">
                                  {item.verdict.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Original Output</p>
                              <p className="text-sm">{item.initial_statement}</p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Community Interrogation</p>
                              <p className="text-sm">{item.interrogative_response}</p>
                            </div>

                            {item.revised_outcome && item.revised_outcome !== item.initial_statement && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Revised Output</p>
                                <p className="text-sm font-medium text-secondary">{item.revised_outcome}</p>
                              </div>
                            )}

                            <div className="flex gap-2 flex-wrap">
                              {item.affected_groups?.map((group: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 bg-secondary/10 rounded">
                                  {group}
                                </span>
                              ))}
                              {item.harm_types?.map((harm: string, i: number) => (
                                <span key={`harm-${i}`} className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                                  {harm}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">About TIR Training Data</h3>
            <p className="text-sm text-muted-foreground mb-2">
              This generator creates training examples based on the Theory of Interrogative Reasoning (TIR), 
              teaching AI models to recognize bias, pause for interrogation, and collaborate toward more equitable outcomes.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Synthetic Data:</strong> AI-generated examples across diverse domains. <strong>Community Data:</strong> Real anonymized interrogations from consenting projects system-wide.
            </p>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

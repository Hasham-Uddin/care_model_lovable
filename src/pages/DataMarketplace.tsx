import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Shield, Users, TrendingUp, Download, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import measureLogo from "@/assets/measure-logo.png";

const PLATFORM_SHARE = 0.75;
const COMMUNITY_SHARE = 0.25;

// Pricing tiers
const PRICING_TIERS = {
  researcher: {
    name: "Researcher",
    description: "Per-record pricing for academic and research use",
    priceRange: "$5 - $15 per record",
    minRecords: 500,
    maxRecords: 1000,
    pricePerRecord: { min: 5, max: 15 },
    features: [
      "500-1,000 record packages",
      "JSONL & CSV formats",
      "Full metadata included",
      "Research use license",
    ],
  },
  enterprise: {
    name: "Enterprise Bias Training",
    description: "High-value curated datasets for enterprise AI teams",
    priceRange: "$100,000 - $500,000+",
    minPrice: 100000,
    maxPrice: 500000,
    features: [
      "Curated bias-training bundles",
      "Custom dataset composition",
      "Priority support",
      "Extended commercial license",
      "Integration assistance",
    ],
  },
  annual: {
    name: "Annual License",
    description: "Continuous access with monthly data refreshes",
    priceRange: "$250,000 - $1,000,000 / year",
    minPrice: 250000,
    maxPrice: 1000000,
    features: [
      "Unlimited data access",
      "Monthly data refreshes",
      "Governance documentation",
      "Dedicated account manager",
      "Custom data pipelines",
      "Audit & compliance support",
    ],
  },
};

type PricingTier = "researcher" | "enterprise" | "annual";

export default function DataMarketplace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<PricingTier>("researcher");
  const [recordCount, setRecordCount] = useState<number>(500);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyerName, setBuyerName] = useState("");

  // Fetch available record count from interrogations with consent
  const { data: availableRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["marketplace-records"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("interrogations")
        .select("*", { count: "exact", head: true })
        .eq("consent", true)
        .eq("anonymized", true);

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch contributing organizations count
  const { data: contributorStats } = useQuery({
    queryKey: ["marketplace-contributors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calculate_contribution_percentages");
      if (error) throw error;
      return {
        count: data?.length || 0,
        organizations: data || [],
      };
    },
  });

  // Fetch recent purchases for social proof
  const { data: recentPurchases } = useQuery({
    queryKey: ["marketplace-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_purchases")
        .select("record_count, purchased_at")
        .eq("status", "completed")
        .order("purchased_at", { ascending: false })
        .limit(5);

      // Non-admins cannot read this table; treat as empty rather than failing.
      if (error) return [];
      return data || [];
    },
  });

  // Calculate pricing based on tier
  const calculatePricing = () => {
    if (selectedTier === "researcher") {
      // Use mid-range price of $10 per record for estimates
      const pricePerRecord = 10;
      const total = recordCount * pricePerRecord;
      return {
        total,
        platformAmount: total * PLATFORM_SHARE,
        communityAmount: total * COMMUNITY_SHARE,
        pricePerRecord,
      };
    }
    // For enterprise/annual, show range
    return null;
  };

  const pricing = calculatePricing();

  const handleInquiry = async () => {
    if (!buyerEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTier === "researcher" && recordCount < 500) {
      toast({
        title: "Minimum order",
        description: "Minimum purchase is 500 records for researcher tier.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTier === "researcher" && availableRecords && recordCount > availableRecords) {
      toast({
        title: "Not enough records",
        description: `Only ${availableRecords} records are available.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-sales-inquiry", {
        body: {
          buyerName,
          buyerEmail,
          tier: selectedTier,
          recordCount: selectedTier === "researcher" ? recordCount : undefined,
          message: inquiryMessage || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Inquiry sent!",
        description: "Our team will contact you within 24 hours to discuss your data needs.",
      });

      // Reset form
      setBuyerName("");
      setBuyerEmail("");
      setInquiryMessage("");
      setRecordCount(500);
    } catch (error: any) {
      console.error("Error sending inquiry:", error);
      toast({
        title: "Failed to send inquiry",
        description: error.message || "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleData = {
    mode: "proximity",
    user_prompt: "What are the main barriers to technology education in underserved communities?",
    model_output: "The primary barriers include lack of access to devices, limited internet connectivity, and insufficient funding for STEM programs...",
    challenge_tags: ["bias", "deficit_framing"],
    affected_groups: ["Youth", "Low-income communities"],
    verdict: "needs_more_revision",
    model_revision: "Community members identified that the response overlooked existing community-led initiatives and focused too heavily on deficits rather than assets...",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={measureLogo} alt="MEASURE" className="h-8" />
          </div>
          <Badge variant="outline" className="text-sm border-accent text-accent">
            Community Data Commons — Coming Soon
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              Ethical AI Training Data
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Community Data Commons
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Access high-quality, bias-interrogated training data created through authentic 
              community engagement. Every record has been reviewed and refined by real people 
              from affected communities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Consent-verified data</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Anonymized & privacy-safe</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Community revenue share</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  {recordsLoading ? "..." : availableRecords?.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Available Records</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  {contributorStats?.count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Contributing Orgs</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Consent Verified</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">25%</p>
                <p className="text-sm text-muted-foreground">To Communities</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Sample Data Preview */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Format Preview</h2>
              <p className="text-muted-foreground mb-6">
                Each record includes the original AI interaction, community feedback, 
                bias tags, and refined outputs following the Theory of Interrogative Reasoning (TIR).
              </p>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline">{sampleData.mode}</Badge>
                    Sample Record (Anonymized)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">USER PROMPT</Label>
                    <p className="text-sm mt-1">{sampleData.user_prompt}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">ORIGINAL MODEL OUTPUT</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{sampleData.model_output}</p>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Label className="text-xs text-muted-foreground w-full">IDENTIFIED ISSUES</Label>
                    {sampleData.challenge_tags.map((tag) => (
                      <Badge key={tag} variant="destructive" className="text-xs">
                        {tag.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Label className="text-xs text-muted-foreground w-full">AFFECTED GROUPS</Label>
                    {sampleData.affected_groups.map((group) => (
                      <Badge key={group} variant="secondary" className="text-xs">
                        {group}
                      </Badge>
                    ))}
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-xs text-muted-foreground">COMMUNITY REVISION</Label>
                      <Badge variant="outline" className="text-xs">
                        {sampleData.verdict.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1 text-green-700 dark:text-green-400">
                      {sampleData.model_revision}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Export Formats</CardTitle>
                  <CardDescription>Data available in multiple formats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Download className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">JSONL</p>
                        <p className="text-xs text-muted-foreground">For fine-tuning</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Download className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">CSV</p>
                        <p className="text-xs text-muted-foreground">For analysis</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Tiers */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Pricing Plans</h2>
              <p className="text-muted-foreground mb-6">
                Choose the plan that fits your needs. All purchases directly support 
                the communities who contributed their expertise.
              </p>

              <div className="space-y-4">
                {/* Researcher Tier */}
                <Card className={`cursor-pointer transition-all ${selectedTier === "researcher" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedTier("researcher")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{PRICING_TIERS.researcher.name}</CardTitle>
                      <Badge variant="secondary">{PRICING_TIERS.researcher.priceRange}</Badge>
                    </div>
                    <CardDescription>{PRICING_TIERS.researcher.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="text-sm space-y-1">
                      {PRICING_TIERS.researcher.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Enterprise Tier */}
                <Card className={`cursor-pointer transition-all ${selectedTier === "enterprise" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedTier("enterprise")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{PRICING_TIERS.enterprise.name}</CardTitle>
                      <Badge className="bg-primary">{PRICING_TIERS.enterprise.priceRange}</Badge>
                    </div>
                    <CardDescription>{PRICING_TIERS.enterprise.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="text-sm space-y-1">
                      {PRICING_TIERS.enterprise.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Annual License Tier */}
                <Card className={`cursor-pointer transition-all ${selectedTier === "annual" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedTier("annual")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{PRICING_TIERS.annual.name}</CardTitle>
                      <Badge variant="outline" className="border-primary text-primary">{PRICING_TIERS.annual.priceRange}</Badge>
                    </div>
                    <CardDescription>{PRICING_TIERS.annual.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="text-sm space-y-1">
                      {PRICING_TIERS.annual.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Request Access</CardTitle>
                  <CardDescription>
                    {selectedTier === "researcher" 
                      ? `Minimum ${PRICING_TIERS.researcher.minRecords} records • $5-$15 per record`
                      : selectedTier === "enterprise"
                      ? "Custom pricing based on your needs"
                      : "Contact us for annual licensing options"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedTier === "researcher" && (
                    <div className="space-y-2">
                      <Label htmlFor="recordCount">Number of Records</Label>
                      <Input
                        id="recordCount"
                        type="number"
                        min={500}
                        max={availableRecords || 10000}
                        value={recordCount}
                        onChange={(e) => setRecordCount(parseInt(e.target.value) || 500)}
                        className="text-lg"
                      />
                      {availableRecords && (
                        <p className="text-xs text-muted-foreground">
                          {availableRecords.toLocaleString()} records available • Min 500, Max 1,000 per order
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="buyerName">Your Name</Label>
                    <Input
                      id="buyerName"
                      type="text"
                      placeholder="Dr. Jane Smith"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerEmail">Email Address</Label>
                    <Input
                      id="buyerEmail"
                      type="email"
                      placeholder="researcher@university.edu"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                    />
                  </div>

                  {(selectedTier === "enterprise" || selectedTier === "annual") && (
                    <div className="space-y-2">
                      <Label htmlFor="inquiryMessage">Tell us about your needs (optional)</Label>
                      <textarea
                        id="inquiryMessage"
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Describe your use case, team size, data requirements..."
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                      />
                    </div>
                  )}

                  {selectedTier === "researcher" && pricing && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Total (at $10/record avg)</span>
                          <span>${pricing.total.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Final pricing ($5-$15/record) depends on data complexity and volume
                        </p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Revenue Distribution
                        </p>
                        <div className="flex justify-between text-sm text-green-700 dark:text-green-300">
                          <span>Platform ({(PLATFORM_SHARE * 100).toFixed(0)}%)</span>
                          <span>~${pricing.platformAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-700 dark:text-green-300">
                          <span>Community Pool ({(COMMUNITY_SHARE * 100).toFixed(0)}%)</span>
                          <span>~${pricing.communityAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleInquiry}
                    disabled={!buyerEmail || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : selectedTier === "researcher" ? (
                      `Request Quote for ${recordCount.toLocaleString()} Records`
                    ) : (
                      "Contact Sales"
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting, you agree to use this data ethically and in accordance 
                    with our data use agreement.
                  </p>
                </CardContent>
              </Card>

              {/* Recent Purchases */}
              {recentPurchases && recentPurchases.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Purchases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentPurchases.map((purchase, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {purchase.purchased_at
                              ? new Date(purchase.purchased_at).toLocaleDateString()
                              : "Pending"}
                          </span>
                          <span>{purchase.record_count.toLocaleString()} records</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Ideal For
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="font-semibold mb-2">Academic Research</h3>
                <p className="text-sm text-muted-foreground">
                  Train and evaluate models on bias detection and mitigation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="font-semibold mb-2">AI Safety Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Improve model alignment with community perspectives
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔬</span>
                </div>
                <h3 className="font-semibold mb-2">LLM Fine-tuning</h3>
                <p className="text-sm text-muted-foreground">
                  Create more equitable and culturally aware AI systems
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Questions about the data or custom licensing? Contact us at{" "}
            <a href="mailto:data@wemeasure.org" className="text-primary hover:underline">
              data@wemeasure.org
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

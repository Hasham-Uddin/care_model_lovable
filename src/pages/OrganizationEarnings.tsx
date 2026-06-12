import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Calendar,
  Building2,
  Coins
} from "lucide-react";
import { format } from "date-fns";

interface OrganizationStats {
  organization_id: string;
  organization_name: string;
  total_contributions: number;
  percentage: number;
}

interface Earning {
  id: string;
  earned_amount: number;
  contribution_percentage: number;
  created_at: string;
  purchase_id: string;
}

interface Payout {
  id: string;
  payout_month: string;
  total_earned: number;
  total_paid: number;
  status: string;
  paid_at: string | null;
}

interface OrgData {
  id: string;
  name: string;
  location: string | null;
  payout_enabled: boolean;
  contributions: number;
  earnings: Earning[];
  payouts: Payout[];
  pendingAmount: number;
}

const OrganizationEarnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [communityStats, setCommunityStats] = useState<OrganizationStats[]>([]);
  const [totalCommunityContributions, setTotalCommunityContributions] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's projects and their organizations
      const { data: projects } = await supabase
        .from("projects")
        .select("organization_id, organizations(id, name, location, payout_enabled)")
        .eq("facilitator_id", user.id);

      if (!projects || projects.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique organizations
      const orgMap = new Map<string, any>();
      projects.forEach(p => {
        if (p.organizations && !orgMap.has(p.organizations.id)) {
          orgMap.set(p.organizations.id, p.organizations);
        }
      });

      const orgIds = Array.from(orgMap.keys());

      // Fetch contribution stats using the database function
      const { data: stats } = await supabase.rpc("calculate_contribution_percentages");
      if (stats) {
        setCommunityStats(stats);
        setTotalCommunityContributions(stats.reduce((sum: number, s: OrganizationStats) => sum + s.total_contributions, 0));
      }

      // Fetch data for each organization
      const orgDataPromises = orgIds.map(async (orgId) => {
        const org = orgMap.get(orgId);
        
        // Get contributions
        const { data: contributions } = await supabase
          .from("organization_contributions")
          .select("interrogation_count")
          .eq("organization_id", orgId);

        const totalContributions = contributions?.reduce((sum, c) => sum + c.interrogation_count, 0) || 0;

        // Get earnings
        const { data: earnings } = await supabase
          .from("organization_earnings")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });

        // Get payouts
        const { data: payouts } = await supabase
          .from("organization_payouts")
          .select("*")
          .eq("organization_id", orgId)
          .order("payout_month", { ascending: false });

        // Calculate pending amount (earned but not yet paid)
        const totalEarned = earnings?.reduce((sum, e) => sum + Number(e.earned_amount), 0) || 0;
        const totalPaid = payouts?.reduce((sum, p) => sum + Number(p.total_paid), 0) || 0;
        const pendingAmount = totalEarned - totalPaid;

        return {
          id: orgId,
          name: org.name,
          location: org.location,
          payout_enabled: org.payout_enabled || false,
          contributions: totalContributions,
          earnings: earnings || [],
          payouts: payouts || [],
          pendingAmount: Math.max(0, pendingAmount)
        };
      });

      const orgData = await Promise.all(orgDataPromises);
      setOrganizations(orgData);
    } catch (error) {
      console.error("Error fetching organization data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive"
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E8973E]/10">
                <Coins className="h-6 w-6 text-[#E8973E]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-['Outfit']">Organization Earnings</h1>
                <p className="text-muted-foreground">
                  Track contributions and payouts from community data sales
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#253B96]" />
            </div>
          ) : organizations.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Organizations Found</h2>
              <p className="text-muted-foreground mb-4">
                Create a project to start contributing to the community data pool.
              </p>
              <Button onClick={() => navigate("/create-project")}>
                Create Project
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Revenue Split Info */}
              <Card className="p-6 bg-gradient-to-r from-[#000860]/5 to-[#253B96]/5 border-[#253B96]/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#253B96]/10">
                    <TrendingUp className="h-6 w-6 text-[#253B96]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Community Revenue Sharing</h2>
                    <p className="text-muted-foreground text-sm">
                      When AI researchers purchase community training data, <strong>25%</strong> of each sale 
                      is distributed proportionally to contributing organizations based on their interrogation contributions.
                      Payouts are processed monthly.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Community Overview */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-[#253B96]" />
                    <span className="text-sm text-muted-foreground">Total Community Contributions</span>
                  </div>
                  <p className="text-3xl font-bold">{totalCommunityContributions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">interrogations across all organizations</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-5 w-5 text-[#E8973E]" />
                    <span className="text-sm text-muted-foreground">Contributing Organizations</span>
                  </div>
                  <p className="text-3xl font-bold">{communityStats.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">organizations in the data pool</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-muted-foreground">Your Pending Earnings</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(organizations.reduce((sum, o) => sum + o.pendingAmount, 0))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">across all your organizations</p>
                </Card>
              </div>

              {/* Organization Cards */}
              {organizations.map((org) => {
                const orgStats = communityStats.find(s => s.organization_id === org.id);
                const contributionPercentage = orgStats?.percentage ? (orgStats.percentage * 100).toFixed(2) : "0.00";

                return (
                  <Card key={org.id} className="overflow-hidden">
                    <div className="p-6 border-b bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{org.name}</h3>
                          {org.location && (
                            <p className="text-sm text-muted-foreground">{org.location}</p>
                          )}
                        </div>
                        <Badge variant={org.payout_enabled ? "default" : "secondary"}>
                          {org.payout_enabled ? "Payouts Enabled" : "Payouts Not Setup"}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Stats Grid */}
                      <div className="grid sm:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <BarChart3 className="h-5 w-5 mx-auto mb-2 text-[#253B96]" />
                          <p className="text-2xl font-bold">{org.contributions}</p>
                          <p className="text-xs text-muted-foreground">Contributions</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-[#E8973E]" />
                          <p className="text-2xl font-bold">{contributionPercentage}%</p>
                          <p className="text-xs text-muted-foreground">Pool Share</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-600" />
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(org.earnings.reduce((sum, e) => sum + Number(e.earned_amount), 0))}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Earned</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-[#F9D448]/10">
                          <Coins className="h-5 w-5 mx-auto mb-2 text-[#E8973E]" />
                          <p className="text-2xl font-bold text-[#E8973E]">
                            {formatCurrency(org.pendingAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">Pending Payout</p>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      {/* Recent Payouts */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Payout History
                        </h4>
                        {org.payouts.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
                            No payouts yet. Earnings will be disbursed monthly.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {org.payouts.slice(0, 5).map((payout) => (
                              <div 
                                key={payout.id} 
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                              >
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(payout.payout_month), "MMMM yyyy")}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {payout.paid_at 
                                      ? `Paid on ${format(new Date(payout.paid_at), "MMM d, yyyy")}`
                                      : "Processing"
                                    }
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(Number(payout.total_paid))}</p>
                                  {getStatusBadge(payout.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
};

export default OrganizationEarnings;

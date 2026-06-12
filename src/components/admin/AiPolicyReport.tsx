import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileBarChart, Download, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Row {
  user_id: string;
  full_name: string;
  email: string;
  ai_consent_given: boolean | null;
  ai_consent_version: string | null;
  ai_consent_at: string | null;
  policy_version: string | null;
  policy_consented_at: string | null;
  interrogation_count: number;
  last_interrogation_at: string | null;
}

const toCsv = (rows: Row[]) => {
  const headers = [
    "Full Name",
    "Email",
    "AI Consent Given",
    "AI Consent Version",
    "AI Consent Acknowledged At",
    "TOS/Privacy Policy Version",
    "TOS/Privacy Policy Consented At",
    "AI Interrogations (in range)",
    "Last Interrogation At",
  ];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.full_name,
        r.email,
        r.ai_consent_given === null ? "" : r.ai_consent_given ? "Yes" : "No",
        r.ai_consent_version ?? "",
        r.ai_consent_at ?? "",
        r.policy_version ?? "",
        r.policy_consented_at ?? "",
        r.interrogation_count,
        r.last_interrogation_at ?? "",
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
};

export const AiPolicyReport = () => {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState<string>(monthAgo);
  const [to, setTo] = useState<string>(today);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const fromIso = new Date(`${from}T00:00:00.000Z`).toISOString();
      const toIso = new Date(`${to}T23:59:59.999Z`).toISOString();

      const [
        { data: profiles, error: pErr },
        { data: aiConsents, error: aErr },
        { data: policyConsents, error: cErr },
        { data: interrogations, error: iErr },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase
          .from("ai_consent_log")
          .select("user_id, consent_given, consent_version, acknowledged_at")
          .order("acknowledged_at", { ascending: false }),
        supabase
          .from("policy_consent")
          .select("user_id, policy_version, consented_at")
          .order("consented_at", { ascending: false }),
        supabase
          .from("interrogations")
          .select("created_at, project_id")
          .gte("created_at", fromIso)
          .lte("created_at", toIso),
      ]);

      if (pErr) throw pErr;
      if (aErr) throw aErr;
      if (cErr) throw cErr;
      if (iErr) throw iErr;

      // Map facilitator interrogation counts via projects table
      const { data: projects, error: prErr } = await supabase
        .from("projects")
        .select("id, facilitator_id");
      if (prErr) throw prErr;

      const projectFacilitator = new Map<string, string>();
      (projects || []).forEach((p) =>
        projectFacilitator.set(p.id, p.facilitator_id),
      );

      const userCounts = new Map<string, { count: number; last: string | null }>();
      (interrogations || []).forEach((row) => {
        const facId = projectFacilitator.get(row.project_id);
        if (!facId) return;
        const prev = userCounts.get(facId) || { count: 0, last: null };
        const next = {
          count: prev.count + 1,
          last:
            !prev.last || row.created_at > prev.last
              ? row.created_at
              : prev.last,
        };
        userCounts.set(facId, next);
      });

      const latestAi = new Map<
        string,
        { consent_given: boolean; consent_version: string; acknowledged_at: string }
      >();
      (aiConsents || []).forEach((r) => {
        if (!latestAi.has(r.user_id)) {
          latestAi.set(r.user_id, {
            consent_given: r.consent_given,
            consent_version: r.consent_version,
            acknowledged_at: r.acknowledged_at,
          });
        }
      });

      const latestPolicy = new Map<
        string,
        { policy_version: string; consented_at: string }
      >();
      (policyConsents || []).forEach((r) => {
        if (!latestPolicy.has(r.user_id)) {
          latestPolicy.set(r.user_id, {
            policy_version: r.policy_version,
            consented_at: r.consented_at,
          });
        }
      });

      const built: Row[] = (profiles || []).map((p) => {
        const ai = latestAi.get(p.id);
        const pol = latestPolicy.get(p.id);
        const counts = userCounts.get(p.id);
        return {
          user_id: p.id,
          full_name: p.full_name || "—",
          email: p.email,
          ai_consent_given: ai ? ai.consent_given : null,
          ai_consent_version: ai?.consent_version ?? null,
          ai_consent_at: ai?.acknowledged_at ?? null,
          policy_version: pol?.policy_version ?? null,
          policy_consented_at: pol?.consented_at ?? null,
          interrogation_count: counts?.count ?? 0,
          last_interrogation_at: counts?.last ?? null,
        };
      });

      built.sort((a, b) => b.interrogation_count - a.interrogation_count);
      setRows(built);
      setGeneratedAt(new Date());
      toast({ title: "Report generated", description: `${built.length} users included.` });
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to generate report",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-use-policy-report_${from}_to_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const aiConsentedCount = rows.filter((r) => r.ai_consent_given).length;
  const policyConsentedCount = rows.filter((r) => r.policy_consented_at).length;
  const activeUsers = rows.filter((r) => r.interrogation_count > 0).length;
  const usersWithUsageButNoConsent = rows.filter(
    (r) => r.interrogation_count > 0 && !r.ai_consent_given,
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-primary" />
          AI Use Policy Compliance Report
        </CardTitle>
        <CardDescription>
          Per the Measure AI Acceptable Use Policy: tracks user consent
          (AI policy + TOS/Privacy) and AI interrogation activity. Export a
          dated CSV for compliance records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <div>
            <Label htmlFor="ai-report-from">From</Label>
            <Input
              id="ai-report-from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ai-report-to">To</Label>
            <Input
              id="ai-report-to"
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileBarChart className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
          <Button
            variant="outline"
            onClick={downloadCsv}
            disabled={loading || rows.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{rows.length}</p>
              <p className="text-xs text-muted-foreground">Total users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-2xl font-bold">{aiConsentedCount}</p>
              </div>
              <p className="text-xs text-muted-foreground">Accepted AI Policy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-2xl font-bold">{policyConsentedCount}</p>
              </div>
              <p className="text-xs text-muted-foreground">Accepted TOS/Privacy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {usersWithUsageButNoConsent > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : null}
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Active in range
                {usersWithUsageButNoConsent > 0
                  ? ` · ${usersWithUsageButNoConsent} missing AI consent`
                  : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {generatedAt && (
          <p className="text-xs text-muted-foreground">
            Generated {generatedAt.toLocaleString()} · Range: {from} → {to}
          </p>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>AI Policy</TableHead>
                <TableHead>TOS / Privacy</TableHead>
                <TableHead className="text-right">Interrogations</TableHead>
                <TableHead>Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No data for this range.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell>
                      {r.ai_consent_given ? (
                        <Badge variant="default" className="text-xs">
                          v{r.ai_consent_version}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Not accepted
                        </Badge>
                      )}
                      {r.ai_consent_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(r.ai_consent_at).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.policy_consented_at ? (
                        <Badge variant="secondary" className="text-xs">
                          v{r.policy_version}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Not accepted
                        </Badge>
                      )}
                      {r.policy_consented_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(r.policy_consented_at).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {r.interrogation_count}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.last_interrogation_at
                        ? new Date(r.last_interrogation_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiPolicyReport;

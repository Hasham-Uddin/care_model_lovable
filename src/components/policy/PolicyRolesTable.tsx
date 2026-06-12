const roles = [
  { role: "Executive Leadership Team", responsibilities: "Lead policy implementation. Conduct quarterly review. Approve high-risk tool deployment." },
  { role: "Research and Evaluation", responsibilities: "Conduct tool validation and bias audits. Review public-facing AI outputs. Vet bots and reporting engines. Implement research ethics standards." },
  { role: "Operations and Administration", responsibilities: "Maintain the AI Tool Log and Policy. Track compliance and vendor accountability. Manage AI Governance Procedures. Lead staff training." },
  { role: "All Staff", responsibilities: "Complete AI ethics training. Follow the AI Acceptable Use Policy. Flag risks or concerns. Complete the AI Tool Use Form." },
  { role: "General 1099 Contractors/Vendors", responsibilities: "Follow the AI Acceptable Use Policy when using AI for Measure work. Complete the AI Tool Use Form for AI-assisted deliverables." },
  { role: "CARE Model Facilitators (CMFs) & Certified Measure Evaluators (CMEs)", responsibilities: "Follow policy when facilitating Measure tools. Ensure community-facing AI use aligns with CARE Model principles and accessibility standards." },
  { role: "Technology Partners", responsibilities: "Align with AIT standards. Participate in the interrogation process. Disclose model limitations." },
  { role: "Community Invested Parties", responsibilities: "Participate in CARE Model sessions and community engagement activities. Provide input on cultural relevance and lived-experience." },
];

export const PolicyRolesTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-3 font-semibold text-foreground bg-muted/50">Role</th>
          <th className="text-left p-3 font-semibold text-foreground bg-muted/50">Responsibilities</th>
        </tr>
      </thead>
      <tbody>
        {roles.map((r, i) => (
          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
            <td className="p-3 font-medium text-foreground whitespace-nowrap align-top">{r.role}</td>
            <td className="p-3 text-muted-foreground">{r.responsibilities}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

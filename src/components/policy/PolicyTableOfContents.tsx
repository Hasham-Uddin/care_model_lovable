const sections = [
  { id: "purpose", label: "1. Purpose" },
  { id: "joy-wellness", label: "2. Joy, Wellness & Responsible AI Use" },
  { id: "research-ethics", label: "3. AI Research Ethics" },
  { id: "regulatory", label: "4. Regulatory Compliance" },
  { id: "roles", label: "5. Roles & Responsibilities" },
  { id: "permitted-prohibited", label: "6. Permitted & Prohibited Uses" },
  { id: "personal-use", label: "7. Personal AI Tool Use" },
  { id: "branding", label: "8. Branding & Communications" },
  { id: "ait", label: "9. AI Interrogation Tool" },
  { id: "tools", label: "10. AI Tools & Resources" },
  { id: "engagement", label: "11. Invested Party Engagement" },
  { id: "consent-credit", label: "12. Consent, Credit & Compensation" },
  { id: "risk", label: "13. Risk Management & Feedback" },
  { id: "privacy", label: "14. Digital Privacy & Access Controls" },
  { id: "environmental", label: "15. Environmental Responsibility" },
  { id: "training", label: "16. Training & Continuous Improvement" },
  { id: "appendix-a", label: "Appendix A: Incident Response Plan" },
  { id: "appendix-b", label: "Appendix B: What You Need to Know" },
];

export const PolicyTableOfContents = () => (
  <nav className="bg-card border border-border rounded-lg p-6 mb-8">
    <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
    <ol className="grid md:grid-cols-2 gap-1.5 text-sm">
      {sections.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary transition-colors">
            {s.label}
          </a>
        </li>
      ))}
    </ol>
  </nav>
);

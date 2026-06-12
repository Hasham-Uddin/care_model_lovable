// Facilitator Training Academy content
// Modular: levels contain lessons, lessons contain sections + a knowledge check

export interface QuizQuestion {
  q: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface LessonSection {
  heading: string;
  body: string; // supports simple markdown-ish: paragraphs separated by \n\n, "- " bullets
}

export interface Lesson {
  id: string;
  title: string;
  estMinutes: number;
  objectives: string[];
  sections: LessonSection[];
  quiz: QuizQuestion[];
}

export interface Level {
  id: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  badgeColor: string; // tailwind-friendly hex
  lessons: Lesson[];
}

export const PASS_THRESHOLD = 0.8;

export const LEVELS: Level[] = [
  {
    id: "foundations",
    number: 1,
    title: "Foundations of Community Facilitation",
    tagline: "Begin with people, values, and trust.",
    description:
      "Learn what community-based facilitation is, the values that guide it, and how to create the brave space your CARE Team needs to do real work together.",
    badgeColor: "#253B96",
    lessons: [
      {
        id: "f-1",
        title: "What is Community-Based Facilitation?",
        estMinutes: 10,
        objectives: [
          "Define community-based facilitation in your own words",
          "Distinguish a facilitator from a presenter or expert",
          "Name the facilitator's primary responsibility to the group",
        ],
        sections: [
          {
            heading: "Welcome",
            body:
              "A facilitator is not the smartest person in the room. A facilitator is the person who makes it possible for everyone in the room to share what they already know.\n\nIn the CARE Model, facilitators guide community members through a structured 12-meeting journey to surface lived experience, document community wisdom, and turn that wisdom into action and into anti-bias datasets that improve AI systems.",
          },
          {
            heading: "Facilitator vs. Presenter",
            body:
              "A presenter delivers content. A facilitator designs an experience.\n\n- Presenters talk; facilitators listen actively\n- Presenters answer; facilitators ask better questions\n- Presenters lead with expertise; facilitators lead with curiosity\n- Presenters own the outcome; facilitators steward the process",
          },
          {
            heading: "Your Primary Responsibility",
            body:
              "Your primary job is to protect the conditions for honest participation: psychological safety, equitable airtime, and a clear, repeatable process the group can trust.\n\nWhen those three are present, communities will tell you what they need. When they're missing, no curriculum will save you.",
          },
        ],
        quiz: [
          {
            q: "Which best describes a facilitator's role?",
            options: [
              "The expert who delivers correct answers",
              "The person who makes it possible for everyone to contribute",
              "The note-taker for the meeting",
              "The community's spokesperson",
            ],
            correctIndex: 1,
          },
          {
            q: "What are the three conditions a facilitator protects?",
            options: [
              "Snacks, seating, sound",
              "Psychological safety, equitable airtime, a clear process",
              "Slides, scripts, schedules",
              "Authority, accuracy, agenda",
            ],
            correctIndex: 1,
          },
          {
            q: "A facilitator leads primarily with…",
            options: ["Expertise", "Curiosity", "Authority", "Charisma"],
            correctIndex: 1,
          },
          {
            q: "True or false: a good facilitator does most of the talking.",
            options: ["True", "False"],
            correctIndex: 1,
          },
          {
            q: "In the CARE Model, community members are the source of…",
            options: [
              "Errors to be corrected",
              "Lived experience and community wisdom",
              "Funding",
              "Approval signatures",
            ],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "f-2",
        title: "The 3 C's: Credit, Consent, Compensation",
        estMinutes: 8,
        objectives: [
          "Recall the meaning of each of the 3 C's",
          "Explain why all three are non-negotiable in community work",
          "Apply the 3 C's to a real facilitation scenario",
        ],
        sections: [
          {
            heading: "Why the 3 C's",
            body:
              "Communities have been studied, mined, and extracted from for generations. The 3 C's are MEASURE's commitment that this work will be different.",
          },
          {
            heading: "Credit",
            body:
              "The community is the author. When their wisdom shapes a strategy, a dataset, or a decision — name them. In documents, in presentations, in publications.",
          },
          {
            heading: "Consent",
            body:
              "Nothing about the community moves forward without their informed, revocable agreement. This includes whether their interrogation data becomes part of an anti-bias dataset (Data Contribution is strictly opt-in).",
          },
          {
            heading: "Compensation",
            body:
              "Time, expertise, and lived experience have value. Communities that contribute should be meaningfully acknowledged and rewarded over time.",
          },
        ],
        quiz: [
          {
            q: "What does the first C stand for?",
            options: ["Clarity", "Credit", "Care", "Curiosity"],
            correctIndex: 1,
          },
          {
            q: "Consent in this work must be…",
            options: [
              "Verbal only",
              "Implied by attendance",
              "Informed and revocable",
              "Permanent once given",
            ],
            correctIndex: 2,
          },
          {
            q: "Data Contribution to anti-bias datasets is…",
            options: [
              "Required for all projects",
              "Strictly opt-in",
              "Decided by the facilitator",
              "Automatic after Meeting 12",
            ],
            correctIndex: 1,
          },
          {
            q: "Compensation acknowledges that communities bring…",
            options: [
              "Free labor",
              "Time, expertise, and lived experience",
              "Mostly opinions",
              "Nothing of monetary value",
            ],
            correctIndex: 1,
          },
          {
            q: "If a group consents in Meeting 1 but changes their mind in Meeting 4, you should…",
            options: [
              "Tell them it's too late",
              "Honor the change and update the project's contribution setting",
              "Ask them to vote again next month",
              "Ignore it; only the leader's consent matters",
            ],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "f-3",
        title: "Creating Brave Space",
        estMinutes: 10,
        objectives: [
          "Distinguish 'safe space' from 'brave space'",
          "Open a meeting with a values-based icebreaker",
          "Name two moves to repair when trust breaks",
        ],
        sections: [
          {
            heading: "From Safe to Brave",
            body:
              "A 'safe space' promises no harm — a promise no facilitator can keep. A 'brave space' promises something more honest: we will tell the truth, we will stay in the discomfort that real conversations require, and we will repair when we cause harm.",
          },
          {
            heading: "Open with Values",
            body:
              "Every CARE Model meeting begins with a 5-minute values-based icebreaker. This isn't filler — it's how you name what the room cares about before you ask the room to do hard work.\n\n- Keep it under 5 minutes\n- Invite, don't demand\n- Model vulnerability by going first",
          },
          {
            heading: "When Trust Breaks",
            body:
              "It will. Two moves that help:\n\n- Name what you noticed without blaming: 'I'm sensing the room got quieter after that comment.'\n- Offer a small reset: 'Let's take 60 seconds, then I'd like to hear from someone who hasn't spoken yet.'",
          },
        ],
        quiz: [
          {
            q: "A 'brave space' promises…",
            options: [
              "No discomfort will occur",
              "Truth-telling and repair",
              "All voices will agree",
              "The facilitator will protect everyone from criticism",
            ],
            correctIndex: 1,
          },
          {
            q: "How long should the values-based icebreaker take?",
            options: ["1 minute", "About 5 minutes", "20 minutes", "As long as it takes"],
            correctIndex: 1,
          },
          {
            q: "When you sense the room shut down, the best first move is to…",
            options: [
              "Push through the agenda",
              "Name what you noticed and offer a small reset",
              "End the meeting early",
              "Call out the person you think caused it",
            ],
            correctIndex: 1,
          },
          {
            q: "Modeling vulnerability means…",
            options: [
              "Sharing every personal story you have",
              "Going first when you ask the group to share",
              "Telling the group your weaknesses as a facilitator",
              "Avoiding eye contact",
            ],
            correctIndex: 1,
          },
          {
            q: "True or false: a facilitator can guarantee a 'safe space.'",
            options: ["True", "False"],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
  {
    id: "care-tir",
    number: 2,
    title: "The CARE Model & TIR",
    tagline: "Master the curriculum and the questioning framework.",
    description:
      "Understand the 12-meeting CARE Model arc and the Theory of Interrogative Reasoning that powers how communities evaluate AI outputs.",
    badgeColor: "#E8973E",
    lessons: [
      {
        id: "c-1",
        title: "The 12-Meeting CARE Model Arc",
        estMinutes: 10,
        objectives: [
          "Describe the purpose of each phase of the CARE arc",
          "Identify which meeting produces the Mobilization Guide",
          "Explain why list-based deliverables matter",
        ],
        sections: [
          {
            heading: "The Arc",
            body:
              "The 12 meetings move a community from naming the problem to mobilizing a strategy:\n\n- Meetings 1-3: Frame the problem and the people\n- Meetings 4-7: Surface assets, barriers, and stakeholders\n- Meetings 8-10: Design the response\n- Meetings 11-12: Mobilize and sustain",
          },
          {
            heading: "Why Lists",
            body:
              "Most deliverables are list-based on purpose. Lists are easier for communities to co-create, easier to revise, and they translate cleanly into the structured data that powers anti-bias AI training.",
          },
          {
            heading: "The Mobilization Guide",
            body:
              "By the end of the arc, the platform compiles your group's outputs into a branded Mobilization Guide — a strategic plan the community owns and can share.",
          },
        ],
        quiz: [
          {
            q: "How many meetings are in the CARE Model arc?",
            options: ["6", "10", "12", "16"],
            correctIndex: 2,
          },
          {
            q: "Most session deliverables are formatted as…",
            options: ["Essays", "Lists", "Slide decks", "Audio recordings"],
            correctIndex: 1,
          },
          {
            q: "The Mobilization Guide is…",
            options: [
              "A facilitator handbook",
              "A community-owned strategic plan compiled at the end of the arc",
              "An invoice template",
              "A consent form",
            ],
            correctIndex: 1,
          },
          {
            q: "Meetings 1-3 focus on…",
            options: [
              "Mobilizing the strategy",
              "Framing the problem and the people",
              "Designing the response",
              "Final reporting",
            ],
            correctIndex: 1,
          },
          {
            q: "List-based deliverables also help because they…",
            options: [
              "Look professional",
              "Translate cleanly into structured data for anti-bias training",
              "Are required by law",
              "Are shorter to read",
            ],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "c-2",
        title: "Theory of Interrogative Reasoning (TIR)",
        estMinutes: 12,
        objectives: [
          "State the 3 core questions of TIR",
          "Recall the 5 tenets that shape good interrogation",
          "Apply TIR to a sample AI output",
        ],
        sections: [
          {
            heading: "Why Interrogate AI",
            body:
              "AI outputs sound confident even when they're wrong, biased, or irrelevant to your community. TIR gives your group a shared way to push back.",
          },
          {
            heading: "The 3 Core Questions",
            body:
              "1. Who is missing from this answer?\n2. Whose belief shaped this answer?\n3. Is this answer timely and relevant to us right now?",
          },
          {
            heading: "The 5 Tenets",
            body:
              "- Proximity: Closeness to the lived experience matters\n- Belief: Every output reflects someone's worldview\n- Timing: Context changes; truth has a clock\n- Power: Who benefits from this framing?\n- Repair: Naming a problem includes proposing a fix",
          },
        ],
        quiz: [
          {
            q: "How many core questions are in TIR?",
            options: ["1", "3", "5", "7"],
            correctIndex: 1,
          },
          {
            q: "Which is NOT one of the 5 tenets?",
            options: ["Proximity", "Belief", "Profit", "Repair"],
            correctIndex: 2,
          },
          {
            q: "'Whose belief shaped this answer?' addresses which tenet most directly?",
            options: ["Timing", "Belief", "Proximity", "Repair"],
            correctIndex: 1,
          },
          {
            q: "Repair as a tenet means…",
            options: [
              "Apologize for the AI",
              "Naming a problem includes proposing a fix",
              "Restart the AI tool",
              "Edit the AI's response in place",
            ],
            correctIndex: 1,
          },
          {
            q: "TIR is most useful when AI outputs are…",
            options: [
              "Obviously wrong",
              "Confident-sounding but possibly biased or incomplete",
              "Short",
              "Written by the facilitator",
            ],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "c-3",
        title: "Anti-Bias Datasets & The Bigger Picture",
        estMinutes: 8,
        objectives: [
          "Explain how community interrogations become training data",
          "Describe what 'anti-bias dataset' means in this context",
          "Understand why opt-in matters for the dataset's integrity",
        ],
        sections: [
          {
            heading: "From Conversation to Dataset",
            body:
              "Each interrogation your group records — the original AI output, the community's critique, and the refined answer — becomes a structured row in a potential anti-bias dataset.",
          },
          {
            heading: "What 'Anti-Bias' Actually Means",
            body:
              "It does not mean 'bias-free.' It means a dataset built deliberately from voices most often left out, with full provenance, so the AI systems trained on it inherit a wider sense of who counts.",
          },
          {
            heading: "Why Opt-In Matters",
            body:
              "A dataset built without consent is just extraction. Opt-in protects communities and protects the dataset's credibility with the researchers and organizations who use it.",
          },
        ],
        quiz: [
          {
            q: "An interrogation row typically captures…",
            options: [
              "Only the final refined answer",
              "Original output, community critique, and refined answer",
              "Just the question asked",
              "Audio of the meeting",
            ],
            correctIndex: 1,
          },
          {
            q: "'Anti-bias' in this context means…",
            options: [
              "Bias-free",
              "Built deliberately from voices most often left out, with provenance",
              "Auto-generated by AI",
              "Reviewed by lawyers",
            ],
            correctIndex: 1,
          },
          {
            q: "Data Contribution is…",
            options: ["Required", "Opt-in", "Decided by the platform", "Random"],
            correctIndex: 1,
          },
          {
            q: "Without consent, gathering community data is…",
            options: ["Efficient", "Extraction", "Required by law", "Recommended"],
            correctIndex: 1,
          },
          {
            q: "Opt-in protects…",
            options: [
              "Only the community",
              "Only the dataset",
              "Both the community and the dataset's credibility",
              "Neither",
            ],
            correctIndex: 2,
          },
        ],
      },
    ],
  },
  {
    id: "platform",
    number: 3,
    title: "Using the WeMeasure Platform",
    tagline: "Run a session end-to-end with confidence.",
    description:
      "A guided tour of every screen and workflow you'll touch — projects, sessions, the 5-step workflow, auto-save, completion tracking, and inviting your CARE Team.",
    badgeColor: "#F9D448",
    lessons: [
      {
        id: "p-1",
        title: "Projects, Sessions, and Your CARE Team",
        estMinutes: 8,
        objectives: [
          "Create a project and link it to an organization",
          "Invite a CARE Team Leader and CARE Team Members",
          "Understand the difference between system roles and project roles",
        ],
        sections: [
          {
            heading: "Project = One CARE Model Cohort",
            body:
              "Think of a project as one community cohort going through the 12-meeting arc. Each project belongs to an organization and has one facilitator.",
          },
          {
            heading: "Two Kinds of Roles",
            body:
              "- System roles (admin, facilitator, monitor) come from the user's account\n- Project roles (CARE Team Leader, CARE Team Member) are scoped to a single project\n\nA single user can be a facilitator at the system level AND a CARE Team Member on someone else's project.",
          },
          {
            heading: "Inviting Your Team",
            body:
              "From Project Detail, use 'Invite Team' to send magic-link invitations. Invitees receive an email and click to join — no separate signup flow.",
          },
        ],
        quiz: [
          {
            q: "A project represents…",
            options: [
              "A facilitator's career",
              "One community cohort going through the 12-meeting arc",
              "A single meeting",
              "An organization",
            ],
            correctIndex: 1,
          },
          {
            q: "Which is a project role (not a system role)?",
            options: ["Admin", "Monitor", "CARE Team Leader", "Facilitator"],
            correctIndex: 2,
          },
          {
            q: "How are team members invited?",
            options: [
              "They sign up themselves",
              "Facilitator sends a magic-link email invitation",
              "Imported from a CSV",
              "Added by an admin only",
            ],
            correctIndex: 1,
          },
          {
            q: "Can one person hold a system role AND a project role on a different project?",
            options: ["No, never", "Only admins can", "Yes", "Only with permission from MEASURE"],
            correctIndex: 2,
          },
          {
            q: "Each project belongs to…",
            options: ["A user", "An organization", "A meeting", "A dataset"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "p-2",
        title: "The 5-Step Session Workflow",
        estMinutes: 12,
        objectives: [
          "Name the 5 steps in order",
          "Explain what happens in each step",
          "Mark a session complete the right way",
        ],
        sections: [
          {
            heading: "The Five Steps",
            body:
              "1. Watch — view the meeting tutorial video\n2. Fill — capture the community's responses to the guiding questions\n3. Ask AI — get a draft synthesis from the AI Co-Facilitator\n4. Interrogate — apply TIR to the AI's draft as a group\n5. Refine — record the community's revised, owned answer",
          },
          {
            heading: "Why the Order Matters",
            body:
              "Watch before Fill so the group has shared context. Fill before Ask AI so the AI has community input to work with — never the reverse. Interrogate before Refine so the refinement is informed.",
          },
          {
            heading: "Marking Complete",
            body:
              "A session can only be marked complete when 'Next Steps' is filled in. This is intentional — it forces every meeting to end with action.",
          },
        ],
        quiz: [
          {
            q: "The 5 steps in order are…",
            options: [
              "Fill, Watch, Ask AI, Refine, Interrogate",
              "Watch, Fill, Ask AI, Interrogate, Refine",
              "Ask AI, Watch, Fill, Refine, Interrogate",
              "Watch, Ask AI, Fill, Refine, Interrogate",
            ],
            correctIndex: 1,
          },
          {
            q: "What happens in 'Interrogate'?",
            options: [
              "AI generates the answer",
              "The group applies TIR to the AI's draft",
              "Notes are emailed",
              "The session is closed",
            ],
            correctIndex: 1,
          },
          {
            q: "What's required to mark a session complete?",
            options: ["A signature", "Next Steps filled in", "Admin approval", "All members present"],
            correctIndex: 1,
          },
          {
            q: "Why fill before asking AI?",
            options: [
              "It's faster",
              "So the AI has the community's input to work with",
              "It saves tokens",
              "It's not required",
            ],
            correctIndex: 1,
          },
          {
            q: "Refine is where…",
            options: [
              "AI rewrites itself",
              "The community records its revised, owned answer",
              "The facilitator edits notes",
              "The session is exported",
            ],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "p-3",
        title: "Auto-Save, Continuity, and Exports",
        estMinutes: 8,
        objectives: [
          "Trust the auto-save behavior",
          "Find context from previous sessions",
          "Export a Mobilization Guide",
        ],
        sections: [
          {
            heading: "Auto-Save",
            body:
              "Most text fields auto-save 3 seconds after you stop typing. Look for the small 'Saving…' / 'Saved' indicator. You don't need a save button.",
          },
          {
            heading: "Cross-Session Continuity",
            body:
              "Previous-session reference panels appear inside later sessions to remind the group what they decided. Use them — communities forget, and continuity is your job.",
          },
          {
            heading: "Exports",
            body:
              "From Project Detail you can export the Mobilization Guide PDF at any time after Meeting 1. It's safe to share with funders, partners, and the community itself.",
          },
        ],
        quiz: [
          {
            q: "How long after you stop typing does auto-save fire?",
            options: ["Immediately", "1 second", "3 seconds", "30 seconds"],
            correctIndex: 2,
          },
          {
            q: "What confirms a successful auto-save?",
            options: ["A toast notification", "The 'Saved' indicator near the field", "An email", "Nothing"],
            correctIndex: 1,
          },
          {
            q: "Previous-session references are there to…",
            options: [
              "Audit the facilitator",
              "Remind the group what they decided",
              "Train the AI",
              "Generate the Mobilization Guide",
            ],
            correctIndex: 1,
          },
          {
            q: "When can you export the Mobilization Guide?",
            options: [
              "Only after Meeting 12",
              "Any time after Meeting 1",
              "Only if you're an admin",
              "After admin approval",
            ],
            correctIndex: 1,
          },
          {
            q: "True or false: you must click Save after editing a text field.",
            options: ["True", "False"],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
  {
    id: "advanced",
    number: 4,
    title: "Advanced Facilitation & Data Stewardship",
    tagline: "Lead difficult moments. Steward community data.",
    description:
      "Tools for the harder parts of the work: navigating disagreement, applying the AI Acceptable Use Policy, managing Data Contribution opt-in, and using the printable fallback when systems fail.",
    badgeColor: "#1f2c6e",
    lessons: [
      {
        id: "a-1",
        title: "Navigating Disagreement",
        estMinutes: 10,
        objectives: [
          "Recognize productive vs. destructive conflict",
          "Use one technique to redistribute airtime",
          "Close a hard conversation without forcing consensus",
        ],
        sections: [
          {
            heading: "Conflict Is Information",
            body:
              "Disagreement usually means two people are telling the truth from two different vantage points. Your job isn't to pick a winner — it's to make both vantage points visible to the room.",
          },
          {
            heading: "Redistribute Airtime",
            body:
              "When one voice dominates, try: 'I want to make sure we hear from someone who hasn't spoken on this yet.' Then wait — silence is part of the technique.",
          },
          {
            heading: "Close Without Consensus",
            body:
              "You don't need to agree to make progress. Try: 'We've named two real perspectives here. Let's record both in our notes and see how they land in next week's meeting.'",
          },
        ],
        quiz: [
          {
            q: "Disagreement in a CARE meeting is best treated as…",
            options: ["A failure", "Information about different vantage points", "A reason to end early", "The leader's problem"],
            correctIndex: 1,
          },
          {
            q: "A technique to redistribute airtime is to…",
            options: [
              "Call on the quietest person by name",
              "Invite anyone who hasn't spoken yet, then wait in silence",
              "Skip ahead in the agenda",
              "Ask the dominant speaker to leave",
            ],
            correctIndex: 1,
          },
          {
            q: "You can close a hard conversation by…",
            options: [
              "Forcing a vote",
              "Recording both perspectives and revisiting later",
              "Telling people to be respectful",
              "Ending the meeting immediately",
            ],
            correctIndex: 1,
          },
          {
            q: "Silence after a question is…",
            options: ["A failure", "Part of the technique", "A signal to move on", "Awkward and to be avoided"],
            correctIndex: 1,
          },
          {
            q: "Consensus is…",
            options: [
              "Always required to move forward",
              "Not required to make progress",
              "The facilitator's responsibility",
              "Decided by majority vote only",
            ],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "a-2",
        title: "AI Acceptable Use & Data Contribution",
        estMinutes: 10,
        objectives: [
          "Summarize the AI Acceptable Use Policy in your own words",
          "Toggle Data Contribution opt-in for a project",
          "Explain to a community what changes when they opt in",
        ],
        sections: [
          {
            heading: "Acceptable Use, In Plain Words",
            body:
              "Use the AI Co-Facilitator to draft, summarize, and surface patterns. Do not use it to make decisions for the community, to identify individuals, or to replace community voice.",
          },
          {
            heading: "Toggling Opt-In",
            body:
              "From Project Detail, the Data Contribution setting can be turned on or off at any time. Communities can opt in after starting and can opt out later — and you must honor both directions.",
          },
          {
            heading: "What Opting In Means",
            body:
              "Anonymized interrogation rows from this project may be included in future anti-bias datasets. The community is named in provenance metadata, and the organization is tracked for future acknowledgment.",
          },
        ],
        quiz: [
          {
            q: "The AI Co-Facilitator should be used to…",
            options: [
              "Make decisions for the community",
              "Draft, summarize, and surface patterns",
              "Identify individuals in the group",
              "Replace community voice",
            ],
            correctIndex: 1,
          },
          {
            q: "Data Contribution opt-in is…",
            options: ["One-time and permanent", "Adjustable at any time on Project Detail", "Set only by admins", "Auto-enabled at Meeting 6"],
            correctIndex: 1,
          },
          {
            q: "When a community opts in, the rows shared are…",
            options: ["Identified", "Anonymized", "Audio recordings", "Photos"],
            correctIndex: 1,
          },
          {
            q: "If a community opts out mid-project, you should…",
            options: ["Refuse", "Honor it and update the setting", "Wait until Meeting 12", "Escalate to the funder"],
            correctIndex: 1,
          },
          {
            q: "Communities are acknowledged in opted-in datasets via…",
            options: ["Public photos", "Provenance metadata", "Press releases", "Nothing"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "a-3",
        title: "When Systems Fail: The Printable Fallback",
        estMinutes: 6,
        objectives: [
          "Locate the printable worksheet and quickstart PDFs",
          "Run a meeting offline using paper",
          "Transcribe paper notes back into the platform",
        ],
        sections: [
          {
            heading: "Stuff Happens",
            body:
              "Wifi drops. Sites go down. Meetings still happen. Every facilitator should have the printable CARE Model Worksheets PDF and the Quickstart One-Pager saved locally.",
          },
          {
            heading: "Running on Paper",
            body:
              "The printable worksheets mirror the platform: same guiding questions, same deliverable structure. Run the 5-step workflow on paper, then transcribe later.",
          },
          {
            heading: "Transcribing Back",
            body:
              "When you're back online, log into the corresponding session and paste the community's responses into the Fill step. Then run Ask AI → Interrogate → Refine as a follow-up async or in the next meeting.",
          },
        ],
        quiz: [
          {
            q: "If the platform is down mid-meeting, you should…",
            options: ["Cancel", "Use the printable worksheets and transcribe later", "Wait silently", "Improvise a new curriculum"],
            correctIndex: 1,
          },
          {
            q: "The printable worksheets mirror the platform's…",
            options: ["Branding only", "Guiding questions and deliverable structure", "Login flow", "Pricing"],
            correctIndex: 1,
          },
          {
            q: "Where do paper notes go later?",
            options: [
              "Stored in a binder",
              "Pasted into the Fill step of the corresponding session",
              "Emailed to MEASURE",
              "Discarded",
            ],
            correctIndex: 1,
          },
          {
            q: "Every facilitator should have the printable PDFs…",
            options: ["Memorized", "Saved locally", "Printed for every meeting", "Emailed weekly"],
            correctIndex: 1,
          },
          {
            q: "After transcription, the AI steps can be run…",
            options: ["Never", "Async or in the next meeting", "Only by admins", "Only on paper"],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
];

export const ALL_LESSONS = LEVELS.flatMap((l) =>
  l.lessons.map((lesson) => ({ ...lesson, levelId: l.id, levelTitle: l.title, levelNumber: l.number })),
);

export function getLevel(id: string) {
  return LEVELS.find((l) => l.id === id);
}

export function getLessonWithLevel(lessonId: string) {
  for (const level of LEVELS) {
    const idx = level.lessons.findIndex((l) => l.id === lessonId);
    if (idx >= 0) {
      const lesson = level.lessons[idx];
      const next = level.lessons[idx + 1] ?? null;
      return { lesson, level, indexInLevel: idx, next };
    }
  }
  return null;
}

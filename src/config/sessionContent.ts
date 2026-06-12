// Session-specific content and guidance for each meeting type

export interface SessionContent {
  title: string;
  description: string;
  objectives: string[];
  guideQuestions: {
    input1: {
      label: string;
      placeholder: string;
      helpText: string;
    };
    input2: {
      label: string;
      placeholder: string;
      helpText: string;
    };
    input3?: {
      label: string;
      placeholder: string;
      helpText: string;
    };
  };
  tips: string[];
  examples?: string[];
  keyTerms?: { term: string; definition: string }[];
  videoUrl?: string; // Optional video tutorial URL for each meeting
}

// Video tutorials for each meeting (hardcoded paths)
// Some meetings may have multiple videos
import meeting2Video from "@/assets/meeting-2-tutorial.mp4.asset.json";
import meeting6Video from "@/assets/meeting-6-tutorial.mp4.asset.json";
import meeting7Video from "@/assets/meeting-7-tutorial.mp4.asset.json";
import meeting9Video from "@/assets/meeting-9-tutorial.mp4.asset.json";
import meeting10Video from "@/assets/meeting-10-tutorial.mp4.asset.json";
import meeting11Video from "@/assets/meeting-11-tutorial.mp4.asset.json";
import meeting12Video from "@/assets/meeting-12-tutorial.mp4.asset.json";

export const MEETING_VIDEOS: Record<number, string | string[]> = {
  1: "/videos/meeting-1-tutorial.mp4",
  2: meeting2Video.url,
  3: "/videos/meeting-3-tutorial.mp4",
  4: "/videos/meeting-4-tutorial.mp4",
  5: "/videos/meeting-5-tutorial.mp4",
  6: meeting6Video.url,
  7: meeting7Video.url,
  8: "/videos/meeting-8-tutorial.mp4",
  9: meeting9Video.url,
  10: meeting10Video.url,
  11: meeting11Video.url,
  12: meeting12Video.url,
};

export const SESSION_CONTENT: Record<number, SessionContent> = {
  1: {
    title: "Problem Statement",
    description: "Define the core challenge your community faces, centering community voices and avoiding deficit framing. Focus on systemic issues rather than individual shortcomings.",
    objectives: [
      "Articulate the problem from the community's perspective",
      "Identify root causes and systemic factors",
      "Describe the impact on community members",
      "Frame the problem as an opportunity for community-driven change"
    ],
    guideQuestions: {
      input1: {
        label: "What is the core problem your community is facing?",
        placeholder: "Describe the challenge as community members experience it, including systemic factors and historical context...",
        helpText: "Center the voices of those most impacted. Avoid deficit language like 'lacking' or 'broken.' Instead, describe barriers and systems that need change."
      },
      input2: {
        label: "Who is most affected and what strengths does the community bring?",
        placeholder: "Identify specific groups impacted and highlight existing community assets, networks, and resilience...",
        helpText: "Use asset-based framing. What resources, knowledge, and cultural strengths already exist in the community?"
      }
    },
    tips: [
      "Start with data and stories from community members",
      "Acknowledge historical context and systemic inequities",
      "Avoid using deficit language that blames the community",
      "Frame the problem in a way that centers community agency"
    ],
    examples: [
      "Instead of: 'Youth lack motivation and skills'",
      "Try: 'Youth face barriers to accessing quality mentorship and career pathways due to systemic underinvestment in community programs'"
    ],
    keyTerms: [
      { term: "Biases", definition: "Prejudice in favor of or against one issue, person, or group compared with another, usually in a way considered to be unfair." },
      { term: "Problem Statement", definition: "A concise description of an issue to be addressed or a condition to be improved upon. It identifies the gap between the current state and desired state of a process or product." },
      { term: "Core Values", definition: "Fundamental, intrinsic beliefs that guide your work." },
      { term: "Deficit Thinking", definition: "A lens that blames individuals from historically oppressed populations for the challenges they face—can perpetuate systemic inequities." }
    ]
  },
  
  2: {
    title: "Define Community",
    description: "Create a list of the specific community groups most impacted by the problem you defined. For each group, note who they are, why they're impacted, and what strengths they bring.",
    objectives: [
      "List each distinct community group impacted by the problem",
      "Describe each group with cultural context, not just demographics",
      "Identify each group's unique strengths and assets",
      "Recognize diversity and subgroups within your broader community"
    ],
    guideQuestions: {
      input1: {
        label: "List each community group most impacted by the problem",
        placeholder: "List each group on its own line. For each, include: who they are, why they're impacted, and their cultural context.\n\nExample:\n• Black families in East Side neighborhoods — most affected by school closures, strong church networks\n• Latino immigrant youth ages 14-19 — face language barriers in school, tight-knit family support systems\n• Senior residents in public housing — isolated by transit cuts, hold deep neighborhood history",
        helpText: "Be specific. Each line should name a distinct group. Go beyond demographics — include shared experiences, neighborhoods, and cultural identity."
      },
      input2: {
        label: "What strengths and assets does each group bring?",
        placeholder: "For each group listed above, note their strengths:\n\nExample:\n• Black families — church-based organizing, mutual aid traditions, elder mentorship\n• Latino immigrant youth — bilingual skills, peer networks, cultural pride\n• Senior residents — institutional memory, trusted voices, gathering spaces",
        helpText: "Use asset-based framing. What resources, knowledge, networks, and cultural strengths does each group already have?"
      },
      input3: {
        label: "What is your community feedback plan?",
        placeholder: "Describe how you will gather and document community feedback:\n\nExample:\n• Who will you reach out to for feedback? (e.g., parent groups, youth councils, neighborhood associations)\n• What methods will you use? (e.g., surveys, listening sessions, one-on-ones)\n• When and how often will you collect feedback?\n• How will you share findings back with the community?\n• What does a complete next step look like for your team?",
        helpText: "Walk through what your current feedback process looks like today, where it breaks down, and what a complete next step entry would include. Be specific about who, what, when, and how."
      }
    },
    tips: [
      "List each group separately — avoid combining everyone into one paragraph",
      "Use community members' own language to describe themselves",
      "Include intersectional identities and experiences",
      "Aim for 3-6 distinct groups that are most impacted"
    ],
    examples: [
      "• Single mothers under 25 in Westwood — navigating childcare deserts, strong informal babysitting networks",
      "• Black male youth ages 16-21 — over-policed, under-mentored, active in sports and music communities",
      "• Elderly homeowners on fixed incomes — facing displacement, hold deep community roots and institutional knowledge"
    ],
    keyTerms: [
      { term: "Community", definition: "A social unit (a group of living things) that shares common norms, religion, values, customs, or identity. Communities may share a sense of place situated in a given geographical area (e.g. a country, village, town, or neighbourhood) or in virtual space through communication platforms." },
      { term: "Demographic", definition: "Statistical data relating to the population and particular groups within it, such as age, race, or gender." },
      { term: "Racial Equity", definition: "The condition where racial identity no longer predicts outcomes. Achieving racial equity means addressing the root causes of inequities, not just their symptoms." },
      { term: "Community Feedback Plan", definition: "A structured plan for how you will gather, document, and act on feedback from the community groups you've identified. It ensures accountability and closes the loop between research and action." }
    ]
  },

  3: {
    title: "Historical Timeline",
    description: "Build a chronological list of key events, policies, and community milestones that shaped this problem. Each entry should include a date, what happened, and its impact.",
    objectives: [
      "List key historical events in chronological order",
      "Include policies, institutional decisions, and demographic shifts",
      "Document community organizing and resistance at each stage",
      "Connect each event to present-day conditions"
    ],
    guideQuestions: {
      input1: {
        label: "List key events, policies, and decisions in chronological order",
        placeholder: "Add one event per line with a date and brief description.\n\nExample:\n• 1965 — Highway construction displaces 2,000 Black families from neighborhood core\n• 1985 — Community members organize first tenant rights coalition\n• 2003 — City rezoning attracts developers, rents begin rising\n• 2010 — School district closes neighborhood school, increasing commutes\n• 2020 — Pandemic exposes lack of broadband access in public housing",
        helpText: "Go back as far as relevant — at least 2-3 generations. Name specific policies, decisions, and institutions. Include dates even if approximate."
      },
      input2: {
        label: "List community responses and resistance at each stage",
        placeholder: "For each period above, note how the community organized or responded.\n\nExample:\n• 1965 — Displaced families formed mutual aid networks in new neighborhoods\n• 1985 — Tenant coalition won first rent stabilization agreement\n• 2010 — Parents organized bus routes and after-school programs\n• 2020 — Youth-led WiFi hotspot campaign connected 300 households",
        helpText: "History isn't just what happened TO the community — it's also what the community DID. List victories, campaigns, and lessons learned."
      }
    },
    tips: [
      "One event per line — keep entries concise",
      "Include both oppressive policies and community resistance",
      "Use approximate dates if exact ones aren't known",
      "Name specific policies, institutions, and decision-makers"
    ],
    examples: [
      "• 1960s — Urban renewal demolishes 500 homes, no relocation assistance",
      "• 1985 — Community members organize the first tenant rights coalition",
      "• 2010 — School district closes neighborhood school, 400 students displaced"
    ],
    keyTerms: [
      { term: "Timeline", definition: "A chronological arrangement of events in the order of their occurrence." },
      { term: "Historical Context", definition: "The social, political, cultural, economic, and environmental situations that influence the events or trends we see happen during that time." }
    ]
  },

  4: {
    title: "Invested Parties",
    description: "Create a list of all stakeholders who have power, interest, or impact in this issue. For each, note their role, interests, power level, and alignment.",
    objectives: [
      "List all stakeholders — community members, institutions, and decision-makers",
      "Note each stakeholder's interests and motivations",
      "Assess each stakeholder's power level (high/medium/low)",
      "Identify potential allies and opposition"
    ],
    guideQuestions: {
      input1: {
        label: "List all stakeholders involved in this issue",
        placeholder: "Add one stakeholder per line with their role and interest.\n\nExample:\n• Community youth (ages 14-21) — directly affected, seeking voice and opportunity\n• School district leadership — controls resources, focused on test scores\n• Local church network — trusted by families, provides gathering space\n• City council member (District 5) — controls zoning decisions, seeking re-election\n• Regional hospital system — major employer, expanding into neighborhood",
        helpText: "Include both formal stakeholders (institutions, officials) and informal ones (community leaders, networks). Think about who makes decisions and who is affected by them."
      },
      input2: {
        label: "Rate each stakeholder's power and alignment",
        placeholder: "For each stakeholder, note their power level and whether they support or resist change.\n\nExample:\n• Community youth — Low power, High impact, Allies (want change)\n• School district — High power, Medium interest, Mixed (open to dialogue)\n• Church network — Medium power, High trust, Allies (active supporters)\n• City council member — High power, Low interest, Neutral (needs persuasion)\n• Hospital system — High power, Low interest, Opposition (benefits from status quo)",
        helpText: "Map the power landscape. Who maintains the status quo? Who would benefit from change? What coalitions could shift the balance?"
      }
    },
    tips: [
      "List each stakeholder separately — one per line",
      "Include community members as key stakeholders, not just institutions",
      "Rate power as High / Medium / Low for each",
      "Note whether each is an Ally, Neutral, or Opposition"
    ],
    examples: [
      "• Community Youth — Low power, High impact, Allies",
      "• School District — High power, Medium interest, Mixed",
      "• Local Elders — Medium power, High trust, Allies"
    ],
    keyTerms: [
      { term: "Invested Party", definition: "A person or organization with an interest or concern in your cause. They help will support the mission and provide benefit." }
    ]
  },

  5: {
    title: "Data Storytelling",
    description: "List the data sources that tell your community's story. For each, note what it reveals and what context is missing. Pair data points with lived experience.",
    objectives: [
      "List available data sources and what each reveals",
      "Identify gaps and biases in existing data",
      "Pair each data point with community-voiced context",
      "Challenge misleading narratives in existing data"
    ],
    guideQuestions: {
      input1: {
        label: "List each data source and what it reveals",
        placeholder: "Add one data source per line with key findings.\n\nExample:\n• Census data (2020) — median household income $28K, 40% below poverty line\n• School district report cards — 65% graduation rate, but 90% for students with mentors\n• Community health survey (2023) — 1 in 3 residents report food insecurity\n• Police department stats — arrest rates 3x higher than neighboring districts\n• Our own community survey (150 responses) — 80% say transit is biggest barrier",
        helpText: "Include both official data (census, government reports) and community-generated data (surveys, interviews). Note the source and year for each."
      },
      input2: {
        label: "What community stories contextualize each data point?",
        placeholder: "For each data point above, add the lived experience behind it.\n\nExample:\n• '40% poverty rate' — Many residents work 2-3 jobs but wages haven't kept up with rent increases since 2015\n• '65% graduation rate' — Parents report schools lack bilingual staff; students translate for parents instead of attending class\n• 'Food insecurity' — Nearest grocery store is 4 miles away; corner stores charge 2x markup\n• 'High arrest rates' — Youth describe being stopped walking to school; no diversion programs exist",
        helpText: "Data without context can mislead. What do community members say about these numbers? What's missing from official data?"
      }
    },
    tips: [
      "One data source per line — note the source and year",
      "Question who collected the data and for what purpose",
      "Pair every statistic with community voice",
      "Identify what data is missing or never collected"
    ],
    examples: [
      "• Official data: 'Low parent engagement' → Community context: no translation services, meetings scheduled during work hours, no childcare provided"
    ]
  },

  6: {
    title: "Community Asset Mapping",
    description: "Create a categorized list of strengths, resources, and networks that already exist in the community. Organize by type: people, places, organizations, skills, and cultural assets.",
    objectives: [
      "List tangible assets: spaces, organizations, and services",
      "List intangible assets: skills, knowledge, and cultural practices",
      "Identify informal networks and trusted leaders",
      "Note connections and untapped potential between assets"
    ],
    guideQuestions: {
      input1: {
        label: "List community assets by category",
        placeholder: "Organize assets into categories. Add one per line.\n\nPeople & Leaders:\n• Mrs. Johnson — runs home daycare, mentors young mothers\n• Coach Rivera — trusted by youth, runs summer basketball league\n\nPlaces & Spaces:\n• Community church basement — hosts free weekly meals, 200 capacity\n• Barbershop on MLK Blvd — informal counseling space for men\n\nOrganizations & Services:\n• Neighborhood association — 45 active members, monthly meetings\n• Free clinic — open Saturdays, serves 100 patients/week\n\nSkills & Cultural Assets:\n• Local artists — create murals that tell community history\n• Elders — oral history tradition, knowledge of neighborhood changes",
        helpText: "Think broadly: Who are the natural leaders? What spaces bring people together? What skills and cultural practices exist? Include informal assets alongside formal ones."
      },
      input2: {
        label: "How could these assets be better connected or leveraged?",
        placeholder: "Note relationships between assets and untapped potential.\n\nExample:\n• Mrs. Johnson's daycare + Free clinic = potential parenting health workshops\n• Coach Rivera's youth network + Local artists = youth mural project\n• Church space + Neighborhood association = expanded community meeting venue\n• Elders' oral history + School curriculum = intergenerational learning program",
        helpText: "Assets are most powerful when connected. What collaborations could amplify impact? What resources are being underutilized?"
      }
    },
    tips: [
      "Organize by category: People, Places, Organizations, Skills, Culture",
      "Include both formal institutions and informal networks",
      "Recognize cultural knowledge and practices as assets",
      "Note connections and collaboration opportunities between assets"
    ],
    examples: [
      "• People: Mrs. Johnson — home daycare, mentors young mothers",
      "• Places: Church basement — free weekly meals, gathering space",
      "• Culture: Local artists create murals documenting community history"
    ]
  },

  7: {
    title: "Solutions Alignment",
    description: "List potential solutions that build on community assets and values. For each solution, note which assets it leverages, who leads it, and why it fits the community.",
    objectives: [
      "List solutions rooted in community assets identified in Meeting 6",
      "Note which community strengths each solution builds on",
      "Identify who in the community would lead each solution",
      "Prioritize solutions by feasibility and community support"
    ],
    guideQuestions: {
      input1: {
        label: "List solutions the community has proposed or tried before",
        placeholder: "One solution per line. Note what worked, what didn't, and why.\n\nExample:\n• After-school tutoring at church (2019) — Worked: kids attended; Failed: lost funding after 1 year\n• Community garden on vacant lot (2021) — Worked: brought neighbors together; Challenge: water access issues\n• Youth mentorship through barbershop (informal, ongoing) — Worked: trust-based, consistent; Limit: only reaches boys\n• Parent advocacy group at school (2020) — Worked: got bilingual aide hired; Challenge: burnout among leaders",
        helpText: "Center community wisdom. What has been tried? What worked and why? What lessons carry forward?"
      },
      input2: {
        label: "List new solutions that build on community assets",
        placeholder: "One solution per line. Note which assets it leverages and who leads.\n\nExample:\n• Train and pay community elders to tutor in native languages at church → Builds on: elder knowledge, church space, bilingual skills → Led by: Mrs. Johnson + church leadership\n• Expand barbershop mentorship to include girls via salon partnership → Builds on: trust-based model → Led by: Coach Rivera + salon owners\n• Youth-led mural project documenting community history → Builds on: local artists, elder oral history → Led by: youth council + artists",
        helpText: "Solutions should feel familiar and achievable. How do existing assets get mobilized? Who in the community champions each idea?"
      }
    },
    tips: [
      "One solution per line — keep them specific and actionable",
      "Link each solution to specific assets from Meeting 6",
      "Name who in the community would lead each",
      "Prioritize solutions the community is excited about"
    ],
    examples: [
      "Instead of: 'Bring in external tutoring program'",
      "Try: 'Train and compensate community elders to tutor in native languages at church — leverages elder knowledge, church space, and bilingual skills'"
    ]
  },

  8: {
    title: "Theory of Change I: Inputs & Activities",
    description: "Create two lists: (1) the resources/inputs needed and (2) the specific activities you'll implement. Each entry should be concrete and actionable.",
    objectives: [
      "List all resources and inputs needed to implement solutions",
      "List specific activities with enough detail to replicate",
      "Connect each activity to specific inputs it requires",
      "Ensure community participation is included as a key input"
    ],
    guideQuestions: {
      input1: {
        label: "List all resources and inputs needed",
        placeholder: "One resource per line. Include category and specifics.\n\nExample:\n• Funding — $15K for facilitator stipends, $5K for materials\n• Space — Church basement (donated, available Tues/Thurs evenings)\n• Staff — 2 community facilitators (part-time, 10 hrs/week each)\n• Materials — Bilingual workbooks, art supplies for youth sessions\n• Community time — 20 volunteer hours/month from parent network\n• Partnerships — School district (access to students), Free clinic (health data)",
        helpText: "Be realistic and specific. Don't forget community time and labor as key inputs. What will it actually take?"
      },
      input2: {
        label: "List specific activities you will implement",
        placeholder: "One activity per line. Include who, what, when, and where.\n\nExample:\n• Weekly tutoring sessions — Elders tutor youth in Spanish/English, Tuesdays 4-6pm at church\n• Monthly community dinners — Families share updates, first Friday at church, 50 attendees\n• Youth mural project — 10 sessions over summer, led by local artists at community center\n• Parent advocacy training — 6-week series, bilingual, Saturdays 10am at school library\n• Data collection walks — Youth document neighborhood conditions with cameras, biweekly",
        helpText: "Be specific enough that someone could replicate your approach. Who does what, when, where, and how often?"
      }
    },
    tips: [
      "One resource or activity per line",
      "Include community participation as a key input",
      "Be realistic about what's needed vs. what's available",
      "Activities should be specific: who, what, when, where"
    ]
  },

  9: {
    title: "Theory of Change II: Outcomes & Impact",
    description: "List expected outcomes in three tiers: short-term (0-6 months), medium-term (1-2 years), and long-term (3-5 years). Then state your assumptions.",
    objectives: [
      "List short-term outcomes (immediate outputs)",
      "List medium-term outcomes (behavioral and systemic shifts)",
      "Define long-term impact (community transformation)",
      "State assumptions that must hold for this theory to work"
    ],
    guideQuestions: {
      input1: {
        label: "List expected outcomes by timeframe",
        placeholder: "Organize outcomes into three tiers.\n\nShort-term (0-6 months):\n• 30 youth enrolled in tutoring program\n• 5 community elders trained as facilitators\n• 3 community dinners held with 50+ attendees each\n\nMedium-term (1-2 years):\n• Youth reading levels improve by 1 grade level\n• Parent advocacy group secures 2 bilingual aides\n• 3 murals completed, neighborhood identity strengthened\n\nLong-term (3-5 years):\n• Graduation rate increases from 65% to 80%\n• Community-led programs become self-sustaining\n• Policy changes reflect community priorities",
        helpText: "Be specific and realistic. Distinguish between outputs (things produced), outcomes (changes in behavior/conditions), and impact (systemic transformation)."
      },
      input2: {
        label: "List the assumptions underlying this theory of change",
        placeholder: "One assumption per line. Be honest about what must be true.\n\nExample:\n• Assumption: Church will continue donating space for at least 2 years\n• Assumption: School district will allow community facilitators in buildings\n• Assumption: Funding will be renewed after Year 1 based on outcomes\n• Assumption: Youth will attend consistently if sessions are engaging\n• Risk: Elder facilitators may need more training than budgeted\n• External factor: City budget cuts could reduce partner resources",
        helpText: "State assumptions explicitly. What external factors could affect success? What might you be taking for granted?"
      }
    },
    tips: [
      "Use three tiers: Short-term, Medium-term, Long-term",
      "Make each outcome specific and measurable where possible",
      "List assumptions honestly — they reveal risks",
      "Consider unintended consequences (positive and negative)"
    ]
  },

  10: {
    title: "Community Impact Metrics",
    description: "Create two lists: (1) quantitative metrics you'll track and (2) qualitative indicators of success. For each, note how and when you'll measure it.",
    objectives: [
      "List quantitative metrics with targets and measurement methods",
      "List qualitative indicators that reflect community-defined success",
      "Ensure metrics don't burden the community",
      "Plan for regular community feedback on whether metrics feel right"
    ],
    guideQuestions: {
      input1: {
        label: "List quantitative metrics with targets",
        placeholder: "One metric per line. Include what you'll measure, the target, and how.\n\nExample:\n• Program attendance — Target: 30 youth/week — Tracked via: sign-in sheets\n• Completion rate — Target: 80% finish full program — Tracked via: facilitator records\n• Reading level improvement — Target: 1 grade level gain — Tracked via: pre/post assessment\n• Parent meeting attendance — Target: 25 parents/month — Tracked via: sign-in sheets\n• Community dinner participation — Target: 50+ attendees — Tracked via: headcount",
        helpText: "Choose metrics that are meaningful AND feasible to collect. Don't track everything — focus on what matters most to the community."
      },
      input2: {
        label: "List qualitative indicators of success",
        placeholder: "One indicator per line. Include what you'll look for and how you'll capture it.\n\nExample:\n• Youth report feeling 'seen and supported' — Captured via: end-of-session check-ins\n• Parents describe feeling confident advocating at school — Captured via: quarterly interviews\n• Neighbors say they know more people on their block — Captured via: community dinner conversations\n• Elders report feeling valued and useful — Captured via: facilitator journals\n• Community members attend voluntarily (not just for incentives) — Observed by: facilitators",
        helpText: "Numbers don't tell the whole story. How will you know if people feel the work is making a difference? Let community define success."
      }
    },
    tips: [
      "One metric per line — include target and method",
      "Balance quantitative counts with qualitative feelings",
      "Avoid metrics that burden the community with paperwork",
      "Plan for regular check-ins: 'Are we measuring the right things?'"
    ],
    examples: [
      "• Quantitative: 80% of participants complete program — tracked via facilitator records",
      "• Qualitative: Youth report increased sense of belonging — captured via check-in conversations"
    ]
  },

  11: {
    title: "Data Collection Plan",
    description: "Build a structured plan: for each data point, specify what you'll collect, how, when, who's responsible, and how you'll protect privacy.",
    objectives: [
      "List each data point with collection method and schedule",
      "Assign responsibility for each data collection task",
      "Plan consent processes in community languages",
      "Define data ownership, security, and sharing policies"
    ],
    guideQuestions: {
      input1: {
        label: "List each data point with method, timing, and who's responsible",
        placeholder: "One data point per line. Use a consistent format.\n\nExample:\n• Attendance counts — Method: sign-in sheet — When: every session — Who: facilitator\n• Reading assessments — Method: standardized test — When: Month 1 and Month 6 — Who: tutor lead\n• Youth satisfaction — Method: 3-question check-in — When: end of each session — Who: peer mentor\n• Parent feedback — Method: bilingual survey (paper + phone) — When: quarterly — Who: parent liaison\n• Community stories — Method: recorded interviews (with consent) — When: Month 3 and Month 12 — Who: youth media team",
        helpText: "Keep it practical. Only collect what you'll actually use. Minimize burden on community members — short surveys, natural touchpoints."
      },
      input2: {
        label: "How will you protect privacy and ensure community data ownership?",
        placeholder: "List specific protections and policies.\n\nExample:\n• Consent forms available in English, Spanish, and Haitian Creole\n• All survey responses anonymized before analysis\n• Interview recordings stored on encrypted drive, deleted after transcription\n• Community receives quarterly data summary at dinner meetings\n• No individual data shared with funders — only aggregate results\n• Community advisory board reviews all reports before publication\n• Participants can withdraw consent and have data removed at any time",
        helpText: "Community data belongs to the community. List specific protections. How can members access, review, and control their own data?"
      }
    },
    tips: [
      "One data point per line: What, How, When, Who",
      "Use culturally appropriate methods (oral, visual, multilingual)",
      "Ensure informed consent in community's languages",
      "Give community ownership and regular access to their data"
    ],
    examples: [
      "• Attendance — sign-in sheet — every session — facilitator",
      "• Youth feedback — 3-question check-in — weekly — peer mentor",
      "• Community stories — recorded interview — quarterly — youth media team"
    ]
  },

  12: {
    title: "Showcase & Sharing",
    description: "List your target audiences and, for each, the key message, format, and how community members will lead the storytelling.",
    objectives: [
      "List each audience and what they need to understand",
      "Choose the right format for each audience",
      "Plan community-led storytelling for each deliverable",
      "Ensure consent and community review before sharing anything"
    ],
    guideQuestions: {
      input1: {
        label: "List each audience and your key message for them",
        placeholder: "One audience per line with the core message and desired action.\n\nExample:\n• Funders — Message: Community-led model produces measurable outcomes — Action: Renew funding\n• School board — Message: Students thrive with culturally responsive support — Action: Adopt program partnership\n• Other communities — Message: This model is replicable with local adaptation — Action: Launch their own version\n• General public — Message: This neighborhood is building solutions, not waiting for rescue — Action: Support and respect\n• Community members — Message: Your participation created real change — Action: Continue and expand",
        helpText: "Different audiences need different stories. What does each audience need to understand, and what action do you want from them?"
      },
      input2: {
        label: "List the formats and who leads each",
        placeholder: "One deliverable per line. Note format, community lead, and consent process.\n\nExample:\n• Youth-designed presentation to school board — Led by: youth council — Consent: participants review slides\n• Photo/video exhibit at community center — Led by: youth media team — Consent: signed release for each photo\n• 2-page impact summary for funders — Led by: parent liaison — Consent: community advisory board reviews\n• Social media highlights (Instagram) — Led by: youth volunteers — Consent: opt-in only, faces blurred by default\n• Community celebration dinner — Led by: elders + families — Consent: N/A (private event)",
        helpText: "Community members should lead storytelling. Every format needs a consent process. Who reviews before anything goes public?"
      }
    },
    tips: [
      "One audience or deliverable per line",
      "Let community members tell their own stories",
      "Get explicit consent before sharing anything publicly",
      "Compensate community members for their time and expertise",
      "Celebrate wins honestly — include lessons learned"
    ],
    examples: [
      "• Youth-designed presentation to school board — led by youth council",
      "• Photovoice exhibit at community center — curated by participants",
      "• 2-page funder summary — reviewed by community advisory board"
    ]
  }
};

export const getSessionContent = (sessionNumber: number): SessionContent | null => {
  return SESSION_CONTENT[sessionNumber] || null;
};

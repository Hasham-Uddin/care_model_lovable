export interface IcebreakerContent {
  prompt: string;
  instruction: string;
}

export const ICEBREAKER_CONTENT: Record<number, IcebreakerContent> = {
  1: {
    prompt: "What is your core value as it relates to this project?",
    instruction: "Type your name and core value in the chat box and let's talk! Throughout this project, we will revisit these values to ensure they remain at the heart of our work together.",
  },
  2: {
    prompt: "What does community mean to you in one word?",
    instruction: "Share your word and a brief reason why it resonates with you.",
  },
  3: {
    prompt: "What is one thing from your community's history that you are proud of?",
    instruction: "Share briefly — this helps ground us in the strengths of our community.",
  },
  4: {
    prompt: "Who is someone in your community you admire and why?",
    instruction: "Share a name or role and one quality that inspires you.",
  },
  5: {
    prompt: "What is one core value from Meeting 1 that has stayed with you?",
    instruction: "Reflect on how that value has shown up in your work so far.",
  },
  6: {
    prompt: "What is one strength or asset in your community that often goes unrecognized?",
    instruction: "Share briefly — let's celebrate what's already working.",
  },
  7: {
    prompt: "What does equity look like in action to you?",
    instruction: "Share one example, big or small, from your own experience.",
  },
  8: {
    prompt: "What gives you hope about this project's potential impact?",
    instruction: "Share one reason you feel optimistic about the work ahead.",
  },
  9: {
    prompt: "How has your understanding of the problem changed since Meeting 1?",
    instruction: "Reflect briefly on how your perspective has evolved.",
  },
  10: {
    prompt: "What does meaningful impact look like for the people you serve?",
    instruction: "Share one concrete example of the change you want to see.",
  },
  11: {
    prompt: "What is one thing you've learned from a teammate during this project?",
    instruction: "Celebrate the collaborative knowledge you've built together.",
  },
  12: {
    prompt: "Looking back at your core value from Meeting 1 — how has it guided your work?",
    instruction: "Share how your values shaped the decisions and outcomes of this project.",
  },
};

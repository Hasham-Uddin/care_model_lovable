import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles, Trash2, Bot, User, Paperclip, X, FileText } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AttachedFile = {
  name: string;
  content: string;
  type: string;
};

const SUGGESTED_PROMPTS = [
  "How do I facilitate a difficult conversation about systemic racism in Session 1?",
  "Explain the Theory of Interrogative Reasoning and how to apply it during AI interrogation.",
  "What are some best practices for the icebreaker activity in Session 3?",
  "How should I guide my team through the Community Asset Mapping session?",
  "What does Measure's AI policy say about using AI-generated content?",
  "How do I help participants who are skeptical about using AI in community work?",
];

const ACCEPTED_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
  "application/pdf",
];

const ACCEPTED_EXTENSIONS = ".txt,.md,.csv,.json,.html,.pdf,.doc,.docx";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facilitator-coach`;

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    // For PDFs, read as base64 and let the edge function handle it via the AI model
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        resolve(`[PDF Document: ${file.name}]\n\nNote: PDF text extraction is limited in the browser. The document has been attached for AI analysis. If the content below appears garbled, please copy and paste the text directly.\n\n${text.substring(0, 50000)}`);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default function FacilitatorCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }

      if (attachedFiles.length >= 3) {
        toast.error("Maximum 3 files per message.");
        break;
      }

      try {
        const content = await extractTextFromFile(file);
        if (content.trim().length === 0) {
          toast.error(`Could not extract text from ${file.name}.`);
          continue;
        }
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, content: content.substring(0, 30000), type: file.type },
        ]);
        toast.success(`${file.name} attached.`);
      } catch {
        toast.error(`Failed to read ${file.name}.`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const streamChat = async (allMessages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("Please sign in to use the Facilitation Coach.");
      return;
    }
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (resp.status === 429) {
      toast.error("Rate limit exceeded. Please wait a moment.");
      return;
    }
    if (resp.status === 402) {
      toast.error("AI credits depleted.");
      return;
    }
    if (!resp.ok || !resp.body) {
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch { /* ignore */ }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if ((!messageText && attachedFiles.length === 0) || isLoading) return;

    // Build the user message content with attached documents
    let fullContent = messageText;
    if (attachedFiles.length > 0) {
      const docSections = attachedFiles
        .map(
          (f) =>
            `\n\n---\n📎 Attached Document: "${f.name}"\n---\n${f.content}\n---`
        )
        .join("");

      if (messageText) {
        fullContent = `${messageText}\n\n[The following documents have been attached for context:]${docSections}`;
      } else {
        fullContent = `Please review and analyze the following attached document(s):${docSections}`;
      }
    }

    const userMsg: Message = { role: "user", content: fullContent };
    const displayMsg: Message = {
      role: "user",
      content: messageText || `📎 Shared ${attachedFiles.length} document(s) for review`,
    };

    // For display, show a clean message; for AI, send full content
    const updatedDisplayMessages = [...messages, displayMsg];
    const updatedAiMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      userMsg,
    ];

    setMessages(updatedDisplayMessages);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      await streamChat(updatedAiMessages);
    } catch (e) {
      console.error("Chat error:", e);
      toast.error("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Facilitation Coach</h1>
              <p className="text-xs text-muted-foreground">
                CARE Model · TIR · Anti-Racism · DEI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="mr-1 h-3 w-3" /> AI-Powered
            </Badge>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMessages([])}
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border/50">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center max-w-md">
                  <h2 className="text-lg font-semibold mb-2">
                    Welcome, Facilitator!
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    I'm your CARE Model Facilitation Coach — grounded in the
                    Theory of Interrogative Reasoning, Measure's AI policies,
                    and anti-racist facilitation methods. How can I support you
                    today?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 You can attach documents (.txt, .md, .csv, .json, .pdf) using the 📎 button for the AI to analyze.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="text-left text-sm p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 border border-border/50"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/50 border border-border/50 rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="px-4 pt-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-muted/50 border border-border/50 rounded-md px-2.5 py-1.5 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-foreground ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 self-end h-10 w-10"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || attachedFiles.length >= 3}
                title="Attach a document"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about facilitation, CARE Model sessions, TIR, AI policy... or attach a document"
                rows={2}
                className="resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                size="icon"
                className="shrink-0 self-end h-10 w-10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Advisory only — AI outputs support your facilitation but do not
              replace community voice or lived experience.{" "}
              <a href="/ai-tool-policy" className="text-primary underline hover:no-underline">
                View AI Policy
              </a>
              {" · "}
              <span className="text-muted-foreground/70">
                📎 Supports .txt, .md, .csv, .json, .pdf (max 5MB, 3 files)
              </span>
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

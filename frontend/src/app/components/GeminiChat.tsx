import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { fetchChat } from "../api";

type Message = { role: "user" | "assistant"; content: string };

interface GeminiChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUBBLE_MAX_W = "max-w-[85%]";

export function GeminiChat({ open, onOpenChange }: GeminiChatProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuestion("");
      setMessages([]);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = () => {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    fetchChat(q)
      .then((r) => {
        setMessages((prev) => [...prev, { role: "assistant", content: r.response ?? "" }]);
      })
      .catch(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, the request failed." }]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-gray-200 pb-3">
          <SheetTitle className="text-base font-semibold">AI Assistant</SheetTitle>
          <p className="text-xs font-normal text-gray-500">
            Ask about bail data or judicial trends. Answers use judge data only.
          </p>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-hidden py-4">
          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${BUBBLE_MAX_W} ${
                    m.role === "user"
                      ? "bg-gray-900 text-white"
                      : "border border-gray-200 bg-gray-50 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 ${BUBBLE_MAX_W}`}>
                  …
                </div>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question…"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !question.trim()}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

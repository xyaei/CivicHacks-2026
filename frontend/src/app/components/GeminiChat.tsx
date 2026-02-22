import { useState, useEffect, useRef } from "react";
import { Volume2, Mic } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { fetchChat, playTts } from "../api";

type Message = { role: "user" | "assistant"; content: string };

interface GeminiChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUBBLE_MAX_W = "max-w-[85%]";

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
    : undefined;

export function GeminiChat({ open, onOpenChange }: GeminiChatProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognitionAPI>> | null>(null);

  useEffect(() => {
    if (!open) {
      setQuestion("");
      setMessages([]);
      if (recognitionRef.current && listening) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setListening(false);
      }
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = (options?: { text?: string; speakReply?: boolean }) => {
    const q = (options?.text ?? question).trim();
    if (!q || loading) return;
    const speakReply = options?.speakReply ?? false;
    if (options?.text === undefined) setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    fetchChat(q)
      .then((r) => {
        const reply = r.response ?? "";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        if (speakReply && reply) {
          playTts(reply).catch(() => {});
        }
      })
      .catch(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, the request failed." }]);
      })
      .finally(() => setLoading(false));
  };

  const startListening = () => {
    if (!SpeechRecognitionAPI || loading || listening) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += transcript;
      }
      if (finalTranscript.trim()) {
        try {
          recognition.stop();
        } catch {}
        setListening(false);
        send({ text: finalTranscript.trim(), speakReply: true });
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setListening(false);
    }
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
                className={`flex items-end gap-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}
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
                {m.role === "assistant" && m.content && (
                  <button
                    type="button"
                    onClick={() => {
                      if (speakingIndex !== null) return;
                      setSpeakingIndex(i);
                      playTts(m.content)
                        .finally(() => setSpeakingIndex(null));
                    }}
                    disabled={speakingIndex !== null}
                    className="shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                    title="Read aloud"
                  >
                    <Volume2 className="size-4" />
                  </button>
                )}
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
            {SpeechRecognitionAPI && (
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                disabled={loading}
                className={`shrink-0 rounded-md p-2.5 ${listening ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} disabled:opacity-50`}
                title={listening ? "Stop listening" : "Talk to AI (response will be read aloud)"}
              >
                <Mic className="size-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => send({})}
              disabled={loading || !question.trim()}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "…" : "Send"}
            </button>
          </div>
          {listening && (
            <p className="text-xs text-gray-500 shrink-0">Listening… speak now, then pause.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

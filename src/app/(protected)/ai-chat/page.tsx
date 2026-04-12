"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, FileText, BarChart3 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ContextData {
  projects: { id: string; name: string; number: string; budget: number; status: string }[];
  totalBudget: number;
  totalSpent: number;
  activeProjects: number;
}

const quickActions = [
  { label: "Total budget semua proyek", icon: Wallet },
  { label: "Proyek dengan budget terbesar", icon: TrendingUp },
  { label: "Ringkasan spending bulan ini", icon: BarChart3 },
  { label: "Cek budget alert", icon: AlertCircle },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Halo! Saya AI Assistant AXA Project. Saya bisa membantu Anda dengan:\n\n• **Query Keuangan**: \"Berapa total expense proyek 001?\"\n• **Analisis Proyek**: \"Proyek mana yang paling boros?\"\n• **Budget Forecast**: \"Kapan budget akan habis?\"\n• **自然 Language**: Cari data dalam Bahasa Indonesia\n\nTanyakan apapun tentang proyek dan keuangan Anda!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<ContextData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchContext = async () => {
    try {
      const [projectsRes, dashboardRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/dashboard"),
      ]);
      const projectsData = await projectsRes.json();
      const dashboardData = await dashboardRes.json();

      setContext({
        projects: projectsData.data || [],
        totalBudget: dashboardData.data?.totalBudget || 0,
        totalSpent: dashboardData.data?.totalSpent || 0,
        activeProjects: dashboardData.data?.activeProjects || 0,
      });
    } catch (error) {
      console.error("Failed to fetch context:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: context,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Terjadi kesalahan. Silakan coba lagi.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (label: string) => {
    setInput(label);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-10 pt-24 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold text-on-surface">AI Smart Pilot</h1>
        <p className="text-zinc-500 mt-1">Ask questions about your projects and finances</p>
      </div>

      {context && (
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <div className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-zinc-400">Total Budget:</span>
            <span className="text-xs font-headline font-bold text-on-surface">{formatCurrency(context.totalBudget)}</span>
          </div>
          <div className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-zinc-400">Total Spent:</span>
            <span className="text-xs font-headline font-bold text-on-surface">{formatCurrency(context.totalSpent)}</span>
          </div>
          <div className="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-zinc-400">Active Projects:</span>
            <span className="text-xs font-headline font-bold text-on-surface">{context.activeProjects}</span>
          </div>
        </div>
      )}

      <div className="flex-1 bg-surface-container-low rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-primary/20" : "bg-surface-container-highest"
              }`}>
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-primary" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className={`max-w-[70%] p-4 rounded-xl ${
                msg.role === "user"
                  ? "bg-primary/10 text-on-surface"
                  : "bg-surface-container-high text-zinc-300"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-zinc-600 mt-2">
                  {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-surface-container-high p-4 rounded-xl">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-surface-container-highest">
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.label)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-lg text-xs text-zinc-400 hover:text-zinc-300 hover:bg-surface-container-highest transition-colors whitespace-nowrap"
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your projects..."
              className="flex-1 bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="gold-gradient p-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-on-primary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
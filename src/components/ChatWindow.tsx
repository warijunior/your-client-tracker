import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Props {
  recipientId: string;
  recipientName: string;
  onBack: () => void;
}

const ChatWindow = ({ recipientId, recipientName, onBack }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchMessages();

    const channel = supabase
      .channel(`chat-${[user.id, recipientId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === user.id && msg.receiver_id === recipientId) ||
            (msg.sender_id === recipientId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            if (msg.sender_id === recipientId) {
              supabase.from("messages").update({ read: true }).eq("id", msg.id);
            }
          }
        }
      )
      .subscribe();

    // Mark unread messages as read
    supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", recipientId)
      .eq("receiver_id", user.id)
      .eq("read", false);

    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user!.id})`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: recipientId,
      content,
    });

    // Notification
    await supabase.from("notifications").insert({
      user_id: recipientId,
      title: "Nova mensagem",
      message: content.length > 50 ? content.slice(0, 50) + "..." : content,
      type: "chat",
    });

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">
            {recipientName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="font-semibold text-foreground text-sm">{recipientName}</h3>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Inicie a conversa enviando uma mensagem 💬
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem..."
            className="bg-secondary border-border flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            size="icon"
            className="gradient-primary text-primary-foreground shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

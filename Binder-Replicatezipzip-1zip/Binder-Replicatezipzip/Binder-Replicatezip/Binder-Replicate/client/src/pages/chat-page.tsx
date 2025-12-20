import { useConversations, useConversation, useCreateConversation, useSendMessage, useDeleteConversation } from "@/hooks/use-chat";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trash2, Send, MessageCircle, ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSendingLocal, setIsSendingLocal] = useState(false);

  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const { data: selectedConv, isLoading: loadingConv } = useConversation(selectedConvId || 0);
  const { mutate: createConv, isPending: creatingConv } = useCreateConversation();
  const { mutate: sendMessage, isPending: sendingMessage } = useSendMessage();
  const { mutate: deleteConv, isPending: deletingConv } = useDeleteConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConv?.messages]);

  const handleCreateChat = () => {
    createConv("New Chat", {
      onSuccess: (conversation) => {
        setSelectedConvId(conversation.id);
      },
    });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConvId) return;

    setIsSendingLocal(true);
    const userMessage = messageInput;
    setMessageInput("");

    sendMessage(
      { conversationId: selectedConvId, content: userMessage },
      {
        onSettled: () => {
          setIsSendingLocal(false);
        },
      }
    );
  };

  const handleDeleteConversation = (id: number) => {
    if (confirm("Delete this conversation?")) {
      deleteConv(id, {
        onSuccess: () => {
          if (selectedConvId === id) {
            setSelectedConvId(null);
          }
        },
      });
    }
  };

  return (
    <LayoutShell>
      <div className="flex h-[calc(100vh-theme(spacing.20))] gap-0">
        {/* Conversations Sidebar */}
        <div className="w-64 bg-[#1c2128] border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <Button
              onClick={handleCreateChat}
              disabled={creatingConv}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
              {loadingConversations ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="group">
                    <button
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedConvId === conv.id
                          ? "bg-primary/20 text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteConversation(conv.id)}
                      disabled={deletingConv}
                      className="hidden group-hover:block absolute right-3 top-2 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedConvId ? (
            <>
              {/* Header */}
              <div className="bg-[#1c2128] border-b border-white/5 px-6 py-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-white">
                  {selectedConv?.title || "Loading..."}
                </h2>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="p-6 max-w-2xl mx-auto space-y-4">
                  {loadingConv ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {selectedConv?.messages && selectedConv.messages.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">Start the conversation by sending a message</p>
                        </div>
                      ) : (
                        selectedConv?.messages?.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <Card
                              className={`max-w-xs lg:max-w-md px-4 py-2 ${
                                msg.role === "user"
                                  ? "bg-primary/20 border-primary/30 text-white"
                                  : "bg-black/30 border-white/10 text-muted-foreground"
                              }`}
                            >
                              <p className="text-sm break-words">{msg.content}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </Card>
                          </div>
                        ))
                      )}
                      {(sendingMessage || isSendingLocal) && (
                        <div className="flex justify-start">
                          <Card className="bg-black/30 border-white/10 px-4 py-2">
                            <div className="flex gap-2 items-center">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                            </div>
                          </Card>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-white/5 bg-[#1c2128]/50 p-4">
                <div className="max-w-2xl mx-auto flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message... (Enter to send)"
                    className="bg-black/20 border-white/10 text-white"
                    disabled={sendingMessage || isSendingLocal}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage || isSendingLocal}
                    className="bg-primary hover:bg-primary/90 text-white"
                    size="icon"
                  >
                    {sendingMessage || isSendingLocal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Select or create a conversation to start chatting</p>
                <Button
                  onClick={handleCreateChat}
                  disabled={creatingConv}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}

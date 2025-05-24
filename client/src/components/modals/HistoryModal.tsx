import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Conversation } from "@/lib/types";
import { MessageSquare, Trash2, Clock } from "lucide-react";

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (id: number) => void;
}

export default function HistoryModal({ open, onClose, onSelectConversation }: HistoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: open,
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/conversations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation(conversation.id);
    onClose();
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteConversationMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-gray-900 via-slate-900 to-black border-2 border-metallic-gold/40 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-metallic-gold to-yellow-400 bg-clip-text text-transparent">
            Chat History
          </DialogTitle>
        </DialogHeader>
        
        {/* Decorative elements */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-metallic-gold/10 rounded-full blur-xl opacity-70"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl opacity-70"></div>
        
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <div className="relative w-16 h-16 mb-3">
                <div className="absolute inset-0 rounded-full bg-metallic-gold/20 animate-pulse blur-md"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-metallic-gold border-t-transparent relative"></div>
              </div>
              <p className="text-metallic-silver">Loading your conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-metallic-gold/20">
                <MessageSquare className="w-10 h-10 text-metallic-gold/60" />
              </div>
              <p className="text-white font-semibold text-xl mb-2">No conversations yet</p>
              <p className="text-metallic-silver max-w-xs mx-auto">
                Start a new chat to begin your journey with AI PLANK.DEV
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-2">
              <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-slate-900 p-2 backdrop-blur-sm border-b border-metallic-gold/20 flex items-center">
                <Clock className="h-4 w-4 text-metallic-gold mr-2" />
                <p className="text-sm text-metallic-silver">
                  {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'} in your history
                </p>
              </div>
              
              {conversations.map((conversation: Conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 rounded-lg transition-all duration-200 cursor-pointer
                    bg-gradient-to-r from-transparent to-transparent hover:from-metallic-navy/30 hover:to-metallic-blue/10
                    border border-metallic-gold/10 hover:border-metallic-gold/40 hover:shadow-lg hover:shadow-metallic-gold/5 group"
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-800/80 to-black flex items-center justify-center mr-3 border border-metallic-gold/20">
                      <MessageSquare className="h-5 w-5 text-metallic-gold" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-white truncate">
                        {conversation.title}
                      </h4>
                      <p className="text-xs text-metallic-silver flex items-center">
                        <Clock className="h-3 w-3 mr-1 inline" />
                        {formatDate(conversation.updatedAt || conversation.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    variant="ghost"
                    size="sm"
                    className="text-metallic-silver hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-8 h-8 p-0"
                    disabled={deleteConversationMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="pt-3 border-t border-metallic-gold/20 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-slate-800 to-gray-900 text-metallic-silver hover:text-white border border-metallic-gold/30 transition-all duration-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

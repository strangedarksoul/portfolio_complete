'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useChatStore, useAuthStore } from '@/lib/store';
import { chatAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  MessageCircle, 
  Send, 
  X, 
  Settings, 
  ThumbsUp, 
  ThumbsDown, 
  Minimize2,
  Maximize2,
  Bot,
  User,
  ExternalLink,
  Star
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  is_from_user: boolean;
  sources?: Array<{
    type: string;
    title: string;
    url: string;
    description: string;
  }>;
  created_at: string;
  rating?: number;
}

export function ChatWidget() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isOpen,
    messages,
    currentSessionId,
    audience,
    depth,
    tone,
    context,
    setIsOpen,
    addMessage,
    setMessages,
    setSessionId,
    setAudience,
    setDepth,
    setTone,
    clearChatHistory,
  } = useChatStore();
  
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const addWelcomeMessage = () => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: "Hi! I'm Edzio's AI assistant. I know everything about his work, skills, and projects. Ask me anything - I can tailor my responses for recruiters, developers, founders, or general visitors. What would you like to know?",
        is_from_user: false,
        created_at: new Date().toISOString(),
      };
      addMessage(welcomeMessage);
    };

    const loadChatHistory = async () => {
      try {
        const response = await chatAPI.getHistory(user?.id);
        if (response.data.results?.length > 0) {
          const latestSession = response.data.results[0];
          // Only load if this session belongs to the current user
          if (user && latestSession.user === user.id) {
            setSessionId(latestSession.id);
            setMessages(latestSession.messages || []);
          } else {
            // Clear any existing chat data and add welcome message
            clearChatHistory();
            addWelcomeMessage();
          }
        } else {
          clearChatHistory();
          addWelcomeMessage();
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        clearChatHistory();
        addWelcomeMessage();
      }
    };

    if (isOpen && messages.length === 0) {
      // Load chat history for authenticated users
      if (isAuthenticated && user) {
        loadChatHistory();
      } else {
        // Add welcome message for new sessions
        addWelcomeMessage();
      }
    }
  }, [isOpen, isAuthenticated, messages.length, user, addMessage, setSessionId, setMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      is_from_user: true,
      created_at: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendQuery({
        query: input.trim(),
        session_id: currentSessionId,
        context,
        audience,
        depth,
        tone,
      });

      const aiMessage: ChatMessage = {
        id: response.data.message_id,
        content: response.data.response,
        is_from_user: false,
        sources: response.data.sources,
        created_at: new Date().toISOString(),
      };

      addMessage(aiMessage);
      
      if (response.data.session_id && !currentSessionId) {
        setSessionId(response.data.session_id);
      }

      // Show save prompt for anonymous users after 3+ messages
      if (!isAuthenticated && messages.length >= 5 && !showSavePrompt) {
        setShowSavePrompt(true);
      }
      
      // Show feedback prompt after 6+ messages
      if (messages.length >= 11 && !showFeedbackPrompt) {
        setShowFeedbackPrompt(true);
      }

      // Track analytics
      analytics.chatQuery(input.trim(), audience, depth, tone, context);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "I'm having trouble processing your request right now. Please try again in a moment.",
        is_from_user: false,
        created_at: new Date().toISOString(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      await chatAPI.sendMessageFeedback({ message_id: messageId, rating });
      
      // Update message in store
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, rating } : msg
      );
      setMessages(updatedMessages);

      analytics.chatFeedback(messageId, rating, false);
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const handleSessionFeedback = async (rating: number) => {
    if (!currentSessionId) return;

    try {
      await chatAPI.sendSessionFeedback({
        session_id: currentSessionId,
        overall_rating: rating,
        helpfulness: rating,
        accuracy: rating,
        would_recommend: rating >= 4,
      });

      analytics.track('chat_session_feedback', {
        session_id: currentSessionId,
        rating,
        message_count: messages.length,
      });
    } catch (error) {
      console.error('Failed to send session feedback:', error);
    }
  };

  const handleClearChat = async () => {
    if (!currentSessionId || messages.length <= 1) return;

    const confirmed = window.confirm(
      'Are you sure you want to clear your chat history? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsClearingChat(true);

    try {
      // Call backend to clear the session
      await chatAPI.clearSession(currentSessionId);
      
      // Clear local state
      clearChatHistory();
      
      // Add welcome message back
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: "Hi! I'm Edzio's AI assistant. I know everything about his work, skills, and projects. Ask me anything - I can tailor my responses for recruiters, developers, founders, or general visitors. What would you like to know?",
        is_from_user: false,
        created_at: new Date().toISOString(),
      };
      addMessage(welcomeMessage);
      
      // Track analytics
      analytics.track('chat_session_cleared', {
        session_id: currentSessionId,
        message_count: messages.length,
      });
      
    } catch (error) {
      console.error('Failed to clear chat session:', error);
      // Still clear local state even if backend call fails
      clearChatHistory();
      
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: "Hi! I'm Edzio's AI assistant. I know everything about his work, skills, and projects. Ask me anything - I can tailor my responses for recruiters, developers, founders, or general visitors. What would you like to know?",
        is_from_user: false,
        created_at: new Date().toISOString(),
      };
      addMessage(welcomeMessage);
    } finally {
      setIsClearingChat(false);
    }
  };
  const renderMessage = (message: ChatMessage) => (
    <div key={message.id} className={`flex gap-3 ${message.is_from_user ? 'justify-end' : 'justify-start'}`}>
      {!message.is_from_user && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.is_from_user ? 'order-first' : ''}`}>
        <div className={`rounded-lg p-3 ${
          message.is_from_user 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
            : 'bg-muted'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 space-y-2">
              <Separator />
              <p className="text-xs opacity-70">Sources:</p>
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  className="flex items-center gap-2 text-xs p-2 rounded bg-background/50 hover:bg-background/70 transition-colors"
                  onClick={() => analytics.linkClick('chat_source', source.url, source.type)}
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="font-medium">{source.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {source.type}
                  </Badge>
                </a>
              ))}
            </div>
          )}
        </div>
        
        {!message.is_from_user && message.id !== 'welcome' && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 px-2 ${message.rating === 1 ? 'text-green-500' : 'text-muted-foreground'}`}
              onClick={() => handleFeedback(message.id, 1)}
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 px-2 ${message.rating === -1 ? 'text-red-500' : 'text-muted-foreground'}`}
              onClick={() => handleFeedback(message.id, -1)}
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      
      {message.is_from_user && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 z-40 rounded-full w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-40 w-96 ${isMinimized ? 'h-14' : 'h-[600px]'} transition-all duration-300`}
    >
      <Card className="h-full flex flex-col shadow-2xl border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {showSettings && (
                <div className="p-3 border-b bg-muted/50 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Audience</label>
                      <Select value={audience} onValueChange={setAudience}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="founder">Founder</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Depth</label>
                      <Select value={depth} onValueChange={setDepth}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="long">Long</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Tone</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="owner_voice">Owner Voice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleClearChat}
                      disabled={isClearingChat || messages.length <= 1}
                      className="w-full h-7 text-xs"
                    >
                      {isClearingChat ? 'Clearing...' : 'Clear Chat History'}
                    </Button>
                  </div>
                </div>
              )}

              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {/* Save Session Prompt for Anonymous Users */}
                    {showSavePrompt && !isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Save this conversation?</p>
                            <p className="text-xs text-muted-foreground">Create an account to keep your chat history</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowSavePrompt(false)}
                            >
                              Later
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => window.location.href = '/auth/register'}
                              className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                              Sign Up
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Session Feedback Prompt */}
                    {showFeedbackPrompt && currentSessionId && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg"
                      >
                        <div className="text-center">
                          <p className="text-sm font-medium mb-2">How was this conversation?</p>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Button
                                key={rating}
                                size="sm"
                                variant="ghost"
                                className="p-1"
                                onClick={() => {
                                  handleSessionFeedback(rating);
                                  setShowFeedbackPrompt(false);
                                }}
                              >
                                <Star className="w-4 h-4 text-yellow-400" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {messages.map(renderMessage)}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about Edzio's work..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
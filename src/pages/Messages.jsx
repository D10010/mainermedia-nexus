import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Send,
  Paperclip,
  Search,
  Plus,
  MessageSquare,
  User
} from 'lucide-react';
import Panel from '@/components/ui/Panel';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const all = await base44.entities.Conversation.list('-last_message_at');
      return all.filter(c => c.participant_ids?.includes(user.email));
    },
    enabled: !!user?.email,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: selectedConversation.id }, 'created_date'),
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000, // Poll for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        sender_id: user.email,
        sender_name: user.full_name,
        sender_role: user.role,
        content,
      });
      
      // Update conversation's last message
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: content,
        last_message_at: new Date().toISOString(),
      });
      
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
      queryClient.invalidateQueries(['conversations']);
      setNewMessage('');
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const conversation = await base44.entities.Conversation.create({
        participant_ids: [user.email, 'support@mainermedia.com'],
        participant_names: [user.full_name, 'MAINERMEDIA Support'],
        type: user.role === 'admin' ? 'internal' : user.role === 'user' ? 'client_support' : 'partner_support',
        subject: newSubject || 'New Conversation',
      });
      return conversation;
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries(['conversations']);
      setSelectedConversation(conversation);
      setShowNewConversation(false);
      setNewSubject('');
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const filteredConversations = conversations.filter(c => 
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Messages</h1>
          <p className="text-gray-500 mt-1">Communicate with the MAINERMEDIA team</p>
        </div>
        <PrimaryButton onClick={() => setShowNewConversation(true)} icon={Plus}>
          New Message
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Conversation List */}
        <div className="lg:col-span-1 flex flex-col">
          <Panel noPadding className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/[0.08]">
              <InputField
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`
                    p-4 border-b border-white/[0.05] cursor-pointer transition-colors
                    ${selectedConversation?.id === conversation.id 
                      ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' 
                      : 'hover:bg-white/[0.02]'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm text-white font-medium truncate">
                          {conversation.subject || 'No Subject'}
                        </h3>
                        {conversation.unread_count > 0 && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      <p className="text-[10px] font-mono text-gray-600 mt-1">
                        {conversation.last_message_at && format(new Date(conversation.last_message_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2 flex flex-col">
          <Panel noPadding className="flex-1 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-white/[0.08] bg-[#0E1116]">
                  <h2 className="text-white font-medium">{selectedConversation.subject || 'Conversation'}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedConversation.participant_names?.filter(n => n !== user?.full_name).join(', ')}
                  </p>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isSender = message.sender_id === user?.email;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isSender ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${isSender ? 'bg-emerald-500/20' : 'bg-gray-700'}
                        `}>
                          <User className={`w-4 h-4 ${isSender ? 'text-emerald-500' : 'text-gray-400'}`} />
                        </div>
                        <div className={`max-w-[70%] ${isSender ? 'text-right' : ''}`}>
                          <div className={`
                            inline-block p-3 rounded-sm
                            ${isSender 
                              ? 'bg-emerald-500/20 text-white' 
                              : 'bg-[#12161D] text-gray-300'
                            }
                          `}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-1 ${isSender ? 'justify-end' : ''}`}>
                            <span className="text-[10px] text-gray-600">{message.sender_name}</span>
                            <span className="text-[10px] font-mono text-gray-600">
                              {format(new Date(message.created_date), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.08] bg-[#0E1116]">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full bg-[#12161D] border border-white/[0.08] rounded-sm px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <PrimaryButton 
                      type="submit" 
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      loading={sendMessageMutation.isPending}
                      icon={Send}
                    >
                      Send
                    </PrimaryButton>
                  </div>
                </form>
              </>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the list or start a new one"
              />
            )}
          </Panel>
        </div>
      </div>

      {/* New Conversation Modal */}
      <Modal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        title="New Conversation"
      >
        <div className="space-y-4">
          <InputField
            label="Subject"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="What's this about?"
          />
          <div className="flex justify-end gap-3">
            <PrimaryButton variant="secondary" onClick={() => setShowNewConversation(false)}>
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              onClick={() => createConversationMutation.mutate()}
              loading={createConversationMutation.isPending}
            >
              Start Conversation
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
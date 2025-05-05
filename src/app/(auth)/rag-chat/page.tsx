// my-app/src/app/(auth)/rag-chat/page.tsx

'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { ArrowUpIcon } from '@heroicons/react/24/solid';
import { UserIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

// Types for API
interface UserContext {
  role_type: string;
  teams: string[];
  areas?: string[];
  regions?: string[];
}

interface Reference {
  document_id: string;
  title?: string;
  chunk_index: number;
  similarity: number;
  snippet: string;
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
  references?: Reference[];
  fallback?: boolean;
}

// Citation component with expandable/collapsible functionality
function Citation({ reference, index: _index }: { reference: Reference; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
      <button 
        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <span className="font-medium text-sm text-gray-700">
            {reference.title || `Document ${reference.document_id}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Similarity: {(reference.similarity * 100).toFixed(0)}%</span>
          <span className="transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>↓</span>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 py-3 text-sm text-gray-700 bg-white">
          <div className="mb-2 pb-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Chunk {reference.chunk_index}</span>
          </div>
          <div className="whitespace-pre-wrap">{reference.snippet}</div>
        </div>
      )}
    </div>
  );
}

export default function RagChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [query]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize Supabase client and get user session on mount
  useEffect(() => {
    const supabase = createClient();
    
    async function getSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role_type, team, area, region')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          setUserContext({
            role_type: profileData.role_type || '',
            teams: profileData.team ? [profileData.team] : [],
            areas: profileData.area ? [profileData.area] : [],
            regions: profileData.region ? [profileData.region] : []
          });
        } else {
          // Set default user context if no profile data
          setUserContext({
            role_type: 'employee',
            teams: ['engineering'],
            areas: [],
            regions: []
          });
        }
      }
    }
    
    getSession();
    
    // Focus on input field on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    
    // Add user message
    const userMessage: Message = {
      type: 'user',
      content: query
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and set loading state
    const userQuery = query;
    setQuery('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          userContext: userContext || {
            role_type: '',
            teams: []
          }
        }),
      });
      
      const data = await res.json();
      
      if (data.success && data.answer) {
        const assistantMessage: Message = {
          type: 'assistant',
          content: data.answer,
          references: data.references,
          fallback: data.fallback
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Add error message
        const errorMessage: Message = {
          type: 'assistant',
          content: data.error || 'An error occurred. Please try again.'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      // Add error message
      const errorMessage: Message = {
        type: 'assistant',
        content: err instanceof Error ? err.message : 'Failed to send message'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      
      // Focus on input after response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }
  
  // Handle Enter key (submit form on Enter, new line on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-800">RAG Chat</h1>
        
        {/* User info could go here */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{userContext?.role_type || 'User'}</span>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>
      </header>
      
      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 mb-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <ChatBubbleLeftRightIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to RAG Chat</h2>
            <p className="text-gray-600 max-w-md mb-8">
              Ask questions about your company&apos;s knowledge base and get AI-powered answers with citations.
            </p>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg max-w-md">
              <p className="text-sm text-blue-800">
                Try asking: &quot;What is our policy on remote work?&quot; or &quot;Summarize our Q2 financial results.&quot;
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`py-6 px-4 ${
                  message.type === 'assistant' ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="max-w-3xl mx-auto flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                      ${message.type === 'assistant' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                      }`}
                    >
                      {message.type === 'assistant' 
                        ? <span className="text-sm font-semibold">AI</span>
                        : <UserIcon className="w-5 h-5" />
                      }
                    </div>
                  </div>
                  
                  {/* Message content */}
                  <div className="flex-1">
                    <div className="prose prose-sm prose-slate max-w-none">
                      {message.type === 'assistant' ? (
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      
                      {message.fallback && (
                        <div className="mt-3 text-amber-600 text-sm inline-flex items-center bg-amber-50 px-3 py-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          No internal docs matched – fell back to generic answer
                        </div>
                      )}
                    </div>
                    
                    {/* Citations */}
                    {message.type === 'assistant' && message.references && message.references.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Sources:</h3>
                        <div className="space-y-2">
                          {message.references.map((ref, idx) => (
                            <Citation key={`${ref.document_id}-${ref.chunk_index}`} reference={ref} index={idx} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="py-6 px-4 bg-white">
                <div className="max-w-3xl mx-auto flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <span className="text-sm font-semibold">AI</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent pt-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative bg-white border border-gray-300 rounded-lg shadow-sm">
            <textarea
              ref={inputRef}
              className="w-full p-4 pr-12 rounded-lg focus:outline-none resize-none max-h-[200px] min-h-[56px]"
              placeholder="Ask a question…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
            />
            <button
              className="absolute right-3 bottom-3 p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400 transition-colors"
              disabled={loading || !query.trim()}
              type="submit"
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          </form>
          <div className="text-xs text-center mt-2 text-gray-500">
            RAG Chat searches your organization&apos;s knowledge base to provide answers with citations.
          </div>
        </div>
      </div>
    </div>
  );
}

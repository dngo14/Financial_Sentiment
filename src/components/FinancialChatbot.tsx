'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinancialChat } from '../hooks/useAI';

interface FinancialChatbotProps {
  userContext?: {
    portfolioValue?: number;
    monthlyIncome?: number;
    monthlyExpenses?: number;
    savingsRate?: number;
    riskTolerance?: string;
    age?: number;
    goals?: string[];
  };
  className?: string;
}

export default function FinancialChatbot({ userContext, className = '' }: FinancialChatbotProps) {
  const { messages, loading, sendMessage, clearChat, getSuggestions } = useFinancialChat();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('general');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'general', label: 'GENERAL', icon: '💬' },
    { id: 'portfolio', label: 'PORTFOLIO', icon: '📈' },
    { id: 'budgeting', label: 'BUDGETING', icon: '💰' },
    { id: 'investing', label: 'INVESTING', icon: '📊' },
    { id: 'retirement', label: 'RETIREMENT', icon: '🎯' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSuggestions(activeCategory);
  }, [activeCategory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async (category: string) => {
    try {
      const suggestions = await getSuggestions(category);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');

    try {
      await sendMessage(message, userContext);
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    clearChat();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg font-mono text-sm border-2 border-blue-500"
        >
          🤖 AI_ADVISOR
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white">
              AI_FINANCIAL_ADVISOR
            </h3>
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-mono rounded">
              LOCAL_MODEL
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1 text-xs font-mono border border-red-500 text-red-500 hover:bg-red-500/10 transition-all"
              disabled={messages.length === 0}
            >
              CLEAR
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="px-3 py-1 text-xs font-mono border border-gray-500 text-gray-500 hover:bg-gray-500/10 transition-all"
            >
              MINIMIZE
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1 text-xs font-mono border transition-all whitespace-nowrap flex items-center gap-1 ${
                activeCategory === category.id
                  ? 'border-blue-400 bg-blue-400/10 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-gray-800/30">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400 font-mono text-sm mb-4">
              [ AI_ADVISOR_READY ]
            </div>
            <div className="text-gray-500 dark:text-gray-500 font-mono text-xs mb-6">
              Ask me anything about finance, investing, or your personal financial situation
            </div>
            
            {/* User Context Display */}
            {userContext && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="text-blue-600 dark:text-blue-400 font-mono text-xs mb-2">
                  USER_CONTEXT_LOADED:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {userContext.portfolioValue && (
                    <div className="text-gray-700 dark:text-gray-300">
                      Portfolio: ${userContext.portfolioValue.toLocaleString()}
                    </div>
                  )}
                  {userContext.monthlyIncome && (
                    <div className="text-gray-700 dark:text-gray-300">
                      Income: ${userContext.monthlyIncome.toLocaleString()}/mo
                    </div>
                  )}
                  {userContext.savingsRate && (
                    <div className="text-gray-700 dark:text-gray-300">
                      Savings Rate: {userContext.savingsRate}%
                    </div>
                  )}
                  {userContext.riskTolerance && (
                    <div className="text-gray-700 dark:text-gray-300">
                      Risk: {userContext.riskTolerance}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                  SUGGESTED_QUESTIONS:
                </div>
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded text-xs font-mono text-gray-700 dark:text-gray-300 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600'
              } rounded-lg px-4 py-3`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono opacity-70">
                      {message.type === 'user' ? 'USER' : 'AI_ADVISOR'}
                    </span>
                    {message.context && (
                      <span className="text-xs font-mono opacity-70 px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded">
                        {message.context.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {message.confidence && (
                      <span className={`text-xs font-mono ${getConfidenceColor(message.confidence)}`}>
                        {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                    <span className="text-xs font-mono opacity-50">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
                <div className={`text-sm leading-relaxed ${
                  message.isLoading ? 'italic text-gray-600 dark:text-gray-400' : ''
                } ${
                  message.isError ? 'text-red-600 dark:text-red-400' : ''
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && !messages.some(m => m.isLoading) && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  AI_CONNECTING...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your finances..."
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`px-4 py-2 font-mono text-sm border transition-all ${
              loading || !input.trim()
                ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                : 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
            }`}
          >
            {loading ? 'SENDING...' : 'SEND'}
          </button>
        </form>
        
        <div className="flex items-center justify-between mt-2 text-xs font-mono text-gray-500 dark:text-gray-400">
          <span>Powered by local Qwen3-4B unified model</span>
          <span>{messages.length} messages</span>
        </div>
      </div>
    </div>
  );
}
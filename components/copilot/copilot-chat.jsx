"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, Sparkles, Send, User, RefreshCw, Mic, MicOff, Volume2, VolumeX, 
  Square, Copy, Check, ArrowRight, Search, Stethoscope, Pill, BarChart3, PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientActionCenter } from "./patient-action-center";
import { PharmacyStockManager } from "./pharmacy-stock-manager";
import { AnalyticsReportsDashboard } from "./analytics-reports-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function CopilotChat({ initialQuery = "", onNavigate }) {
  const [messages, setMessages] = useState([
    {
      id: "copilot-welcome",
      role: "assistant",
      content: `👋 Hello, buddy!\n\nHow can I help you today?`,
      card_type: "welcome_cards",
      card_data: null,
      smart_buttons: [],
      timestamp: "10:00 AM"
    }
  ]);

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Autocomplete Suggestions State
  const [autocompleteItems, setAutocompleteItems] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const chatBottomRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isGenerating]);

  // Dynamic Autocomplete Search Handler
  useEffect(() => {
    const q = inputQuery.trim();
    if (q.length >= 1) {
      fetch(`/api/copilot/autocomplete?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
          if (data.suggestions && data.suggestions.length > 0) {
            setAutocompleteItems(data.suggestions);
            setShowAutocomplete(true);
          } else {
            setAutocompleteItems([]);
            setShowAutocomplete(false);
          }
        })
        .catch(() => setShowAutocomplete(false));
    } else {
      setAutocompleteItems([]);
      setShowAutocomplete(false);
    }
  }, [inputQuery]);

  // Voice Assistant: Speech to Text (STT)
  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Voice Assistant: Text to Speech (TTS)
  const toggleSpeech = (text) => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[^a-zA-Z0-9 ,.]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCardClick = (cardKey) => {
    if (cardKey === "search_patient") {
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: "🔍 Search Patient",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Sure! I can help you find a patient.\n\nPlease enter:\n• **Patient Name**\nor\n• **Patient ID**\nor\n• **Mobile Number**",
          card_type: null,
          card_data: null,
          smart_buttons: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (cardKey === "operations") {
      handleSendMessage("How many patients are waiting?");
    } else if (cardKey === "pharmacy") {
      handleSendMessage("Show low stock medicines");
    } else if (cardKey === "reports") {
      handleSendMessage("Show today's report");
    }
  };

  const handleSendMessage = async (queryText = inputQuery) => {
    const q = queryText.trim();
    if (!q || isGenerating) return;

    setShowAutocomplete(false);

    // If query is "search patient" or "search again"
    if (q.toLowerCase() === "search patient" || q.toLowerCase() === "search again" || q === "🔍 Search Patient") {
      handleCardClick("search_patient");
      setInputQuery("");
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setIsThinking(true);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/copilot/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: abortControllerRef.current.signal
      });

      setIsThinking(false);
      const data = await res.json();

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.title ? `${data.title}\n\n${data.message || ""}` : (data.message || "Query processed."),
        card_type: data.type,
        card_data: data,
        smart_buttons: data.smart_buttons || data.quick_actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "⚠️ **Copilot Notice:** Request processed.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } finally {
      setIsThinking(false);
      setIsGenerating(false);
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  const handleActionClick = (btn) => {
    if (btn.url) {
      if (typeof window !== "undefined") {
        window.location.href = btn.url;
      }
    } else if (btn.action === "prompt_search" || btn.query === "Search Patient") {
      handleCardClick("search_patient");
    } else if (btn.query) {
      handleSendMessage(btn.query);
    } else if (btn.action === "print_summary" || btn.action === "print_report") {
      window.print();
    } else {
      alert(`Executing action: ${btn.label || btn.action}...`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0 relative">
      {/* Header Bar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">Thangam Hospital AI Copilot</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMessages([messages[0]])}
          className="text-slate-500 hover:text-slate-800 text-xs h-7 gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Reset Chat
        </Button>
      </div>

      {/* Message Timeline */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div className={`max-w-3xl space-y-3 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`p-4 rounded-2xl shadow-sm text-slate-800 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white font-medium rounded-tr-none text-sm"
                    : "bg-slate-50 border border-slate-200/80 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-sm font-semibold">{msg.content}</div>

                {/* Welcome 4 Modern Action Cards */}
                {msg.card_type === "welcome_cards" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {/* Card 1 */}
                    <Card 
                      onClick={() => handleCardClick("search_patient")}
                      className="border-slate-200 shadow-sm rounded-xl p-4 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">🔍 Search Patient</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Search a patient using Name, Patient ID or Mobile Number.
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Card 2 */}
                    <Card 
                      onClick={() => handleCardClick("operations")}
                      className="border-slate-200 shadow-sm rounded-xl p-4 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">🏥 Hospital Operations</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Monitor appointments, waiting patients, consultations and revenue.
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Card 3 */}
                    <Card 
                      onClick={() => handleCardClick("pharmacy")}
                      className="border-slate-200 shadow-sm rounded-xl p-4 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">💊 Pharmacy Inventory</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Manage medicine stock, restocking and expiry.
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Card 4 */}
                    <Card 
                      onClick={() => handleCardClick("reports")}
                      className="border-slate-200 shadow-sm rounded-xl p-4 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">📊 Analytics & Reports</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Generate daily, monthly and yearly hospital reports.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* FEATURE 1: Patient Action Center */}
                {msg.card_type === "patient_action_center" && (
                  <PatientActionCenter data={msg.card_data} onActionClick={handleActionClick} />
                )}

                {/* FEATURE 2: Hospital Operations Dashboard */}
                {msg.card_type === "operations_dashboard" && (
                  <div className="space-y-4 my-3">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {msg.card_data.kpis?.map((k, i) => (
                        <div key={i} className={`p-3 rounded-xl border border-slate-200 ${k.bg}`}>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{k.title}</span>
                          <span className={`text-base font-extrabold mt-0.5 block ${k.color}`}>{k.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Doctor Queues Breakdown */}
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardHeader className="py-2.5 px-4 bg-slate-50 border-b">
                        <CardTitle className="text-xs font-bold text-slate-800">Doctor Consultation Queue Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-xs divide-y divide-slate-100">
                        {msg.card_data.doctor_queues?.map((dq, i) => (
                          <div key={i} className="py-1.5 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-900">{dq.doctor}</span>
                              <span className="text-[10px] text-slate-400 block">{dq.specialization}</span>
                            </div>
                            <div className="flex gap-2 text-[10px]">
                              <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-100">Waiting: {dq.waiting}</span>
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">Completed: {dq.completed}</span>
                              <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">Remaining: {dq.remaining}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Waiting Patients List */}
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardHeader className="py-2.5 px-4 bg-slate-50 border-b">
                        <CardTitle className="text-xs font-bold text-slate-800">Waiting Patients Queue (First Come First Serve)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b">
                            <tr>
                              <th className="px-3 py-2">Token #</th>
                              <th className="px-3 py-2">Patient Name</th>
                              <th className="px-3 py-2">Doctor</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {msg.card_data.waiting_patients?.map((wp, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-bold text-indigo-600">Token #{wp.token}</td>
                                <td className="px-3 py-2 font-semibold text-slate-900">{wp.name}</td>
                                <td className="px-3 py-2 text-slate-600">{wp.doctor}</td>
                                <td className="px-3 py-2">
                                  <span className="bg-rose-50 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded border border-rose-100">
                                    {wp.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* FEATURE 3: Pharmacy Stock Manager */}
                {msg.card_type === "pharmacy_stock_manager" && (
                  <PharmacyStockManager 
                    data={msg.card_data} 
                    onActionClick={handleActionClick}
                    onRestockExecuted={(res) => {
                      setMessages(prev => [...prev, {
                        id: `restock-${Date.now()}`,
                        role: "assistant",
                        content: `### ${res.title}\n\n${res.message}`,
                        smart_buttons: res.smart_buttons,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }]);
                    }}
                  />
                )}

                {/* FEATURE 4: Reports & Analytics Dashboard */}
                {msg.card_type === "analytics_reports_dashboard" && (
                  <AnalyticsReportsDashboard 
                    data={msg.card_data} 
                    onTimeframeChange={(tf) => handleSendMessage(`Show ${tf.toLowerCase()} report`)}
                  />
                )}
              </div>

              {/* Smart Action Buttons */}
              {msg.role === "assistant" && msg.smart_buttons?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.smart_buttons.map((btn, bIdx) => (
                    <Button
                      key={bIdx}
                      size="sm"
                      variant="outline"
                      onClick={() => handleActionClick(btn)}
                      className="h-8 text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 shadow-sm rounded-lg"
                    >
                      {btn.label} <ArrowRight className="w-3.5 h-3.5 ml-1 text-indigo-600" />
                    </Button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              {msg.role === "assistant" && (
                <div className="flex items-center gap-3 px-1 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  <button onClick={() => toggleSpeech(msg.content)} className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
                    {isSpeaking ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3" />} Read
                  </button>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {/* Thinking State */}
        {isThinking && (
          <div className="flex gap-4 items-center animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-slate-600 font-semibold flex items-center gap-3">
              <span>Thinking... ▌</span>
              <Button size="sm" variant="ghost" onClick={cancelGeneration} className="h-6 text-[10px] text-rose-600 hover:bg-rose-50 font-bold gap-1">
                <Square className="w-3 h-3" /> Stop
              </Button>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Dynamic Autocomplete Dropdown Popup */}
      {showAutocomplete && autocompleteItems.length > 0 && (
        <div className="absolute bottom-16 left-4 right-24 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Search className="w-3 h-3 text-indigo-500" /> Dynamic Patient Database Matches
          </div>
          {autocompleteItems.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                setInputQuery(item.query);
                setShowAutocomplete(false);
                handleSendMessage(item.query);
              }}
              className="p-2.5 hover:bg-indigo-50/70 cursor-pointer flex justify-between items-center transition-colors text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">{item.title}</span>
                <span className="text-[10px] text-slate-500">{item.subtitle}</span>
              </div>
              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2 items-center"
        >
          <Button
            type="button"
            variant="outline"
            onClick={toggleListening}
            className={`h-11 w-11 p-0 shrink-0 rounded-xl ${
              isListening ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse" : "text-slate-600"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask AI Copilot or search Patient Name, Patient ID, or Mobile Number..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isGenerating}
            className="flex-1 bg-white border-slate-200 text-sm h-11 shadow-sm focus-visible:ring-indigo-600"
          />

          <Button
            type="submit"
            disabled={!inputQuery.trim() || isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-5 rounded-xl font-semibold gap-2 shadow-md shrink-0"
          >
            <Send className="w-4 h-4" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
}

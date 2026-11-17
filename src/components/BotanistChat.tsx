import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import {
  ImagePlus,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type {
  ChatMessage,
  PlantIdentification,
  SavedSpecimen,
  SpecialistMode,
} from "../types";
import { prepareImageFile, type PreparedImage } from "../lib/imageUtils";
import { ResilientImage } from "./ResilientImage";

interface BotanistChatProps {
  messages: ChatMessage[];
  mode: SpecialistMode;
  onChangeMode: (mode: SpecialistMode) => void;
  activeSpecimen: PlantIdentification | null;
  savedSpecimens: SavedSpecimen[];
  onSelectContextSpecimen: (specimen: PlantIdentification | null) => void;
  onSendMessage: (text: string, attachment?: PreparedImage | null) => void;
  onStopStreaming: () => void;
  onClearChat: () => void;
  isStreaming: boolean;
  chatError: string | null;
}

const SPECIALIST_ROLES: Array<{
  id: SpecialistMode;
  name: string;
  persona: string;
  modelLabel: string;
  description: string;
  starters: string[];
}> = [
  {
    id: "general",
    name: "General Botanist",
    persona: "Clara Thorn · Head Horticulturist",
    modelLabel: "gemini-4-hydrogen",
    description: "Everyday watering, lighting, repotting, and seasonal care.",
    starters: [
      "How do I know if my potting mix holds too much water?",
      "Which indoor herbs thrive on a bright east windowsill?",
      "When is the best season to repot rootbound houseplants?",
      "How should I acclimate a nursery plant to indoor light?",
    ],
  },
  {
    id: "pathology",
    name: "Plant Pathologist",
    persona: "Dr. Linnea Vance · Deep Diagnostics",
    modelLabel: "gemini-4-carbon",
    description: "Root-cause reasoning for chlorosis, pests, fungi, and soil lockouts.",
    starters: [
      "Lower leaves are yellowing with green veins—chlorosis or overwatering?",
      "Compare spider mite stippling vs. thrips damage on indoor foliage.",
      "White crust on terracotta and brown leaf tips: salt buildup protocol?",
      "How do I treat early root rot without shocking a tropical aroid?",
    ],
  },
  {
    id: "architect",
    name: "Garden Architect",
    persona: "Julian Mercer · Space & Microclimate",
    modelLabel: "gemini-4-argon",
    description: "Complex bed layouts, companion planting, and light mapping.",
    starters: [
      "Design a shade-tolerant patio planter trio with staggered bloom times.",
      "Plan a perennial culinary herb border for a dry Zone 8 courtyard.",
      "Map three humidity-loving plants around a bright bathroom window.",
      "Create a custom chunky aroid substrate recipe by volume.",
    ],
  },
  {
    id: "quick",
    name: "Quick Care Lookup",
    persona: "Rapid Field Reference",
    modelLabel: "gemini-3.1-flash-lite",
    description: "Fast, concise answers for toxicity, NPK ratios, and pruning timing.",
    starters: [
      "Is peace lily toxic to cats, and what are safer alternatives?",
      "Ideal NPK ratio for leafy foliage houseplants in spring?",
      "Minimum winter temperature for potted rosemary outdoors?",
      "Quick checklist before propagating pothos cuttings in water.",
    ],
  },
];

export function BotanistChat({
  messages,
  mode,
  onChangeMode,
  activeSpecimen,
  savedSpecimens,
  onSelectContextSpecimen,
  onSendMessage,
  onStopStreaming,
  onClearChat,
  isStreaming,
  chatError,
}: BotanistChatProps) {
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<PreparedImage | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const currentRole =
    SPECIALIST_ROLES.find((r) => r.id === mode) ?? SPECIALIST_ROLES[0];

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleAttachFile = async (file: File) => {
    setAttachmentError(null);
    try {
      const prepared = await prepareImageFile(file);
      setAttachment(prepared);
    } catch (err) {
      setAttachmentError(
        err instanceof Error ? err.message : "Could not process attached image."
      );
    }
  };

  const handleSubmit = () => {
    if (isStreaming) return;
    if (!draft.trim() && !attachment) return;
    const textToSend = draft.trim();
    const imgToSend = attachment;
    setDraft("");
    setAttachment(null);
    onSendMessage(textToSend, imgToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const specimenOptions: PlantIdentification[] = [];
  if (activeSpecimen) {
    specimenOptions.push(activeSpecimen);
  }
  for (const saved of savedSpecimens) {
    if (
      !specimenOptions.some(
        (s) => s.scientificName === saved.data.scientificName
      )
    ) {
      specimenOptions.push(saved.data);
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Specialist Rail */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Specialist Mode Selector */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-display text-lg font-medium text-[#161B16]">
                Botanist Specialist
              </h2>
              <p className="text-xs text-[#6B746B] mt-0.5">
                Choose the depth and persona for this thread.
              </p>
            </div>

            <div className="space-y-2" role="radiogroup" aria-label="Specialist mode">
              {SPECIALIST_ROLES.map((role) => {
                const selected = role.id === mode;
                return (
                  <button
                    key={role.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChangeMode(role.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? "bg-[#ECF3EE] border-[#14532D] text-[#161B16]"
                        : "bg-white border-[#E2E2DC] hover:border-[#C8CCC4] text-[#161B16]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{role.name}</span>
                      <span className="font-mono text-[11px] text-[#4B534B]">
                        {role.modelLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#4B534B] mt-1 leading-snug">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grounding Specimen Context */}
          <div className="bg-white border border-[#E2E2DC] rounded-xl p-4 space-y-3">
            <label
              htmlFor="specimen-context-select"
              className="block text-sm font-semibold text-[#161B16]"
            >
              Active Plant Context
            </label>
            <select
              id="specimen-context-select"
              value={activeSpecimen?.scientificName || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onSelectContextSpecimen(null);
                  return;
                }
                const found = specimenOptions.find(
                  (s) => s.scientificName === val
                );
                onSelectContextSpecimen(found ?? null);
              }}
              className="w-full px-3 py-2 text-sm bg-[#F7F7F5] border border-[#E2E2DC] rounded-lg focus:outline-none focus:border-[#14532D]"
            >
              <option value="">General gardening (no plant linked)</option>
              {specimenOptions.map((spec) => (
                <option key={spec.scientificName} value={spec.scientificName}>
                  {spec.commonName} ({spec.scientificName})
                </option>
              ))}
            </select>
            {activeSpecimen && (
              <p className="text-xs text-[#4B534B] leading-relaxed">
                Grounded in{" "}
                <span className="font-medium text-[#161B16]">
                  {activeSpecimen.commonName}
                </span>{" "}
                · {activeSpecimen.healthAssessment.status} ·{" "}
                {activeSpecimen.careProfile.light.level}
              </p>
            )}
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              disabled={isStreaming}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#4B534B] hover:text-[#B91C1C] bg-white border border-[#E2E2DC] hover:border-[#FCA5A5] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Conversation</span>
            </button>
          )}
        </aside>

        {/* Main Scrollable Thread */}
        <section className="lg:col-span-8 xl:col-span-9 bg-white border border-[#E2E2DC] rounded-xl flex flex-col h-[calc(100vh-11rem)] min-h-[540px]">
          {/* Thread Header */}
          <div className="px-5 py-4 border-b border-[#E2E2DC] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-lg font-medium text-[#161B16]">
                {currentRole.persona}
              </h1>
              <p className="text-xs text-[#6B746B]">
                {currentRole.name} · {currentRole.modelLabel}
                {activeSpecimen
                  ? ` · Advising on ${activeSpecimen.commonName}`
                  : ""}
              </p>
            </div>
          </div>

          {/* Scrollable Message List */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto py-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-medium text-[#161B16]">
                    Ask anything about plant care, pests, or garden design.
                  </h2>
                  <p className="text-sm text-[#4B534B] leading-relaxed">
                    {activeSpecimen
                      ? `Your current ${activeSpecimen.commonName} care sheet is linked to this conversation. Ask a follow-up question or attach a closer leaf photo.`
                      : "Start a multi-turn consultation below, or attach a close-up photo of leaves, stems, or soil for visual inspection."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentRole.starters.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSendMessage(prompt)}
                      className="text-left p-3.5 rounded-lg border border-[#E2E2DC] hover:border-[#14532D] hover:bg-[#F7F7F5] transition-colors text-sm text-[#161B16] leading-snug cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-xl px-4 py-3 ${
                        isUser
                          ? "bg-[#EFEFEA] text-[#161B16]"
                          : "bg-[#FBFBF9] border border-[#E2E2DC] text-[#161B16]"
                      }`}
                    >
                      {msg.attachmentDataUrl && (
                        <div className="mb-2.5">
                          <ResilientImage
                            src={msg.attachmentDataUrl}
                            alt="Attached plant photo"
                            className="max-h-52 rounded-lg border border-[#E2E2DC] object-cover"
                          />
                        </div>
                      )}

                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      ) : msg.text ? (
                        <div className="botanist-prose text-sm text-[#161B16]">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      ) : (
                        <span className="text-sm text-[#6B746B]">
                          Reviewing botanical notes...
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 px-1 flex items-center gap-2 text-[11px] text-[#6B746B]">
                      <span>{isUser ? "You" : currentRole.name}</span>
                      {!isUser && msg.modelUsed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{msg.modelUsed}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Error Banner */}
          {(chatError || attachmentError) && (
            <div className="mx-5 mb-3 px-4 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {chatError || attachmentError}
            </div>
          )}

          {/* Composer */}
          <div className="p-4 border-t border-[#E2E2DC] bg-[#FBFBF9] rounded-b-xl">
            {attachment && (
              <div className="mb-3 inline-flex items-center gap-3 p-2 bg-white border border-[#E2E2DC] rounded-lg">
                <img
                  src={attachment.dataUrl}
                  alt="Attachment preview"
                  className="w-12 h-12 rounded object-cover"
                />
                <span className="text-xs text-[#4B534B]">
                  Photo attached (analyzed with gemini-4-argon)
                </span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label="Remove attached photo"
                  className="p-1 text-[#6B746B] hover:text-[#161B16] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAttachFile(file);
                    e.target.value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                title="Attach follow-up plant photo"
                aria-label="Attach follow-up plant photo"
                className="p-2.5 text-[#4B534B] hover:text-[#14532D] bg-white border border-[#E2E2DC] hover:border-[#14532D] rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeSpecimen
                    ? `Ask about ${activeSpecimen.commonName}...`
                    : "Ask a gardening question or attach a leaf photo..."
                }
                className="flex-1 resize-none px-3.5 py-2.5 text-sm bg-white border border-[#E2E2DC] rounded-lg focus:outline-none focus:border-[#14532D] max-h-36"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!draft.trim() && !attachment}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#14532D] hover:bg-[#0F3F22] disabled:bg-[#C8CCC4] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

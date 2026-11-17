import { useEffect, useRef, useState } from "react";
import { TopBar } from "./components/TopBar";
import { IdentifyWorkspace } from "./components/IdentifyWorkspace";
import { BotanistChat } from "./components/BotanistChat";
import { MyGardenView } from "./components/MyGardenView";
import { SeasonalGuideView } from "./components/SeasonalGuideView";
import {
  createThumbnailDataUrl,
  prepareImageFile,
  prepareImageFromUrl,
  type PreparedImage,
} from "./lib/imageUtils";
import type {
  AppTab,
  ChatMessage,
  PlantIdentification,
  SavedSpecimen,
  SpecialistMode,
} from "./types";

const GARDEN_STORAGE_KEY = "herbarium.savedSpecimens.v1";
const CHAT_STORAGE_KEY = "herbarium.chatHistory.v1";

function formatTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("identify");

  // Plant identification state
  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identifyResult, setIdentifyResult] =
    useState<PlantIdentification | null>(null);
  const [identifyModelUsed, setIdentifyModelUsed] = useState<string | null>(null);

  // Saved garden collection persisted in localStorage
  const [savedSpecimens, setSavedSpecimens] = useState<SavedSpecimen[]>(() => {
    try {
      const raw = localStorage.getItem(GARDEN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedSpecimen[]) : [];
    } catch {
      return [];
    }
  });

  // Multi-turn Botanist Chat state persisted in localStorage
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [chatMode, setChatMode] = useState<SpecialistMode>("general");
  const [chatSpecimenContext, setChatSpecimenContext] =
    useState<PlantIdentification | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(savedSpecimens));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [savedSpecimens]);

  useEffect(() => {
    try {
      // Omit large inline image attachments from localStorage persistence to keep quota lean
      const compact = chatMessages.map((m) => ({
        ...m,
        attachmentDataUrl: undefined,
      }));
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [chatMessages]);

  const runIdentification = async (img: PreparedImage, notes: string) => {
    setIdentifying(true);
    setIdentifyError(null);
    setIdentifyResult(null);
    setActiveTab("identify");

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: img.base64,
          mimeType: img.mimeType,
          userNotes: notes,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Plant identification failed.");
      }
      setIdentifyResult(payload.result as PlantIdentification);
      setIdentifyModelUsed(payload.modelUsed || "gemini-4-argon");
      if (payload.result?.isPlant) {
        setChatSpecimenContext(payload.result as PlantIdentification);
      }
    } catch (err) {
      setIdentifyError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while identifying this plant."
      );
    } finally {
      setIdentifying(false);
    }
  };

  const handleSelectFile = async (file: File) => {
    try {
      const prepared = await prepareImageFile(file);
      setPreparedImage(prepared);
      await runIdentification(prepared, userNotes);
    } catch (err) {
      setIdentifyError(
        err instanceof Error ? err.message : "Could not load selected image."
      );
    }
  };

  const handleSelectSample = async (imageUrl: string, defaultNotes: string) => {
    setUserNotes(defaultNotes);
    setIdentifying(true);
    setActiveTab("identify");
    try {
      const prepared = await prepareImageFromUrl(imageUrl);
      setPreparedImage(prepared);
      await runIdentification(prepared, defaultNotes);
    } catch (err) {
      setIdentifying(false);
      setIdentifyError(
        err instanceof Error ? err.message : "Could not analyze sample image."
      );
    }
  };

  const handleReanalyze = () => {
    if (!preparedImage) return;
    runIdentification(preparedImage, userNotes);
  };

  const handleResetIdentify = () => {
    setPreparedImage(null);
    setIdentifyResult(null);
    setIdentifyError(null);
    setUserNotes("");
  };

  const isCurrentSpecimenSaved = Boolean(
    identifyResult &&
      savedSpecimens.some(
        (s) => s.data.scientificName === identifyResult.scientificName
      )
  );

  const handleSaveToGarden = async () => {
    if (!identifyResult || !preparedImage) return;
    const existingIndex = savedSpecimens.findIndex(
      (s) => s.data.scientificName === identifyResult.scientificName
    );
    if (existingIndex >= 0) {
      setSavedSpecimens((prev) =>
        prev.filter((_, idx) => idx !== existingIndex)
      );
      return;
    }

    const thumb = await createThumbnailDataUrl(preparedImage.dataUrl, 520);
    const now = new Date().toISOString();
    const newEntry: SavedSpecimen = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: now,
      lastWateredAt: now,
      photoDataUrl: thumb,
      userNotes: userNotes.trim() || undefined,
      modelUsed: identifyModelUsed || "gemini-4-argon",
      data: identifyResult,
    };
    setSavedSpecimens((prev) => [newEntry, ...prev]);
  };

  const handleSendChatMessage = async (
    text: string,
    attachment?: PreparedImage | null
  ) => {
    if (isStreaming) return;
    setChatError(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: text || "Please inspect this follow-up plant photo.",
      timestamp: formatTime(),
      attachmentDataUrl: attachment?.dataUrl,
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      timestamp: formatTime(),
    };

    const historySnapshot = chatMessages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setChatMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historySnapshot,
          userMessage: userMsg.text,
          mode: chatMode,
          specimenContext: chatSpecimenContext
            ? {
                commonName: chatSpecimenContext.commonName,
                scientificName: chatSpecimenContext.scientificName,
                healthStatus: chatSpecimenContext.healthAssessment.status,
                healthHeadline: chatSpecimenContext.healthAssessment.headline,
                lightLevel: chatSpecimenContext.careProfile.light.level,
                waterFrequency: chatSpecimenContext.careProfile.water.frequency,
                soilMix: chatSpecimenContext.careProfile.soil.mix,
              }
            : null,
          imageBase64: attachment?.base64,
          imageMimeType: attachment?.mimeType,
        }),
      });

      if (!response.ok || !response.body) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(
          errPayload.error || "Unable to connect to Herbarium Botanist."
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          const evt = JSON.parse(jsonStr) as {
            chunk?: string;
            done?: boolean;
            modelUsed?: string;
            error?: string;
          };

          if (evt.error) {
            throw new Error(evt.error);
          }

          if (evt.chunk) {
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: m.text + evt.chunk } : m
              )
            );
          }

          if (evt.done && evt.modelUsed) {
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, modelUsed: evt.modelUsed } : m
              )
            );
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User stopped generation cleanly
      } else {
        const message =
          err instanceof Error
            ? err.message
            : "Conversation interrupted due to an error.";
        setChatError(message);
        setChatMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && !m.text))
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
  };

  const handleAskBotanistFromSheet = (initialQuestion?: string) => {
    if (identifyResult) {
      setChatSpecimenContext(identifyResult);
    }
    setActiveTab("chat");
    if (initialQuestion) {
      void handleSendChatMessage(initialQuestion);
    }
  };

  const handleOpenSavedSpecimen = (specimen: SavedSpecimen) => {
    const base64 = specimen.photoDataUrl.includes(",")
      ? specimen.photoDataUrl.split(",")[1] || ""
      : "";
    setPreparedImage({
      dataUrl: specimen.photoDataUrl,
      base64,
      mimeType: "image/jpeg",
    });
    setUserNotes(specimen.userNotes || "");
    setIdentifyResult(specimen.data);
    setIdentifyModelUsed(specimen.modelUsed);
    setIdentifyError(null);
    setChatSpecimenContext(specimen.data);
    setActiveTab("identify");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-[#161B16]">
      <input
        ref={globalFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleSelectFile(file);
            e.target.value = "";
          }
        }}
      />

      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTriggerUpload={() => globalFileInputRef.current?.click()}
        gardenCount={savedSpecimens.length}
      />

      <main className="flex-1">
        {activeTab === "identify" && (
          <IdentifyWorkspace
            previewDataUrl={preparedImage?.dataUrl ?? null}
            userNotes={userNotes}
            onChangeNotes={setUserNotes}
            identifying={identifying}
            error={identifyError}
            result={identifyResult}
            modelUsed={identifyModelUsed}
            isSaved={isCurrentSpecimenSaved}
            onSelectFile={handleSelectFile}
            onSelectSample={handleSelectSample}
            onReanalyzeWithNotes={handleReanalyze}
            onReset={handleResetIdentify}
            onSaveToGarden={handleSaveToGarden}
            onAskBotanist={handleAskBotanistFromSheet}
            onOpenFilePicker={() => globalFileInputRef.current?.click()}
          />
        )}

        {activeTab === "chat" && (
          <BotanistChat
            messages={chatMessages}
            mode={chatMode}
            onChangeMode={setChatMode}
            activeSpecimen={chatSpecimenContext}
            savedSpecimens={savedSpecimens}
            onSelectContextSpecimen={setChatSpecimenContext}
            onSendMessage={handleSendChatMessage}
            onStopStreaming={handleStopStreaming}
            onClearChat={() => {
              setChatMessages([]);
              setChatError(null);
            }}
            isStreaming={isStreaming}
            chatError={chatError}
          />
        )}

        {activeTab === "garden" && (
          <MyGardenView
            specimens={savedSpecimens}
            onMarkWatered={(id) =>
              setSavedSpecimens((prev) =>
                prev.map((s) =>
                  s.id === id
                    ? { ...s, lastWateredAt: new Date().toISOString() }
                    : s
                )
              )
            }
            onOpenSpecimen={handleOpenSavedSpecimen}
            onAskAboutSpecimen={(specimen) => {
              setChatSpecimenContext(specimen.data);
              setActiveTab("chat");
            }}
            onRemoveSpecimen={(id) =>
              setSavedSpecimens((prev) => prev.filter((s) => s.id !== id))
            }
            onGoIdentify={() => setActiveTab("identify")}
          />
        )}

        {activeTab === "seasonal" && <SeasonalGuideView />}
      </main>

      <footer className="border-t border-[#E2E2DC] bg-[#F7F7F5] py-5 px-4 sm:px-8 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B746B]">
          <span>Herbarium · Botanical Identification &amp; Care Assistant</span>
          <span>
            Save specimens locally to track watering intervals and consult specialists anytime.
          </span>
        </div>
      </footer>
    </div>
  );
}

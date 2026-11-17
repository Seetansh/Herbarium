import { useState, type DragEvent } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  Calendar,
  CheckCircle2,
  Droplets,
  FlaskConical,
  ImagePlus,
  MessageSquare,
  RotateCcw,
  Scissors,
  ShieldAlert,
  Sun,
  Thermometer,
} from "lucide-react";
import type { HealthStatus, PlantIdentification } from "../types";
import { HERO_CONSERVATORY_URL, SAMPLE_SPECIMENS } from "../lib/samples";
import { ResilientImage } from "./ResilientImage";

interface IdentifyWorkspaceProps {
  previewDataUrl: string | null;
  userNotes: string;
  onChangeNotes: (notes: string) => void;
  identifying: boolean;
  error: string | null;
  result: PlantIdentification | null;
  modelUsed: string | null;
  isSaved: boolean;
  onSelectFile: (file: File) => void;
  onSelectSample: (imageUrl: string, notes: string) => void;
  onReanalyzeWithNotes: () => void;
  onReset: () => void;
  onSaveToGarden: () => void;
  onAskBotanist: (initialQuestion?: string) => void;
  onOpenFilePicker: () => void;
}

function HealthStatusBanner({
  status,
  headline,
  observations,
  immediateActions,
}: PlantIdentification["healthAssessment"]) {
  const statusStyles: Record<
    HealthStatus,
    { container: string; iconColor: string; Icon: typeof CheckCircle2 }
  > = {
    Healthy: {
      container: "bg-[#ECF3EE] border-[#C5DEC9] text-[#14532D]",
      iconColor: "text-[#15803D]",
      Icon: CheckCircle2,
    },
    "Mild Stress": {
      container: "bg-[#FEF7EC] border-[#F3D9B1] text-[#92400E]",
      iconColor: "text-[#B45309]",
      Icon: AlertTriangle,
    },
    "Needs Attention": {
      container: "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]",
      iconColor: "text-[#B91C1C]",
      Icon: AlertCircle,
    },
    Critical: {
      container: "bg-[#FEF2F2] border-[#FCA5A5] text-[#7F1D1D]",
      iconColor: "text-[#B91C1C]",
      Icon: AlertCircle,
    },
  };

  const style = statusStyles[status] ?? statusStyles["Mild Stress"];
  const Icon = style.Icon;

  return (
    <section
      aria-label="Visual Health Assessment"
      className={`rounded-xl border p-5 sm:p-6 ${style.container}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 mb-2">
        <Icon className={`w-5 h-5 shrink-0 ${style.iconColor}`} />
        <span className="text-sm font-semibold tracking-tight">{status}</span>
        <span aria-hidden="true" className="opacity-40">
          ·
        </span>
        <span className="text-sm font-medium">{headline}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-current/15">
        <div>
          <h4 className="text-xs font-semibold tracking-wide text-[#161B16] mb-2">
            Observed Visual Cues
          </h4>
          <ul className="space-y-1.5 text-sm text-[#161B16]/90">
            {observations.map((obs, idx) => (
              <li key={idx} className="leading-relaxed">
                • {obs}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold tracking-wide text-[#161B16] mb-2">
            7-Day Recovery &amp; Care Actions
          </h4>
          <ul className="space-y-1.5 text-sm text-[#161B16]/90">
            {immediateActions.map((act, idx) => (
              <li key={idx} className="leading-relaxed">
                {idx + 1}. {act}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function IdentifyWorkspace({
  previewDataUrl,
  userNotes,
  onChangeNotes,
  identifying,
  error,
  result,
  modelUsed,
  isSaved,
  onSelectFile,
  onSelectSample,
  onReanalyzeWithNotes,
  onReset,
  onSaveToGarden,
  onAskBotanist,
  onOpenFilePicker,
}: IdentifyWorkspaceProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onSelectFile(file);
    }
  };

  // Loading Skeleton State
  if (identifying) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="bg-white border border-[#E2E2DC] rounded-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              {previewDataUrl ? (
                <ResilientImage
                  src={previewDataUrl}
                  alt="Uploaded plant specimen being analyzed"
                  className="w-full aspect-[4/3] object-cover rounded-lg border border-[#E2E2DC]"
                />
              ) : (
                <div className="w-full aspect-[4/3] rounded-lg bg-[#EFEFEA] animate-pulse" />
              )}
            </div>
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#14532D]">
                  Inspecting botanical morphology &amp; foliage health
                </p>
                <div className="h-9 w-2/3 bg-[#EFEFEA] rounded animate-pulse" />
                <div className="h-5 w-1/2 bg-[#EFEFEA] rounded animate-pulse" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-[#EFEFEA] rounded animate-pulse" />
                <div className="h-4 w-11/12 bg-[#EFEFEA] rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-[#EFEFEA] rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-24 rounded-lg border border-[#E2E2DC] bg-[#F7F7F5] animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or Non-Plant Result State
  if (previewDataUrl && (error || (result && !result.isPlant))) {
    return (
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-10">
        <div className="bg-white border border-[#E2E2DC] rounded-xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5">
            <ResilientImage
              src={previewDataUrl}
              alt="Uploaded image"
              className="w-full aspect-[4/3] object-cover rounded-lg border border-[#E2E2DC]"
            />
          </div>
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {error ? "Identification Error" : "No Plant Detected in Photo"}
              </span>
            </div>
            <h2 className="font-display text-2xl font-medium text-[#161B16]">
              {error
                ? "Could not complete botanical analysis"
                : "Please upload a clearer photograph of a plant"}
            </h2>
            <p className="text-sm text-[#4B534B] leading-relaxed">
              {error ||
                result?.nonPlantMessage ||
                "Try capturing leaves, stems, or flowers in natural daylight so Herbarium can identify the species and inspect foliage health."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenFilePicker}
                className="px-4 py-2 text-sm font-medium text-white bg-[#14532D] hover:bg-[#0F3F22] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Choose Another Photo
              </button>
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2 text-sm font-medium text-[#161B16] bg-[#EFEFEA] hover:bg-[#E2E2DC] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Back to Workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Populated Specimen Care Sheet
  if (previewDataUrl && result && result.isPlant) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Main Specimen Identification Sheet */}
        <article className="bg-white border border-[#E2E2DC] rounded-xl overflow-hidden">
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Photo Column */}
            <div className="lg:col-span-5 space-y-3">
              <ResilientImage
                src={previewDataUrl}
                alt={`${result.commonName} (${result.scientificName})`}
                className="w-full aspect-[4/3] object-cover rounded-lg border border-[#E2E2DC]"
              />
              <div className="flex items-center justify-between gap-3 text-xs text-[#6B746B]">
                <span>
                  Identified via {modelUsed || "gemini-4-argon"}
                </span>
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 text-[#14532D] hover:underline font-medium cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Specimen</span>
                </button>
              </div>
            </div>

            {/* Taxonomic & Summary Column */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B746B] mb-2">
                  <span>{result.family}</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.specimenType}</span>
                  <span aria-hidden="true">·</span>
                  <span>Native to {result.originRegion}</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#161B16] text-balance">
                  {result.commonName}
                </h1>
                <p className="font-display italic text-lg text-[#4B534B] mt-0.5">
                  {result.scientificName}
                </p>
              </div>

              <p className="text-[15px] text-[#161B16]/90 leading-relaxed max-w-2xl">
                {result.botanicalSummary}
              </p>

              <p className="text-xs text-[#4B534B] leading-relaxed border-t border-[#E2E2DC] pt-3">
                <strong className="font-semibold text-[#161B16]">Morphological basis:</strong>{" "}
                {result.confidenceNote}
              </p>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onSaveToGarden}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isSaved
                      ? "bg-[#ECF3EE] text-[#14532D] border border-[#C5DEC9]"
                      : "bg-[#14532D] text-white hover:bg-[#0F3F22]"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 shrink-0" />
                      <span>Saved to My Garden</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4 shrink-0" />
                      <span>Save to My Garden</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onAskBotanist()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#161B16] bg-[#EFEFEA] hover:bg-[#E2E2DC] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Ask Botanist About This Plant</span>
                </button>
              </div>

              {/* Optional context refinement */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={userNotes}
                  onChange={(e) => onChangeNotes(e.target.value)}
                  placeholder="Add environment context (e.g., north window, repotted last month)"
                  className="flex-1 px-3 py-2 text-sm bg-[#F7F7F5] border border-[#E2E2DC] rounded-lg focus:outline-none focus:border-[#14532D]"
                />
                <button
                  type="button"
                  onClick={onReanalyzeWithNotes}
                  className="px-4 py-2 text-sm font-medium text-[#14532D] bg-white border border-[#E2E2DC] hover:border-[#14532D] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Refine Diagnosis
                </button>
              </div>
            </div>
          </div>

          {/* Health Assessment Band */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <HealthStatusBanner {...result.healthAssessment} />
          </div>

          {/* 6-Part Botanical Care Matrix (hairline grid, zero nested card clutter) */}
          <div className="border-t border-[#E2E2DC] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E2DC]">
            {/* 1. Light */}
            <div className="p-6 space-y-2.5 border-b border-[#E2E2DC]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#161B16]">
                <Sun className="w-4 h-4 text-[#14532D]" />
                <span>Light &amp; Exposure</span>
              </div>
              <div className="font-mono text-sm font-medium text-[#14532D] tabular-nums">
                {result.careProfile.light.level} · {result.careProfile.light.hoursPerDay}
              </div>
              <p className="text-sm text-[#4B534B] leading-relaxed">
                {result.careProfile.light.placement}
              </p>
            </div>

            {/* 2. Water */}
            <div className="p-6 space-y-2.5 border-b border-[#E2E2DC]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#161B16]">
                <Droplets className="w-4 h-4 text-[#14532D]" />
                <span>Watering Cadence</span>
              </div>
              <div className="font-mono text-sm font-medium text-[#14532D] tabular-nums">
                Every {result.careProfile.water.intervalDays} days · {result.careProfile.water.frequency}
              </div>
              <p className="text-sm text-[#4B534B] leading-relaxed">
                <strong className="font-medium text-[#161B16]">Soil check:</strong>{" "}
                {result.careProfile.water.moistureCue}
              </p>
              <p className="text-xs text-[#6B746B] leading-relaxed">
                {result.careProfile.water.method}
              </p>
            </div>

            {/* 3. Soil */}
            <div className="p-6 space-y-2.5 border-b border-[#E2E2DC]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#161B16]">
                <FlaskConical className="w-4 h-4 text-[#14532D]" />
                <span>Substrate &amp; pH</span>
              </div>
              <div className="font-mono text-sm font-medium text-[#14532D] tabular-nums">
                Target pH {result.careProfile.soil.phRange}
              </div>
              <p className="text-sm text-[#4B534B] leading-relaxed">
                {result.careProfile.soil.mix}
              </p>
              <p className="text-xs text-[#6B746B] leading-relaxed">
                {result.careProfile.soil.drainageNote}
              </p>
            </div>

            {/* 4. Climate */}
            <div className="p-6 space-y-2.5 border-b lg:border-b-0 border-[#E2E2DC]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#161B16]">
                <Thermometer className="w-4 h-4 text-[#14532D]" />
                <span>Climate &amp; Hardiness</span>
              </div>
              <div className="font-mono text-sm font-medium text-[#14532D] tabular-nums">
                {result.careProfile.climate.tempRange} · RH {result.careProfile.climate.humidityRange}
              </div>
              <p className="text-sm text-[#4B534B] leading-relaxed">
                USDA Hardiness: <span className="font-mono tabular-nums">{result.careProfile.climate.hardinessZones}</span>
              </p>
            </div>

            {/* 5. Nutrition */}
            <div className="p-6 space-y-2.5 border-b md:border-b-0 border-[#E2E2DC]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#161B16]">
                <Calendar className="w-4 h-4 text-[#14532D]" />
                <span>Feeding &amp; Dormancy</span>
              </div>
              <div className="font-mono text-sm font-medium text-[#14532D] tabular-nums">
                NPK {result.careProfile.fertilizer.npkRatio}
              </div>
              <p className="text-sm text-[#4B534B] leading-relaxed">
                {result.careProfile.fertilizer.schedule}
              </p>
              <p className="text-xs text-[#6B746B] leading-relaxed">
                {result.careProfile.fertilizer.dormancyNote}
              </p>
            </div>

            {/* 6. Pruning & Propagation */}
            <div className="p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#161B16]">
                <Scissors className="w-4 h-4 text-[#14532D]" />
                <span>Pruning &amp; Propagation</span>
              </div>
              <div className="text-sm font-medium text-[#14532D]">
                {result.careProfile.pruningAndPropagation.propagationMethod}
              </div>
              <p className="text-sm text-[#4B534B] leading-relaxed">
                {result.careProfile.pruningAndPropagation.pruning}
              </p>
              <p className="text-xs text-[#6B746B] leading-relaxed">
                Repotting: {result.careProfile.pruningAndPropagation.repottingCadence}
              </p>
            </div>
          </div>

          {/* Toxicity & Seasonal Schedule */}
          <div className="border-t border-[#E2E2DC] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#FBFBF9]">
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#161B16]">
                <ShieldAlert className="w-4 h-4 text-[#14532D]" />
                <span>Household &amp; Pet Safety</span>
              </div>
              <div className="space-y-2 text-sm text-[#4B534B]">
                <p>
                  <strong className="font-medium text-[#161B16]">Pets:</strong>{" "}
                  {result.toxicity.pets}
                </p>
                <p>
                  <strong className="font-medium text-[#161B16]">Humans:</strong>{" "}
                  {result.toxicity.humans}
                </p>
                <p className="text-xs text-[#6B746B] leading-relaxed pt-1">
                  {result.toxicity.safetyNote}
                </p>
              </div>
            </div>

            <div className="lg:col-span-8">
              <h3 className="text-sm font-semibold text-[#161B16] mb-3 font-sans">
                Four-Season Care Rhythm
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.seasonalChecklist.map((item) => (
                  <div
                    key={item.season}
                    className="border border-[#E2E2DC] bg-white rounded-lg p-3.5 space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-[#14532D]">
                      {item.season}
                    </div>
                    <div className="text-xs font-medium text-[#161B16]">
                      {item.focus}
                    </div>
                    <p className="text-xs text-[#4B534B] leading-relaxed">
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Suggested Follow-up Questions -> Botanist Chat */}
        <section className="bg-white border border-[#E2E2DC] rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-xl font-medium text-[#161B16]">
                Continue with the Herbarium Botanist
              </h2>
              <p className="text-sm text-[#4B534B]">
                Select a tailored question to open a multi-turn consultation grounded in this specimen.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.suggestedFollowUpQuestions.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAskBotanist(question)}
                className="text-left p-4 rounded-lg border border-[#E2E2DC] hover:border-[#14532D] hover:bg-[#F7F7F5] transition-colors flex items-start justify-between gap-3 cursor-pointer group"
              >
                <span className="text-sm text-[#161B16] leading-snug">
                  {question}
                </span>
                <ArrowRight className="w-4 h-4 text-[#6B746B] group-hover:text-[#14532D] shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Initial Editorial Split Hero (Before Upload)
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Editorial Headline + Dropzone + Sample Specimens */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-medium text-[#4B534B]">
              Botanical Vision &amp; Horticultural Field Guide
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight leading-[1.08] text-[#161B16] text-balance max-w-2xl">
              Identify any plant and read its living care sheet.
            </h1>
            <p className="text-base text-[#4B534B] leading-relaxed max-w-xl">
              Photograph a houseplant, herb, or garden shrub to uncover its exact species, spot early signs of stress, and follow an actionable care schedule.
            </p>
          </div>

          {/* Interactive Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`bg-white border-2 border-dashed rounded-xl p-6 transition-colors ${
              isDragging
                ? "border-[#14532D] bg-[#ECF3EE]/50"
                : "border-[#D0D4CC] hover:border-[#14532D]/60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#ECF3EE] text-[#14532D] flex items-center justify-center shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-sans text-base font-semibold text-[#161B16]">
                    Upload or drop a plant photograph
                  </h2>
                  <p className="text-xs text-[#6B746B]">
                    Clear leaves, stems, or flowers in natural light work best (JPEG, PNG, WebP).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenFilePicker}
                className="px-4 py-2.5 text-sm font-medium text-white bg-[#14532D] hover:bg-[#0F3F22] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Choose Photo
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E2E2DC]">
              <label htmlFor="pre-upload-notes" className="sr-only">
                Optional growing notes
              </label>
              <input
                id="pre-upload-notes"
                type="text"
                value={userNotes}
                onChange={(e) => onChangeNotes(e.target.value)}
                placeholder="Optional: add context before uploading (e.g., south window, yellowing lower leaf)"
                className="w-full px-3.5 py-2 text-sm bg-[#F7F7F5] border border-[#E2E2DC] rounded-lg focus:outline-none focus:border-[#14532D]"
              />
            </div>
          </div>

          {/* 3 Instant Sample Specimens */}
          <div className="space-y-2.5">
            <div className="text-xs font-medium text-[#4B534B]">
              Or inspect a sample botanical photograph right now:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_SPECIMENS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onSelectSample(sample.imageUrl, sample.defaultNotes)}
                  className="group bg-white border border-[#E2E2DC] hover:border-[#14532D] rounded-lg p-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <ResilientImage
                    src={sample.imageUrl}
                    alt={sample.label}
                    className="w-12 h-12 rounded-md object-cover shrink-0 border border-[#E2E2DC]"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#161B16] group-hover:text-[#14532D] truncate">
                      {sample.label}
                    </div>
                    <div className="text-xs text-[#6B746B] truncate">
                      {sample.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Full-height Conservatory Visual Anchor */}
        <div className="lg:col-span-5">
          <div className="relative h-full min-h-[340px] rounded-xl overflow-hidden border border-[#E2E2DC] bg-[#EFEFEA]">
            <ResilientImage
              src={HERO_CONSERVATORY_URL}
              alt="Sunlit glass conservatory workbench with stoneware pots, Monstera, ferns, brass watering can, and botanical field journal"
              className="w-full h-full lg:h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
              <p className="font-display italic text-lg leading-snug">
                Visual diagnostics &amp; archival care sheets
              </p>
              <p className="text-xs text-white/80 mt-1">
                Powered by Gemini 4 botanical vision &amp; multi-turn horticultural reasoning
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width 4-Column Capabilities Strip below the hero split */}
      <section
        aria-label="Core capabilities"
        className="border-t border-b border-[#E2E2DC] bg-white rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E2DC]"
      >
        <div className="p-5 space-y-1.5">
          <div className="text-sm font-semibold text-[#161B16]">
            01. Taxonomic Identification
          </div>
          <p className="text-xs text-[#4B534B] leading-relaxed">
            Pinpoints species, botanical family, and origin region from leaf venation, margins, and growth habit.
          </p>
        </div>
        <div className="p-5 space-y-1.5">
          <div className="text-sm font-semibold text-[#161B16]">
            02. Foliage Health Check
          </div>
          <p className="text-xs text-[#4B534B] leading-relaxed">
            Inspects chlorosis, crispy margins, pest webbing, and overwatering cues with a 7-day recovery plan.
          </p>
        </div>
        <div className="p-5 space-y-1.5">
          <div className="text-sm font-semibold text-[#161B16]">
            03. Precision Care Matrix
          </div>
          <p className="text-xs text-[#4B534B] leading-relaxed">
            Structured light hours, watering intervals, target substrate pH, NPK ratios, and pet safety guidance.
          </p>
        </div>
        <div className="p-5 space-y-1.5">
          <div className="text-sm font-semibold text-[#161B16]">
            04. Specialist Botanist Chat
          </div>
          <p className="text-xs text-[#4B534B] leading-relaxed">
            Multi-turn consultation with dedicated horticulturist, pathologist, and garden architect modes.
          </p>
        </div>
      </section>
    </div>
  );
}

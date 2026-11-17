import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  MessageSquare,
  Search,
  Sprout,
  Trash2,
} from "lucide-react";
import type { SavedSpecimen } from "../types";
import { ResilientImage } from "./ResilientImage";

interface MyGardenViewProps {
  specimens: SavedSpecimen[];
  onMarkWatered: (id: string) => void;
  onOpenSpecimen: (specimen: SavedSpecimen) => void;
  onAskAboutSpecimen: (specimen: SavedSpecimen) => void;
  onRemoveSpecimen: (id: string) => void;
  onGoIdentify: () => void;
}

type GardenFilter = "all" | "due" | "attention" | "healthy";

function getDaysUntilNextWatering(specimen: SavedSpecimen): number {
  const interval = Math.max(1, specimen.data.careProfile.water.intervalDays || 7);
  const lastWatered = new Date(specimen.lastWateredAt).getTime();
  const nextDue = lastWatered + interval * 24 * 60 * 60 * 1000;
  return Math.ceil((nextDue - Date.now()) / (24 * 60 * 60 * 1000));
}

export function MyGardenView({
  specimens,
  onMarkWatered,
  onOpenSpecimen,
  onAskAboutSpecimen,
  onRemoveSpecimen,
  onGoIdentify,
}: MyGardenViewProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<GardenFilter>("all");

  const stats = useMemo(() => {
    let dueCount = 0;
    let healthyCount = 0;
    for (const s of specimens) {
      if (getDaysUntilNextWatering(s) <= 0) dueCount += 1;
      if (s.data.healthAssessment.status === "Healthy") healthyCount += 1;
    }
    return {
      total: specimens.length,
      dueCount,
      healthyCount,
    };
  }, [specimens]);

  const filtered = useMemo(() => {
    return specimens.filter((s) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const matches =
          s.data.commonName.toLowerCase().includes(q) ||
          s.data.scientificName.toLowerCase().includes(q) ||
          s.data.family.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filter === "due") return getDaysUntilNextWatering(s) <= 0;
      if (filter === "attention") return s.data.healthAssessment.status !== "Healthy";
      if (filter === "healthy") return s.data.healthAssessment.status === "Healthy";
      return true;
    });
  }, [specimens, search, filter]);

  if (specimens.length === 0) {
    return (
      <div className="max-w-[780px] mx-auto px-4 sm:px-8 py-16">
        <div className="bg-white border border-[#E2E2DC] rounded-xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#ECF3EE] text-[#14532D] flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-medium text-[#161B16]">
            Your garden archive is empty
          </h1>
          <p className="text-sm text-[#4B534B] max-w-md mx-auto leading-relaxed">
            Identify a plant from a photo and save its care sheet to track watering intervals, foliage health, and seasonal routines here.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onGoIdentify}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#14532D] hover:bg-[#0F3F22] rounded-lg transition-colors cursor-pointer"
            >
              Identify Your First Plant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header & Summary Numbers */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-[#161B16]">
            My Garden Collection
          </h1>
          <p className="text-sm text-[#4B534B] mt-1">
            Saved plant care sheets and active watering cadence.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white border border-[#E2E2DC] rounded-xl px-5 py-3 text-sm">
          <div>
            <span className="text-xs text-[#6B746B] block">Specimens</span>
            <span className="font-mono font-semibold text-lg text-[#161B16] tabular-nums">
              {stats.total}
            </span>
          </div>
          <div className="h-8 w-px bg-[#E2E2DC]" />
          <div>
            <span className="text-xs text-[#6B746B] block">Watering Due</span>
            <span className="font-mono font-semibold text-lg text-[#B45309] tabular-nums">
              {stats.dueCount}
            </span>
          </div>
          <div className="h-8 w-px bg-[#E2E2DC]" />
          <div>
            <span className="text-xs text-[#6B746B] block">Healthy</span>
            <span className="font-mono font-semibold text-lg text-[#15803D] tabular-nums">
              {stats.healthyCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="inline-flex items-center gap-1 p-1 bg-[#EFEFEA] rounded-lg self-start"
          role="tablist"
          aria-label="Filter garden specimens"
        >
          {(
            [
              { id: "all", label: "All Plants" },
              { id: "due", label: "Watering Due" },
              { id: "attention", label: "Needs Attention" },
              { id: "healthy", label: "Healthy" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? "bg-white text-[#161B16] shadow-xs"
                  : "text-[#4B534B] hover:text-[#161B16]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#6B746B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name or family..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E2E2DC] rounded-lg focus:outline-none focus:border-[#14532D]"
          />
        </div>
      </div>

      {/* Specimens Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E2DC] rounded-xl p-8 text-center text-sm text-[#4B534B]">
          No saved specimens match the active filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((specimen) => {
            const daysLeft = getDaysUntilNextWatering(specimen);
            const status = specimen.data.healthAssessment.status;
            const StatusIcon =
              status === "Healthy"
                ? CheckCircle2
                : status === "Mild Stress"
                ? AlertTriangle
                : AlertCircle;
            const statusColor =
              status === "Healthy"
                ? "text-[#15803D]"
                : status === "Mild Stress"
                ? "text-[#B45309]"
                : "text-[#B91C1C]";

            return (
              <article
                key={specimen.id}
                className="bg-white border border-[#E2E2DC] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onOpenSpecimen(specimen)}
                    className="w-full text-left cursor-pointer group"
                  >
                    <ResilientImage
                      src={specimen.photoDataUrl}
                      alt={specimen.data.commonName}
                      className="w-full aspect-[4/3] object-cover border-b border-[#E2E2DC]"
                    />
                    <div className="p-5 pb-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#6B746B]">
                        <span>{specimen.data.family}</span>
                        <span className={`inline-flex items-center gap-1 font-medium ${statusColor}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{status}</span>
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-medium text-[#161B16] group-hover:text-[#14532D] transition-colors">
                        {specimen.data.commonName}
                      </h2>
                      <p className="font-display italic text-sm text-[#4B534B]">
                        {specimen.data.scientificName}
                      </p>
                    </div>
                  </button>

                  <div className="px-5 py-3 border-t border-[#E2E2DC] bg-[#FBFBF9] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[#4B534B]">
                      <span>Light</span>
                      <span className="font-medium text-[#161B16]">
                        {specimen.data.careProfile.light.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#4B534B]">
                      <span>Watering cadence</span>
                      <span className="font-mono tabular-nums font-medium text-[#161B16]">
                        Every {specimen.data.careProfile.water.intervalDays}d
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#4B534B]">
                      <span>Next watering</span>
                      <span
                        className={`font-mono tabular-nums font-medium ${
                          daysLeft <= 0 ? "text-[#B45309]" : "text-[#15803D]"
                        }`}
                      >
                        {daysLeft <= 0 ? "Due today" : `In ${daysLeft} days`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-[#E2E2DC] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onMarkWatered(specimen.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#14532D] bg-[#ECF3EE] hover:bg-[#DCE9DF] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Log Watered</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAskAboutSpecimen(specimen)}
                      title="Ask Botanist about this plant"
                      className="p-1.5 text-[#4B534B] hover:text-[#14532D] hover:bg-[#EFEFEA] rounded-md transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveSpecimen(specimen.id)}
                      title="Remove from My Garden"
                      className="p-1.5 text-[#4B534B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

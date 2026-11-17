import { Upload } from "lucide-react";
import type { AppTab } from "../types";

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onTriggerUpload: () => void;
  gardenCount: number;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string }> = [
  { id: "identify", label: "Identify" },
  { id: "chat", label: "Botanist Chat" },
  { id: "garden", label: "My Garden" },
  { id: "seasonal", label: "Seasonal Guide" },
];

export function TopBar({
  activeTab,
  onSelectTab,
  onTriggerUpload,
  gardenCount,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F7F7F5]/95 backdrop-blur-sm border-b border-[#E2E2DC]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab("identify")}
          className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#161B16] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14532D]"
        >
          Herbarium
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const labelText =
              item.id === "garden" && gardenCount > 0
                ? `${item.label} (${gardenCount})`
                : item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14532D] ${
                  isActive
                    ? "border-[#14532D] text-[#161B16] font-semibold"
                    : "border-transparent text-[#4B534B] hover:text-[#161B16] hover:border-[#C8CCC4]"
                }`}
              >
                {labelText}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#14532D] hover:bg-[#0F3F22] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Compact mobile nav row (kept low height to honor <= 15% mobile sticky cap) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden border-t border-[#E2E2DC] px-4 flex items-center justify-between gap-2 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-2.5 px-1 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? "border-[#14532D] text-[#161B16] font-semibold"
                  : "border-transparent text-[#4B534B]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

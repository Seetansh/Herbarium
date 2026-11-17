import { useState } from "react";
import Markdown from "react-markdown";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";

type SeasonName = "Spring" | "Summer" | "Autumn" | "Winter";

const SEASON_GUIDES: Record<
  SeasonName,
  {
    headline: string;
    tasks: Array<{ area: string; guidance: string }>;
  }
> = {
  Spring: {
    headline: "Awakening growth, gentle feeding, and repotting",
    tasks: [
      {
        area: "Repotting & Substrate",
        guidance:
          "Inspect roots for circling; step up only 1–2 inches in pot diameter with fresh aerated mix.",
      },
      {
        area: "Nutrition",
        guidance:
          "Resume diluted balanced fertilizer (half-strength) as new shoots and unfurling leaves appear.",
      },
      {
        area: "Pruning",
        guidance:
          "Trim winter-leggy stems above a node to stimulate fuller branching and harvest healthy cuttings.",
      },
      {
        area: "Light Transition",
        guidance:
          "Acclimate overwintered plants gradually to stronger morning sun before moving outdoors.",
      },
    ],
  },
  Summer: {
    headline: "Peak hydration, heat shielding, and pest vigilance",
    tasks: [
      {
        area: "Watering Rhythm",
        guidance:
          "Check top 2 inches of soil twice weekly; water deeply early in the morning to minimize evaporation.",
      },
      {
        area: "Sun & Heat",
        guidance:
          "Shear afternoon sun through sheer curtains for tropical foliage; mulch outdoor beds to cool roots.",
      },
      {
        area: "Pest Scouting",
        guidance:
          "Inspect leaf undersides weekly for spider mites, aphids, and thrips during warm dry spells.",
      },
      {
        area: "Airflow",
        guidance:
          "Maintain gentle air circulation around dense canopies to prevent powdery mildew and fungal leaf spot.",
      },
    ],
  },
  Autumn: {
    headline: "Tapering nutrients, frost prep, and indoor acclimation",
    tasks: [
      {
        area: "Transition Indoors",
        guidance:
          "Rinse foliage and quarantine patio plants for 10 days before bringing inside ahead of 10°C nights.",
      },
      {
        area: "Feeding Taper",
        guidance:
          "Stop fertilizing most indoor tropicals and woody perennials as daylength shortens.",
      },
      {
        area: "Water Reduction",
        guidance:
          "Allow the top layer of potting mix to dry slightly longer between soakings as transpiration slows.",
      },
      {
        area: "Bulb & Bed Prep",
        guidance:
          "Plant spring-blooming bulbs and top-dress garden beds with mature leaf mold or compost.",
      },
    ],
  },
  Winter: {
    headline: "Dormancy protection, humidity care, and light maximization",
    tasks: [
      {
        area: "Window Exposure",
        guidance:
          "Clean window glass and shift light-hungry specimens closer to south or west exposures; keep leaves off cold panes.",
      },
      {
        area: "Dry Heating Air",
        guidance:
          "Group humidity-sensitive ferns and calatheas away from radiators or vents; aim for 45–55% RH.",
      },
      {
        area: "Root Rot Prevention",
        guidance:
          "Never leave standing water in saucers; test deep soil moisture before watering dormant plants.",
      },
      {
        area: "Rest & Planning",
        guidance:
          "Avoid major repotting or heavy pruning until late winter days lengthen.",
      },
    ],
  },
};

const SYMPTOM_MATRIX = [
  {
    symptom: "Uniform yellow lower leaves, soggy soil",
    cause: "Overwatering or compacted, poorly draining substrate",
    action: "Check drainage holes, pause watering until top 5 cm dries, aerate with perlite/bark",
  },
  {
    symptom: "Crispy brown leaf tips and margins",
    cause: "Low ambient humidity, mineral buildup, or missed waterings",
    action: "Flush soil thoroughly with filtered water and relocate away from heating vents",
  },
  {
    symptom: "Pale new leaves with dark green veins",
    cause: "Interveinal chlorosis (iron/magnesium lockout or high pH)",
    action: "Test substrate pH and apply chelated micronutrients at quarter strength",
  },
  {
    symptom: "Fine webbing or silvery stippling under leaves",
    cause: "Spider mites thriving in warm, dry stagnant air",
    action: "Rinse foliage undersides thoroughly and apply insecticidal soap 3 times, 5 days apart",
  },
  {
    symptom: "Leggy, elongated stems leaning toward glass",
    cause: "Insufficient light intensity (etiolation)",
    action: "Move closer to unobstructed light or supplement with full-spectrum LED grow lighting",
  },
];

function detectCurrentSeason(): SeasonName {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}

export function SeasonalGuideView() {
  const [season, setSeason] = useState<SeasonName>(detectCurrentSeason);
  const [query, setQuery] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);
  const [tipResult, setTipResult] = useState<string | null>(null);
  const [tipError, setTipError] = useState<string | null>(null);

  const activeGuide = SEASON_GUIDES[season];

  const handleQuickLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loadingTip) return;
    setLoadingTip(true);
    setTipError(null);
    try {
      const res = await fetch("/api/quick-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), season }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not fetch seasonal tip.");
      }
      setTipResult(data.tip);
    } catch (err) {
      setTipError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoadingTip(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-[#161B16]">
            Seasonal Horticulture Guide
          </h1>
          <p className="text-sm text-[#4B534B] mt-1">
            Quarterly care priorities, symptom triage, and fast climate-specific lookups.
          </p>
        </div>

        {/* Season Segmented Tabs */}
        <div
          className="inline-flex items-center gap-1 p-1 bg-[#EFEFEA] rounded-lg self-start"
          role="tablist"
          aria-label="Select season"
        >
          {(["Spring", "Summer", "Autumn", "Winter"] as SeasonName[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={season === item}
                onClick={() => setSeason(item)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  season === item
                    ? "bg-white text-[#161B16] shadow-xs"
                    : "text-[#4B534B] hover:text-[#161B16]"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>
      </div>

      {/* Season Priority Grid */}
      <section className="bg-white border border-[#E2E2DC] rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E2DC] flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-[#14532D]" />
          <h2 className="font-display text-xl font-medium text-[#161B16]">
            {season}: {activeGuide.headline}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E2DC]">
          {activeGuide.tasks.map((task) => (
            <div key={task.area} className="p-6 space-y-2">
              <div className="text-sm font-semibold text-[#14532D]">
                {task.area}
              </div>
              <p className="text-sm text-[#4B534B] leading-relaxed">
                {task.guidance}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Fast AI Zone & Plant Lookup (gemini-3.1-flash-lite) */}
      <section className="bg-white border border-[#E2E2DC] rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-medium text-[#161B16]">
              Instant Climate &amp; Plant Task Lookup
            </h2>
            <p className="text-sm text-[#4B534B]">
              Enter a plant species, USDA hardiness zone, or indoor setup for immediate {season.toLowerCase()} guidance.
            </p>
          </div>
          <span className="font-mono text-xs text-[#6B746B]">
            gemini-3.1-flash-lite
          </span>
        </div>

        <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Zone 6b outdoor lavender, or Calathea near radiator"
            className="flex-1 px-4 py-2.5 text-sm bg-[#F7F7F5] border border-[#E2E2DC] rounded-lg focus:outline-none focus:border-[#14532D]"
          />
          <button
            type="submit"
            disabled={loadingTip || !query.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#14532D] hover:bg-[#0F3F22] disabled:bg-[#C8CCC4] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {loadingTip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Looking up...</span>
              </>
            ) : (
              <>
                <span>Get {season} Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {tipError && (
          <div className="px-4 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
            {tipError}
          </div>
        )}

        {tipResult && (
          <div className="p-4 rounded-lg bg-[#FBFBF9] border border-[#E2E2DC] botanist-prose text-sm text-[#161B16]">
            <Markdown>{tipResult}</Markdown>
          </div>
        )}
      </section>

      {/* Symptom Reference Table */}
      <section className="bg-white border border-[#E2E2DC] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E2DC]">
          <h2 className="font-display text-xl font-medium text-[#161B16]">
            Foliage Symptom Reference
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E2DC] bg-[#FBFBF9] text-xs font-semibold text-[#4B534B]">
                <th className="py-3 px-6">Visible Symptom</th>
                <th className="py-3 px-6">Likely Cause</th>
                <th className="py-3 px-6">Immediate Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E2DC] text-sm">
              {SYMPTOM_MATRIX.map((row) => (
                <tr key={row.symptom} className="hover:bg-[#FBFBF9] transition-colors">
                  <td className="py-3.5 px-6 font-medium text-[#161B16]">
                    {row.symptom}
                  </td>
                  <td className="py-3.5 px-6 text-[#4B534B]">{row.cause}</td>
                  <td className="py-3.5 px-6 text-[#14532D]">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

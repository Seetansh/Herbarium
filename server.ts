import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import type { Content, Part } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      const isTransient =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("DEADLINE_EXCEEDED");
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 700 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("GEMINI_API_KEY is not configured")) {
    return {
      status: 500,
      message: "Gemini API key is missing. Please configure GEMINI_API_KEY in Settings > Secrets.",
    };
  }
  if (raw.includes("403") || raw.includes("PERMISSION_DENIED") || raw.includes("API_KEY_INVALID")) {
    return {
      status: 403,
      message: "API key permission error. Please verify your paid Gemini API key in Settings > Secrets.",
    };
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "Rate limit or quota reached for this Gemini model. Please wait a moment or check your billing quota in Settings > Secrets.",
    };
  }
  if (raw.includes("404") || raw.includes("NOT_FOUND")) {
    return {
      status: 404,
      message: "Requested Gemini model could not be reached. Please check model availability.",
    };
  }
  return {
    status: 500,
    message: raw || "An unexpected error occurred while consulting Gemini.",
  };
}

const plantIdentificationSchema = {
  type: Type.OBJECT,
  properties: {
    isPlant: {
      type: Type.BOOLEAN,
      description: "True if the image clearly depicts a plant, tree, flower, herb, succulent, or foliage; false otherwise.",
    },
    nonPlantMessage: {
      type: Type.STRING,
      description: "If isPlant is false, a polite explanation of what appears in the image and a prompt to upload a plant photo.",
    },
    commonName: { type: Type.STRING, description: "Primary common name of the identified plant." },
    scientificName: { type: Type.STRING, description: "Botanical Latin binomial name." },
    family: { type: Type.STRING, description: "Botanical family name (e.g., Araceae, Lamiaceae)." },
    originRegion: { type: Type.STRING, description: "Native geographic habitat or origin region." },
    specimenType: {
      type: Type.STRING,
      description: "Concise classification such as Tropical Aroid, Mediterranean Herb, Evergreen Shrub, or Desert Succulent.",
    },
    confidenceNote: {
      type: Type.STRING,
      description: "Brief botanical basis for the identification based on visible morphological features.",
    },
    botanicalSummary: {
      type: Type.STRING,
      description: "Two to three sentence editorial overview of the species, growth habit, and defining traits.",
    },
    healthAssessment: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Must be one of: Healthy, Mild Stress, Needs Attention, Critical",
        },
        headline: {
          type: Type.STRING,
          description: "Short plain-language summary of the visible condition in the photo.",
        },
        observations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Specific visual cues observed in foliage color, turgor, margins, spots, or soil surface.",
        },
        immediateActions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Concrete, prioritized care steps the gardener should take over the next 7 days.",
        },
      },
      required: ["status", "headline", "observations", "immediateActions"],
    },
    careProfile: {
      type: Type.OBJECT,
      properties: {
        light: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING, description: "e.g. Bright Indirect, Full Sun, Partial Shade" },
            hoursPerDay: { type: Type.STRING, description: "e.g. 6-8 hrs filtered" },
            placement: { type: Type.STRING, description: "Specific window orientation or outdoor exposure advice." },
          },
          required: ["level", "hoursPerDay", "placement"],
        },
        water: {
          type: Type.OBJECT,
          properties: {
            frequency: { type: Type.STRING, description: "e.g. Every 7-10 days in active season" },
            intervalDays: {
              type: Type.INTEGER,
              description: "Recommended typical days between waterings during active growth.",
            },
            method: { type: Type.STRING, description: "How to water (deep soak, bottom watering, misting notes)." },
            moistureCue: { type: Type.STRING, description: "Physical soil check cue before watering again." },
          },
          required: ["frequency", "intervalDays", "method", "moistureCue"],
        },
        soil: {
          type: Type.OBJECT,
          properties: {
            mix: { type: Type.STRING, description: "Ideal substrate composition and aeration ratio." },
            phRange: { type: Type.STRING, description: "e.g. 5.5 - 6.5" },
            drainageNote: { type: Type.STRING, description: "Pot material and drainage hole guidance." },
          },
          required: ["mix", "phRange", "drainageNote"],
        },
        climate: {
          type: Type.OBJECT,
          properties: {
            tempRange: { type: Type.STRING, description: "e.g. 18-27 C (65-80 F)" },
            humidityRange: { type: Type.STRING, description: "e.g. 50-70%" },
            hardinessZones: { type: Type.STRING, description: "USDA Hardiness Zones, e.g. 10-12 or Indoor" },
          },
          required: ["tempRange", "humidityRange", "hardinessZones"],
        },
        fertilizer: {
          type: Type.OBJECT,
          properties: {
            schedule: { type: Type.STRING, description: "Feeding cadence across spring/summer vs winter." },
            npkRatio: { type: Type.STRING, description: "e.g. 3-1-2 or Balanced 10-10-10" },
            dormancyNote: { type: Type.STRING, description: "When to pause or dilute feeding." },
          },
          required: ["schedule", "npkRatio", "dormancyNote"],
        },
        pruningAndPropagation: {
          type: Type.OBJECT,
          properties: {
            pruning: { type: Type.STRING, description: "How and when to prune spent or leggy growth." },
            propagationMethod: { type: Type.STRING, description: "Best propagation technique (stem node, division, seed)." },
            repottingCadence: { type: Type.STRING, description: "Typical interval and rootbound cues." },
          },
          required: ["pruning", "propagationMethod", "repottingCadence"],
        },
      },
      required: ["light", "water", "soil", "climate", "fertilizer", "pruningAndPropagation"],
    },
    toxicity: {
      type: Type.OBJECT,
      properties: {
        pets: { type: Type.STRING, description: "e.g. Mildly toxic to cats and dogs, or Non-toxic" },
        humans: { type: Type.STRING, description: "Safety summary for humans/children." },
        safetyNote: { type: Type.STRING, description: "Specific compounds or handling precaution if applicable." },
      },
      required: ["pets", "humans", "safetyNote"],
    },
    seasonalChecklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          season: { type: Type.STRING },
          focus: { type: Type.STRING },
          action: { type: Type.STRING },
        },
        required: ["season", "focus", "action"],
      },
    },
    suggestedFollowUpQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Three thoughtful, practical follow-up questions tailored to this plant and its visible condition.",
    },
  },
  required: [
    "isPlant",
    "commonName",
    "scientificName",
    "family",
    "originRegion",
    "specimenType",
    "confidenceNote",
    "botanicalSummary",
    "healthAssessment",
    "careProfile",
    "toxicity",
    "seasonalChecklist",
    "suggestedFollowUpQuestions",
  ],
};

type SpecialistMode = "general" | "pathology" | "architect" | "quick";

interface ChatModelConfig {
  model: string;
  thinkingLevel: ThinkingLevel;
  roleInstruction: string;
}

function getChatConfig(mode: SpecialistMode): ChatModelConfig {
  switch (mode) {
    case "pathology":
      return {
        model: "gemini-4-carbon",
        thinkingLevel: ThinkingLevel.HIGH,
        roleInstruction:
          "You are Dr. Linnea Vance, Senior Plant Pathologist & Soil Chemist at Herbarium. Your specialty is deep root-cause differential diagnosis of plant stress, chlorosis, fungal/bacterial lesions, root rot, mineral lockouts, and integrated pest management. Reason systematically through symptoms, differential causes, environmental triggers, and step-by-step recovery protocols.",
      };
    case "architect":
      return {
        model: "gemini-4-argon",
        thinkingLevel: ThinkingLevel.MEDIUM,
        roleInstruction:
          "You are Julian Mercer, Botanical Garden Architect & Microclimate Designer at Herbarium. Your specialty is complex spatial garden planning, companion planting matrices, indoor light mapping, container/substrate engineering, and multi-season succession design. Provide structured, actionable plans tailored to the user's space and light.",
      };
    case "quick":
      return {
        model: "gemini-3.1-flash-lite",
        thinkingLevel: ThinkingLevel.MINIMAL,
        roleInstruction:
          "You are Herbarium Quick Care Assistant. Deliver crisp, direct, high-precision botanical answers in 2 to 5 concise bullet points or short sentences. Focus on exact ratios, toxicity verdicts, watering cues, and immediate dos and don'ts without fluff.",
      };
    case "general":
    default:
      return {
        model: "gemini-4-hydrogen",
        thinkingLevel: ThinkingLevel.MEDIUM,
        roleInstruction:
          "You are Clara Thorn, Head Horticulturist at Herbarium. You provide warm, authoritative, practical guidance for indoor houseplants, patio containers, kitchen herbs, and outdoor beds. Explain the 'why' behind watering, light, soil, and pruning recommendations clearly so gardeners build lasting intuition.",
      };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Plant identification & visual diagnosis (uses gemini-4-argon)
  app.post("/api/identify", async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType, userNotes } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        userNotes?: string;
      };

      if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: "Please provide a valid image payload and MIME type." });
        return;
      }

      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const ai = createAiClient();

      const promptLines = [
        "Examine this photograph carefully as an expert botanist and plant pathologist.",
        "First verify whether the image depicts a real plant, tree, herb, flower, or foliage.",
        "If it is a plant, identify the exact species (or closest cultivar/genus if ambiguous), inspect every visible leaf, stem, margin, and substrate detail for signs of stress, pests, nutrient deficiency, or hydration issues, and produce a comprehensive care sheet.",
        "Always output all 4 seasons (Spring, Summer, Autumn, Winter) in seasonalChecklist.",
      ];

      if (userNotes && userNotes.trim()) {
        promptLines.push(`Gardener context notes: "${userNotes.trim()}"`);
      }

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: "gemini-4-argon",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptLines.join(" "),
              },
            ],
          },
          config: {
            systemInstruction:
              "You are the Lead Botanical Diagnostician at Herbarium. Be scientifically accurate, specific to what is actually visible in the photograph, and practical for home gardeners. Keep numeric fields clean and concise.",
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MEDIUM,
            },
            responseMimeType: "application/json",
            responseSchema: plantIdentificationSchema,
          },
        })
      );

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: "The model returned an empty identification response." });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({ result: parsed, modelUsed: "gemini-4-argon" });
    } catch (err: unknown) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  // Multi-turn streaming botanist chat (SSE)
  app.post("/api/chat", async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const {
        messages,
        userMessage,
        mode = "general",
        specimenContext,
        imageBase64,
        imageMimeType,
      } = req.body as {
        messages?: Array<{ role: "user" | "assistant"; text: string }>;
        userMessage?: string;
        mode?: SpecialistMode;
        specimenContext?: {
          commonName: string;
          scientificName: string;
          healthStatus?: string;
          healthHeadline?: string;
          lightLevel?: string;
          waterFrequency?: string;
          soilMix?: string;
        } | null;
        imageBase64?: string;
        imageMimeType?: string;
      };

      if (!userMessage?.trim() && !imageBase64) {
        sendEvent({ error: "Please enter a question or attach a plant photo." });
        res.end();
        return;
      }

      const ai = createAiClient();
      const baseConfig = getChatConfig(mode);
      // Use gemini-4-argon whenever an image is attached in chat
      const effectiveModel = imageBase64 ? "gemini-4-argon" : baseConfig.model;
      const effectiveThinkingLevel = imageBase64 ? ThinkingLevel.MEDIUM : baseConfig.thinkingLevel;

      let systemInstruction = baseConfig.roleInstruction;
      if (specimenContext) {
        systemInstruction += `\n\nActive Plant Specimen Context:\n- Common Name: ${specimenContext.commonName}\n- Scientific Name: ${specimenContext.scientificName}\n- Observed Health: ${specimenContext.healthStatus ?? "Unknown"} (${specimenContext.healthHeadline ?? ""})\n- Light: ${specimenContext.lightLevel ?? "N/A"}\n- Watering: ${specimenContext.waterFrequency ?? "N/A"}\n- Substrate: ${specimenContext.soilMix ?? "N/A"}\nReference this plant naturally when relevant to the gardener's questions.`;
      }
      systemInstruction +=
        "\n\nFormat responses cleanly with Markdown headings, concise bullet points, and bolded key terms where helpful. Never invent fake measurements.";

      const history: Content[] = (messages ?? [])
        .filter((m) => m.text && m.text.trim().length > 0)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        }));

      const chat = ai.chats.create({
        model: effectiveModel,
        history,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: effectiveThinkingLevel,
          },
        },
      });

      let messagePayload: string | Part[];
      if (imageBase64 && imageMimeType) {
        const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
        messagePayload = [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: cleanBase64,
            },
          },
          {
            text:
              userMessage?.trim() ||
              "Please inspect this follow-up plant photo and tell me what you notice.",
          },
        ];
      } else {
        messagePayload = userMessage?.trim() || "";
      }

      const stream = await withRetry(() =>
        chat.sendMessageStream({
          message: messagePayload,
        })
      );

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          sendEvent({ chunk: text });
        }
      }

      sendEvent({ done: true, modelUsed: effectiveModel });
      res.end();
    } catch (err: unknown) {
      const { message } = formatGeminiError(err);
      sendEvent({ error: message });
      res.end();
    }
  });

  // Fast seasonal / zone care lookup (uses gemini-3.1-flash-lite)
  app.post("/api/quick-tip", async (req: Request, res: Response) => {
    try {
      const { query, season } = req.body as { query?: string; season?: string };
      if (!query || !query.trim()) {
        res.status(400).json({ error: "Please enter a plant name, climate zone, or symptom." });
        return;
      }

      const ai = createAiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Season: ${season || "Current season"}. Gardener query: "${query.trim()}". Provide 3 crisp, actionable seasonal care tasks or adjustments in plain Markdown bullet points.`,
          config: {
            systemInstruction:
              "You are a fast botanical field reference. Give concise, accurate, seasonal gardening advice in 3 short bullet points with specific cues (light, water, pruning, or temperature).",
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MINIMAL,
            },
          },
        })
      );

      res.json({
        tip: response.text?.trim() || "No guidance returned.",
        modelUsed: "gemini-3.1-flash-lite",
      });
    } catch (err: unknown) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*path}", (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Application build not found. Run npm run build first.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Herbarium server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

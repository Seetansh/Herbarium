export type HealthStatus = "Healthy" | "Mild Stress" | "Needs Attention" | "Critical";

export interface PlantIdentification {
  isPlant: boolean;
  nonPlantMessage?: string;
  commonName: string;
  scientificName: string;
  family: string;
  originRegion: string;
  specimenType: string;
  confidenceNote: string;
  botanicalSummary: string;
  healthAssessment: {
    status: HealthStatus;
    headline: string;
    observations: string[];
    immediateActions: string[];
  };
  careProfile: {
    light: {
      level: string;
      hoursPerDay: string;
      placement: string;
    };
    water: {
      frequency: string;
      intervalDays: number;
      method: string;
      moistureCue: string;
    };
    soil: {
      mix: string;
      phRange: string;
      drainageNote: string;
    };
    climate: {
      tempRange: string;
      humidityRange: string;
      hardinessZones: string;
    };
    fertilizer: {
      schedule: string;
      npkRatio: string;
      dormancyNote: string;
    };
    pruningAndPropagation: {
      pruning: string;
      propagationMethod: string;
      repottingCadence: string;
    };
  };
  toxicity: {
    pets: string;
    humans: string;
    safetyNote: string;
  };
  seasonalChecklist: Array<{
    season: string;
    focus: string;
    action: string;
  }>;
  suggestedFollowUpQuestions: string[];
}

export interface SavedSpecimen {
  id: string;
  savedAt: string;
  lastWateredAt: string;
  photoDataUrl: string;
  userNotes?: string;
  modelUsed: string;
  data: PlantIdentification;
}

export type SpecialistMode = "general" | "pathology" | "architect" | "quick";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  modelUsed?: string;
  attachmentDataUrl?: string;
}

export type AppTab = "identify" | "chat" | "garden" | "seasonal";

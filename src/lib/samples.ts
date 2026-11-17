export interface SampleSpecimenOption {
  id: string;
  label: string;
  subtitle: string;
  imageUrl: string;
  defaultNotes: string;
}

export const HERO_CONSERVATORY_URL = "/src/assets/images/hero_botanical_conservatory_1794892423776.jpg";

export const SAMPLE_SPECIMENS: SampleSpecimenOption[] = [
  {
    id: "sample-monstera",
    label: "Monstera Leaf",
    subtitle: "Healthy indoor specimen",
    imageUrl: "/src/assets/images/sample_monstera_1794892423802.jpg",
    defaultNotes: "Bright east-facing room, watered weekly.",
  },
  {
    id: "sample-ficus",
    label: "Fiddle Leaf Fig",
    subtitle: "Crisp margins diagnosis",
    imageUrl: "/src/assets/images/sample_ficus_stress_1794892423782.jpg",
    defaultNotes: "Lower leaves turning brown and crisp along the edges.",
  },
  {
    id: "sample-rosemary",
    label: "Potted Rosemary",
    subtitle: "Sunlit herb care sheet",
    imageUrl: "/src/assets/images/sample_herb_rosemary_1794892423857.jpg",
    defaultNotes: "Clay pot on south kitchen windowsill.",
  },
];

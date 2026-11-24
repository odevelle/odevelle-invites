export type DesignId = "royal" | "azulejo" | "garden" | "shore";

export type Design = {
  id: DesignId;
  title: string;
  /** Short theme label shown on the card badge. */
  theme: string;
  /** Card copy in the collection gallery. */
  mood: string;
  /** Longer copy in the preview sheet. */
  story: string;
  /** Colour story swatches in the preview sheet. */
  palette: string[];
  /** Soft colour wash behind the paper card in the gallery. */
  wash: string;
  /** Accessible description of the invitation mockup. */
  label: string;
};

export const designs: Design[] = [
  {
    id: "royal",
    title: "Royal Lace",
    theme: "Royal",
    mood: "Cherry red on soft beige, edged in lace and strung with pearls. For grand celebrations steeped in tradition.",
    story:
      "A lace edged card in cherry red and soft beige, finished with strings of pearls and a small crest. Made for formal church weddings and grand receptions.",
    palette: ["#9B1B30", "#F1E3D0", "#FFFDF8", "#CDBB9F"],
    wash: "radial-gradient(60% 50% at 18% 15%, #B3283F 0%, transparent 70%), radial-gradient(55% 45% at 85% 28%, #EAD5BF 0%, transparent 70%), radial-gradient(70% 60% at 25% 90%, #7E1426 0%, transparent 70%), radial-gradient(60% 50% at 90% 85%, #C2566A 0%, transparent 70%), #D9B8A4",
    label:
      "Royal Lace digital wedding invitation, cherry red on beige with lace edging and pearls, for Charlotte and Henry.",
  },
  {
    id: "azulejo",
    title: "Azulejo",
    theme: "Portuguese Goan",
    mood: "Blue and white Portuguese tiles warmed with yellow and beadwork, with a verse of scripture at its heart.",
    story:
      "Hand painted Portuguese tiles in blue, white and yellow frame your names, with a string of beads and a verse of scripture. Inspired by the old Portuguese houses of Goa.",
    palette: ["#2F5DA8", "#FFFFFF", "#E8B83A", "#1F3F7A"],
    wash: "radial-gradient(60% 50% at 15% 18%, #2F5DA8 0%, transparent 70%), radial-gradient(55% 45% at 86% 24%, #F2D27A 0%, transparent 70%), radial-gradient(70% 60% at 22% 88%, #9DB8E0 0%, transparent 70%), radial-gradient(60% 50% at 90% 88%, #1F3F7A 0%, transparent 70%), #C9D8EE",
    label:
      "Azulejo digital wedding invitation, blue and white Portuguese tiles with yellow and beads, for Inês and Tomás.",
  },
  {
    id: "garden",
    title: "Embroidered Garden",
    theme: "Floral",
    mood: "Sage green florals stitched on off white linen, scattered with tiny beads. For garden vows and soft daylight.",
    story:
      "Florals stitched in sage thread on off white linen, with tiny beads catching the light. Made for garden ceremonies and daytime vows.",
    palette: ["#6F8460", "#F8F6EE", "#E3C77A", "#3F5236"],
    wash: "radial-gradient(60% 50% at 18% 18%, #6F8460 0%, transparent 70%), radial-gradient(55% 45% at 86% 28%, #DCE4CF 0%, transparent 70%), radial-gradient(70% 60% at 24% 88%, #4A5E3F 0%, transparent 70%), radial-gradient(60% 50% at 90% 85%, #A9B99A 0%, transparent 70%), #B9C6A8",
    label:
      "Embroidered Garden digital wedding invitation, sage green florals stitched on off white linen, for Élise and Julien.",
  },
  {
    id: "shore",
    title: "Pearl Shore",
    theme: "Beach",
    mood: "Warm sand, layered waves, seashells and pearls. For coastal and tropical weddings by the water.",
    story:
      "Warm sand, layered waves, a scallop shell and a string of pearls. Made for barefoot ceremonies, coastal venues and tropical celebrations.",
    palette: ["#5E9E9E", "#F3E6CF", "#F7E7DA", "#1F4E52"],
    wash: "radial-gradient(60% 50% at 18% 18%, #EADBBE 0%, transparent 70%), radial-gradient(55% 45% at 86% 24%, #8CC1BE 0%, transparent 70%), radial-gradient(70% 60% at 22% 88%, #5E9E9E 0%, transparent 70%), radial-gradient(60% 50% at 90% 85%, #F3E6CF 0%, transparent 70%), #BFDCD8",
    label: "Pearl Shore digital wedding invitation, sand, waves, a seashell and pearls, for Chiara and Lorenzo.",
  },
];

export const designById = Object.fromEntries(designs.map((d) => [d.id, d])) as Record<DesignId, Design>;

export function isDesignId(value: string): value is DesignId {
  return value in designById;
}

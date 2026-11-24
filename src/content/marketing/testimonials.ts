export type Testimonial = {
  /** Couple or individual name, shown under the quote. */
  name: string;
  /** Initials for the avatar: one letter per person. */
  initials: string;
  /** Where they are from. Country only — no city — except Goa, as asked. */
  place: string;
  quote: string;
};

/** Client words for the "Kind Words" section. All six are rated five stars. */
export const testimonials: Testimonial[] = [
  {
    name: "Lucía Fernández & Alejandro Martín",
    initials: "LA",
    place: "Spain",
    quote:
      "We had quite a clear idea of what we wanted, but finding someone who could understand the feeling behind it was important to us. Melina understood our vision from the beginning and brought together all the little details beautifully. Our guests loved having everything in one place, especially the RSVP page!",
  },
  
   {
  name: "Amelia Clarke & Henry Mitchell",
  initials: "AH",
  place: "United Kingdom",
  quote:
      "Honestly, we didn’t expect a digital invitation to feel this personal. We shared a few inspiration photos and ideas about our wedding, and ODEVELLE brought everything together perfectly. The illustrations, fonts and little details felt so thoughtfully chosen. The whole process was easy, and our guests loved how simple it was to RSVP!",
  },
  {
    name: "Élodie Moreau & Antoine Laurent",
    initials: "ÉA",
    place: "France",
    quote:
      "We wanted our wedding invitation to feel timeless, romantic and a little different from the usual designs. ODEVELLE understood the atmosphere we wanted to create and translated it into something truly beautiful. Every detail, from the delicate illustrations to the typography, felt thoughtfully considered. It was such a lovely way to introduce our wedding to family and friends.",
  },
  {
    name: "Kate Parker",
    initials: "KP",
    place: "USA",
    quote:
      "I was looking for something a little more special than a standard online invitation for my daughter’s celebration. From the first conversation to the final version, everything was handled with so much care. I especially appreciated how the smallest details were considered. The finished invitation was beautiful, easy to share and exactly what I had pictured.",
  },
 {
  name: "Sofía Rodríguez & Daniel Castillo",
  initials: "SD",
  place: "Spain",
  quote:
    "Queríamos algo elegante, pero no demasiado tradicional, con pequeños detalles que realmente nos representaran. El equipo de ODEVELLE hizo que todo el proceso fuera muy sencillo. Las animaciones y transiciones eran especialmente bonitas, y la invitación se sentía más como una pequeña experiencia que como una simple invitación. ¡No podíamos dejar de compartirla con nuestra familia!",
},
  {
    name: "Natasha D’Souza & Ryan Fernandes",
    initials: "NR",
    place: "Goa",
    quote:
      "We wanted our invitation to reflect our Goan Catholic wedding, including the church ceremony, reception details and all the little things that make our celebrations special. Melina understood exactly what we had in mind, and Keegan brought it all to life beautifully. Our family, especially those living abroad, absolutely loved having all the wedding details just a link away!",
  },
];

export const additionaltemplates = [
  {
    name: "Photo Collage",
    description: "Display images in a Collage type animation",
    propsSchema: {
      id: "string",
      words: "string[]",
      colors: {
        primary: "string",
        secondary: "string",
        accent: "string",
      },
      timing: {
        staggerDelay: "'number'",
        collisionFrame: "'number'",
        explosionDelay: "'number'",
      },
      effects: {
        shakeIntensity: "'number'",
        particleCount: "'number'",
        ballSize: "'number'",
      },
    },
  },
  {
    name: "Dancing People",
    description:
      "Display dancing renolds.",
    propsSchema: {
      text: "string",
      colors: "string[]",
      timing: {
        flickerDurationInSeconds: "number",
      },
      effects: {
        fontSize: "number",
        glowPulseMin: "number",
        glowPulseMax: "number",
        showGrain: "boolean",
      },
    },
  },
  
];

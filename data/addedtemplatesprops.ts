export const additionaltemplates = [
  {
    name: "Kinetic Typography",
    description: "Create a dynamic, high-energy text explosion intro.",
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
    name: "Neon Flicker",
    description:
      "A dynamic 'Neon Flicker' template for a fast-paced text intro.",
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
  {
    name: "Logo Animation",
    description:
      "Reveal your brand with a dynamic logo animation featuring a self-drawing outline and a glowing, liquid-fill effect.",
    propsSchema: {
      text: "string",
      durationOutline: "number",
      durationFill: "number",
      durationEndPause: "number",
      baseColor: "string",
    },
  },
  {
    name: "Heat Map",
    description: "Animate your data into a sleek, colorful heatmap.",
    propsSchema: {
      id: "string",
      title: "string",
      subtitle: "string",
      textColor: "string",
      languages: [
        {
          name: "string",
          usage: "number",
          squares: "number",
          logo: "string",
        },
      ],
      primaryColor: "string",
      secondaryColor: "string",
      accentColor: "string",
      maxValue: "number",
      backgroundStyle: "string",
    },
  },
  {
    name: "Flip Cards",
    description: "Flipping card animations.",
    propsSchema: {
      title: "string",
      subtitle: "string",
      metrics: [
        {
          front: "string",
          back: "string",
          color: "string",
        },
      ],
      flipDuration: "number",
      spacing: "number",
      cardWidth: "number",
      backgroundGradient: "string[]",
    },
  },
];

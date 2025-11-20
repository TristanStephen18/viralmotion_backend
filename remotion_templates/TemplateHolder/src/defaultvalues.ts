import { LogoLiquidOverlayProps } from "./components/LogoAnimation";

export const flipcardsdefaulvalues = {
  title: "Project Key Metrics",
  subtitle: "This Quarter vs. Last Quarter",
  metrics: [
    { front: "1,204\nNew Users", back: "+15.2%\nvs. Q2", color: "#3b82f6" },
    { front: "72.5%\nConversion", back: "-0.8%\nvs. Q2", color: "#10b981" },
    { front: "$42,800\nRevenue", back: "+22.0%\nvs. Q2", color: "#f59e0b" },
  ],
  flipDuration: 0.8,
  spacing: 20,
  cardWidth: 0,
  backgroundGradient: ["#0f0f23", "#1a1a2e", "#16213e"],
};

export const logoanimationdefaultvalues: LogoLiquidOverlayProps = {
  text: "SHAKER",
  durationOutline: 2,
  durationFill: 2.5,
  baseColor: "#FFD700",
  durationEndPause: 2,
};



import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import { loadAllFonts } from "./fonts";

loadAllFonts();
registerRoot(RemotionRoot);

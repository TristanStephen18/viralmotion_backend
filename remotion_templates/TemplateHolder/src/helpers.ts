import { DEFAULT_SETTINGS } from '../../../../frontend/src/components/editors/NewTextTypingEditor/assets/configs';
export const calculateDuration = (
  phrase: {
          lines: string[],
          category: string,
          mood: string,
        },
) => {
  const fps = 60;
  const typingSpeed = 15;
  const totalChars = phrase.lines.reduce((sum, line) => sum + line.length, 0);
  const typingFrames = Math.ceil((totalChars / typingSpeed) * fps);
  return typingFrames + DEFAULT_SETTINGS.holdDuration * fps;
};

export const durationIndicatorQuote = (size: number) => {
    if(size <= 60){
        return 7;
    }else if(size > 60 && size < 80){
        return 10;
    }else{
        return 14;
    }
}
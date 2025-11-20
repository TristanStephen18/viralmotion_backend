import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const FlipCardsCompositionComponent: React.FC<{
  config: MetricCardsProps;
}> = ({ config }) => {
  return <DynamicMetricCards {...config} />;
};

export interface MetricData {
  front: string;
  back: string;
  color: string;
}

export interface MetricCardsProps {
  title: string;
  subtitle?: string;
  metrics: MetricData[];
  flipDuration?: number;
  spacing?: number;
  cardWidth?: number;
  backgroundGradient?: string[];
}

export const DynamicMetricCards: React.FC<MetricCardsProps> = ({
  title,
  subtitle,
  metrics,
  flipDuration = 0.8,
  spacing = 20,
  cardWidth: customCardWidth,
  backgroundGradient = ["#0f0f23", "#1a1a2e", "#16213e"]
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  const totalSpacing = spacing * (metrics.length - 1);
  const availableWidth = width * 0.85;
  const cardWidth = customCardWidth || (availableWidth - totalSpacing) / metrics.length;
  const cardHeight = cardWidth * 1.2;
  
  const flipDurationFrames = flipDuration * fps;
  const intervalFrames = 2 * fps;
  const totalCycleFrames = intervalFrames * metrics.length;
  
  const cycleProgress = frame % totalCycleFrames;
  
  const renderCard = (metric: MetricData, index: number) => {
    const flipStartFrame = index * intervalFrames;
    const flipEndFrame = flipStartFrame + flipDurationFrames;
    
    const isFlipping = cycleProgress >= flipStartFrame && cycleProgress <= flipEndFrame;
    const flipProgress = isFlipping 
      ? (cycleProgress - flipStartFrame) / flipDurationFrames 
      : (cycleProgress > flipStartFrame ? 1 : 0);
    
    const springProgress = spring({
      frame: isFlipping ? cycleProgress - flipStartFrame : (flipProgress > 0 ? flipDurationFrames : 0),
      fps,
      config: {
        damping: 12,
        stiffness: 100,
        mass: 1,
      },
    });
    
    const rotation = interpolate(
      springProgress,
      [0, 1],
      [0, 180],
      { extrapolateRight: 'clamp' }
    );
    
    const scale = interpolate(
      Math.abs(rotation - 90),
      [0, 90],
      [0.95, 1],
      { extrapolateRight: 'clamp' }
    );
    
    const showBack = rotation > 90;
    const currentMetric = showBack ? metric.back : metric.front;

    const [number, label] = currentMetric.split('\n');

    const baseNumberSize = cardWidth * 0.22;
    const baseNumberLength = 5;
    const numberLength = number?.length || 1;
    
    const numberLengthFactor = numberLength > baseNumberLength 
      ? baseNumberLength / numberLength 
      : 1;
    const numberScale = Math.pow(numberLengthFactor, 0.7);
    const dynamicNumberFontSize = baseNumberSize * numberScale;

    const baseLabelSize = cardWidth * 0.10;
    const baseLabelLength = 10;
    const labelLength = label?.length || 1;
    
    const labelLengthFactor = labelLength > baseLabelLength 
      ? baseLabelLength / labelLength 
      : 1;
    const labelScale = Math.pow(labelLengthFactor, 0.7);
    const dynamicLabelFontSize = baseLabelSize * labelScale;
    
    return (
      <div
        key={index}
        style={{
          width: cardWidth,
          height: cardHeight,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotation}deg) scale(${scale})`,
          transition: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 12,
            background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}25 100%)`,
            border: `2px solid ${metric.color}40`,
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.1),
              0 4px 16px ${metric.color}20,
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px 16px',
            position: 'relative',
            backfaceVisibility: 'hidden',
            transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 12,
              background: `
                radial-gradient(circle at 20% 20%, ${metric.color}10 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, ${metric.color}08 0%, transparent 50%)
              `,
              pointerEvents: 'none',
            }}
          />
          
          <div
            style={{
              fontSize: dynamicNumberFontSize,
              fontWeight: 800,
              color: metric.color,
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              lineHeight: 0.9,
              textAlign: 'center',
              marginBottom: 8,
              textShadow: `0 2px 8px ${metric.color}30`,
              letterSpacing: '-0.02em',
              padding: '0 8px',
            }}
          >
            {number}
          </div>
          
          <div
            style={{
              fontSize: dynamicLabelFontSize,
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.9,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              padding: '0 8px',
            }}
          >
            {label}
          </div>
          
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: metric.color,
              marginTop: 12,
              boxShadow: `0 0 12px ${metric.color}60`,
            }}
          />
        </div>
      </div>
    );
  };
  
  const backgroundStyle = backgroundGradient.length >= 3
    ? `linear-gradient(135deg, ${backgroundGradient[0]} 0%, ${backgroundGradient[1]} 50%, ${backgroundGradient[2]} 100%)`
    : `linear-gradient(135deg, ${backgroundGradient[0] || '#0f0f23'} 0%, ${backgroundGradient[1] || '#1a1a2e'} 100%)`;
  
  return (
    <div
      style={{
        width,
        height,
        background: backgroundStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 100,
        }}
      >
        <div
          style={{
            fontSize: width * 0.08,
            fontWeight: 800,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(135deg, #ffffff 0%, #4facfe 50%, #43e97b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 20px rgba(79, 172, 254, 0.3)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        
        {subtitle && (
          <div
            style={{
              fontSize: width * 0.04,
              fontWeight: 500,
              color: '#ffffff',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              opacity: 0.8,
              marginBottom: 12,
            }}
          >
            {subtitle}
          </div>
        )}
        
        <div
          style={{
            width: 60,
            height: 4,
            background: 'linear-gradient(90deg, #4facfe 0%, #43e97b 100%)',
            borderRadius: 2,
            margin: '0 auto',
            boxShadow: '0 0 12px rgba(79, 172, 254, 0.4)',
          }}
        />
      </div>
      
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 25% 25%, rgba(79, 172, 254, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(250, 112, 154, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing,
          width: '100%',
          maxWidth: availableWidth,
          marginTop: '8%',
        }}
      >
        {metrics.map((metric, index) => renderCard(metric, index))}
      </div>
      
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(15, 15, 35, 0.3), transparent)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

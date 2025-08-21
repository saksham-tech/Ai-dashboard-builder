import { Button } from "@/components/ui/button";
import { type Visualization } from "@/types/visualizations";
import { toast } from "sonner";

interface ActionButtonVisualProps {
  visualization: Visualization;
  onToggleVisibility: (vizId: string) => void;
}

const applyOpacityToColor = (color: string, opacity: number): string => {
  if (!color) return 'transparent';
  if (opacity === 1 && !color.startsWith('rgba') && !color.startsWith('hsla')) return color;

  if (color.startsWith('rgba') || color.startsWith('hsla')) {
    return color.replace(/,([\d.]+)\)$/, `, ${opacity})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) {
    let c: any = color.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('hsl')) {
    return color.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
  }
  if (color === 'transparent') {
    return `rgba(0, 0, 0, 0)`;
  }
  return color;
};

export function ActionButtonVisual({ visualization, onToggleVisibility }: ActionButtonVisualProps) {
  const { options } = visualization;
  const { actionButton } = options;

  if (!actionButton) return null;

  const handleClick = () => {
    if (actionButton.targetVizIds && actionButton.targetVizIds.length > 0) {
      actionButton.targetVizIds.forEach(vizId => {
        onToggleVisibility(vizId);
      });
    } else {
      toast.warning("No target visuals selected for this button.");
    }
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: applyOpacityToColor(actionButton.backgroundColor, actionButton.backgroundOpacity),
    color: actionButton.textColor,
    borderColor: actionButton.borderColor,
    borderWidth: `${actionButton.borderWidth}px`,
    borderRadius: `${actionButton.borderRadius}px`,
    borderStyle: 'solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      <Button
        className="w-full h-full"
        onClick={handleClick}
        disabled={!actionButton.targetVizIds || actionButton.targetVizIds.length === 0}
        style={buttonStyle}
      >
        {actionButton.iconSrc && (
          <img
            src={actionButton.iconSrc}
            alt="icon"
            style={{
              width: `${actionButton.iconWidth || 16}px`,
              height: `${actionButton.iconHeight || 16}px`,
            }}
          />
        )}
        {actionButton.text}
      </Button>
    </div>
  );
}
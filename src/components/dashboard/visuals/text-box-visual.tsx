import { useState } from 'react';
import { type Visualization } from "@/types/visualizations";
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface TextBoxVisualProps {
  visualization: Visualization;
  onUpdate: (props: Partial<Visualization>) => void;
}

export function TextBoxVisual({ visualization, onUpdate }: TextBoxVisualProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { options } = visualization;
  const { textBox } = options;

  if (!textBox) return null;

  const handleTextChange = (newText: string) => {
    const newOptions = { ...options, textBox: { ...textBox, text: newText } };
    onUpdate({ options: newOptions });
  };

  const verticalAlignClasses = {
    top: 'items-start',
    middle: 'items-center',
    bottom: 'items-end',
  };

  const horizontalAlignClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
  };

  const dynamicFontSize = textBox.fontSize;

  if (isEditing) {
    return (
      <Textarea
        value={textBox.text}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        autoFocus
        className="w-full h-full resize-none border-0 focus:ring-0 bg-transparent p-2"
        style={{
          fontSize: `${dynamicFontSize}px`,
          color: textBox.color,
          fontWeight: textBox.fontWeight || 'normal',
        }}
      />
    );
  }

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        "w-full h-full flex p-2 overflow-y-auto prose prose-invert prose-sm max-w-none",
        verticalAlignClasses[textBox.verticalAlign],
        horizontalAlignClasses[textBox.horizontalAlign]
      )}
      style={{
        color: textBox.color,
      }}
    >
      <div style={{ 
          fontSize: `${dynamicFontSize}px`,
          fontWeight: textBox.fontWeight || 'normal'
      }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{textBox.text}</ReactMarkdown>
      </div>
    </div>
  );
}
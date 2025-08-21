import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Square, Circle, Minus, Triangle, SlidersHorizontal } from "lucide-react"

interface CanvasToolbarProps {
  onAddShape: (shapeType: 'rectangle' | 'circle' | 'line' | 'triangle') => void;
  onAddParameter: () => void;
}

export function CanvasToolbar({ onAddShape, onAddParameter }: CanvasToolbarProps) {
  return (
    <div className="h-20 mb-[-86px] border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex-shrink-0 relative z-30">
      <div className="h-full px-4 flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Square className="w-4 h-4 mr-2" />
              Add Shape
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAddShape('rectangle')}>
              <Square className="w-4 h-4 mr-2" />
              Rectangle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddShape('circle')}>
              <Circle className="w-4 h-4 mr-2" />
              Circle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddShape('line')}>
              <Minus className="w-4 h-4 mr-2" />
              Line
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddShape('triangle')}>
              <Triangle className="w-4 h-4 mr-2" />
              Triangle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={onAddParameter}>
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          New Parameter
        </Button>
      </div>
    </div>
  )
}
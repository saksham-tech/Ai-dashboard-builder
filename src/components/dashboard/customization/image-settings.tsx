import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type VisualizationOptions, type Dataset } from "@/types/visualizations";
import { toast } from "sonner";
import { useMemo } from "react";

interface ImageSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
  allDatasets: Dataset[];
}

const isImageUrl = (value: any): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmedValue = value.trim().toLowerCase();
  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://') || trimmedValue.startsWith('data:image')) {
    return true;
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'];
  return imageExtensions.some(ext => trimmedValue.endsWith(ext));
};

export function ImageSettings({ options, onOptionChange, allDatasets }: ImageSettingsProps) {
  if (!options.image) return null;

  const imageFields = useMemo(() => {
    if (!allDatasets || allDatasets.length === 0) return [];
    
    const allImageFields = new Set<string>();

    allDatasets.forEach(ds => {
      const sample = ds.data.slice(0, 100);
      ds.fields.forEach(field => {
        if (sample.some(row => isImageUrl(row[field]))) {
          allImageFields.add(field);
        }
      });
    });

    return Array.from(allImageFields);
  }, [allDatasets]);

  const hasAnyFields = useMemo(() => allDatasets.some(ds => ds.fields.length > 0), [allDatasets]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("File is too large. Please upload an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onOptionChange('image.src', reader.result as string);
      };
      reader.onerror = () => {
        toast.error("Could not read the file. Please try again.");
      }
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Image Source (from Data)</Label>
        <Select
          value={options.image.dataField || 'none'}
          onValueChange={(value) => onOptionChange('image.dataField', value === 'none' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (use uploaded image)</SelectItem>
            {imageFields.map(field => <SelectItem key={field} value={field}>{field}</SelectItem>)}
          </SelectContent>
        </Select>
        {imageFields.length === 0 && hasAnyFields && <p className="text-xs text-muted-foreground">No fields with image URLs detected in your data.</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="image-upload">Upload Image (Fallback)</Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="cursor-pointer"
          disabled={!!options.image.dataField}
        />
        {options.image.dataField && <p className="text-xs text-muted-foreground">Upload is disabled when a data field is selected.</p>}
      </div>
      <div className="space-y-2">
        <Label>Image Fit</Label>
        <Select
          value={options.image.objectFit}
          onValueChange={(value) => onOptionChange('image.objectFit', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Image Fit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Width</Label>
          <Input
            placeholder="e.g., 100% or 200px"
            value={options.image.width || ''}
            onChange={(e) => onOptionChange('image.width', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Height</Label>
          <Input
            placeholder="e.g., 100% or auto"
            value={options.image.height || ''}
            onChange={(e) => onOptionChange('image.height', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Vertical Alignment</Label>
        <Select
          value={options.image.verticalAlign}
          onValueChange={(value) => onOptionChange('image.verticalAlign', value)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="middle">Middle</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Horizontal Alignment</Label>
        <Select
          value={options.image.horizontalAlign}
          onValueChange={(value) => onOptionChange('image.horizontalAlign', value)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Papa from "papaparse";
import * as XLSX from 'xlsx';

interface DataUploadProps {
  onDataParsed: (data: Record<string, any>[], fields: string[], fileName: string) => void;
}

export function DataUpload({ onDataParsed }: DataUploadProps) {
  const processFile = (file: File) => {
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          onDataParsed(results.data as Record<string, any>[], results.meta.fields || [], file.name);
        },
      });
    } else if (file.name.endsWith('.xlsx')) {
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        
        let fields: string[] = [];
        if (json.length > 0) {
          fields = Object.keys(json[0]);
        }
        
        onDataParsed(json, fields, file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (const file of Array.from(e.target.files)) {
        processFile(file);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="data-upload">Upload CSV or XLSX Files</Label>
      <Input
        id="data-upload"
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileChange}
        className="cursor-pointer"
        multiple
      />
    </div>
  );
}
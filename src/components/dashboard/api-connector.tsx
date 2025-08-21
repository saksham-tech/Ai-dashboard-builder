// ApiConnector.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "lucide-react";

interface ApiConnectorProps {
  onDataParsed: (data: Record<string, any>[], fields: string[], sourceName: string) => void;
  children: React.ReactNode;
}

// Recursive, standard flatten function for nested objects.
// Flattens { a: { b: 1 } } into { "a.b": 1 }
// Handles arrays by leaving them as is (not flattened into string).
const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
  const result: Record<string, any> = {};
  if (typeof obj !== 'object' || obj === null) {
    if (prefix) result[prefix] = obj;
    return result;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, newKey));
      } else {
        // Store primitives and arrays directly
        result[newKey] = value;
      }
    }
  }
  return result;
};

// Finds the best candidate for the primary data array:
// Prefer higher-level arrays (small depth) and longer length
const findPrimaryDataArray = (data: any): { array: Record<string, any>[], path: string[] } | null => {
  const allArrays: { array: Record<string, any>[], path: string[], depth: number }[] = [];

  function search(currentData: any, currentPath: string[], depth: number) {
    if (Array.isArray(currentData) && currentData.length > 0 && typeof currentData[0] === 'object' && currentData[0] !== null) {
      allArrays.push({ array: currentData, path: currentPath, depth });
    }
    if (typeof currentData === 'object' && currentData !== null && !Array.isArray(currentData)) {
      for (const key in currentData) {
        if (Object.prototype.hasOwnProperty.call(currentData, key)) {
          search(currentData[key], [...currentPath, key], depth + 1);
        }
      }
    }
  }

  search(data, [], 0);

  if (allArrays.length === 0) return null;

  allArrays.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return b.array.length - a.array.length;
  });

  const { array, path } = allArrays[0];
  return { array, path };
};

// Helper to get nested data by dot path string
const getNestedData = (obj: any, path: string): any => {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function ApiConnector({ onDataParsed, children }: ApiConnectorProps) {
  const [apiUrl, setApiUrl] = useState("");
  const [dataPath, setDataPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFetchData = async () => {
    if (!apiUrl.trim()) {
      toast.error("Please enter a valid API URL.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();

      // Find or override primary data array
      const primaryArrayInfo = dataPath
        ? { array: getNestedData(data, dataPath), path: dataPath.split('.') }
        : findPrimaryDataArray(data);

      if (!primaryArrayInfo || !Array.isArray(primaryArrayInfo.array)) {
        throw new Error("Could not find a valid data array. Please check the Data Path.");
      }

      const primaryArray = primaryArrayInfo.array;
      const primaryArrayPath = primaryArrayInfo.path;

      // Create base context by removing primary array at its path from original data
      const contextObject = JSON.parse(JSON.stringify(data));
      let parent = contextObject;
      if (primaryArrayPath.length > 0) {
        for (let i = 0; i < primaryArrayPath.length - 1; i++) {
          if (parent[primaryArrayPath[i]] === undefined) {
            throw new Error(`Invalid data path, could not find '${primaryArrayPath[i]}'`);
          }
          parent = parent[primaryArrayPath[i]];
        }
        // Remove primary array so it doesn’t duplicate
        delete parent[primaryArrayPath[primaryArrayPath.length - 1]];
      }
      const flatBaseContext = flattenObject(contextObject);

      // Flatten each item in the primary array and prefix keys with full data path for clarity
      const prefix = dataPath || primaryArrayPath.join('.');
      const finalData = primaryArray.map((item: any) => {
        // Wrap item in object keyed by prefix to preserve full path in keys
        const wrapped = prefix ? { [prefix]: item } : item;
        return { ...flatBaseContext, ...flattenObject(wrapped) };
      });

      if (finalData.length === 0) {
        toast.warning("Data array is empty.");
        onDataParsed([], [], new URL(apiUrl).hostname);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      // Collect all unique keys from flattened data
      const allKeys = new Set<string>();
      finalData.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
      });
      const fields = Array.from(allKeys).sort();

      // Ensure every row has all keys (fill null if missing)
      finalData.forEach(row => {
        fields.forEach(key => {
          if (!(key in row)) row[key] = null;
        });
      });

      onDataParsed(finalData, fields, new URL(apiUrl).hostname);
      toast.success("Data fetched and loaded successfully!");
      setIsOpen(false);
      setApiUrl("");
      setDataPath("");
    } catch (error) {
      console.error("Failed to fetch API data:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Connect to API
          </DialogTitle>
          <DialogDescription>
            Enter the URL of a JSON API. The connector will automatically find and process the data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              placeholder="https://api.example.com/data"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data-path">Data Path (optional override)</Label>
            <Input
              id="data-path"
              placeholder="e.g., forecast.forecastday"
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Only needed if auto-detection fails to find the correct data array.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleFetchData} disabled={isLoading}>
            {isLoading ? "Fetching..." : "Fetch Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
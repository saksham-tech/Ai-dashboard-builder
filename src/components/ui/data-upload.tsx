import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  File, 
  Database, 
  Link, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Server
} from "lucide-react"

const supportedFormats = [
  { name: "Excel", extensions: [".xlsx", ".xls"], icon: FileSpreadsheet, color: "text-green-500" },
  { name: "CSV", extensions: [".csv"], icon: FileText, color: "text-blue-500" },
  { name: "JSON", extensions: [".json"], icon: FileText, color: "text-yellow-500" },
  { name: "Database", extensions: ["SQL"], icon: Database, color: "text-purple-500" },
  { name: "API", extensions: ["REST", "GraphQL"], icon: Link, color: "text-orange-500" },
]

const recentUploads = [
  { name: "sales_data_2024.xlsx", size: "2.4 MB", status: "completed", timestamp: "2 min ago" },
  { name: "customer_feedback.csv", size: "856 KB", status: "processing", timestamp: "5 min ago" },
  { name: "inventory_report.json", size: "1.2 MB", status: "completed", timestamp: "1 hour ago" },
]

export function DataUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setUploading(true)
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setUploading(false)
            return 0
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      // Handle dropped files
      console.log("Files dropped:", files)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Data
          </CardTitle>
          <CardDescription>
            Support for Excel, CSV, JSON, SQL databases, and API connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-smooth cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Drop files here or click to upload</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports Excel, CSV, JSON files up to 50MB
            </p>
            <Button variant="gradient">
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <Card className="bg-gradient-secondary border-border/50">
        <CardHeader>
          <CardTitle>Supported Data Sources</CardTitle>
          <CardDescription>
            Connect to various data sources and formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {supportedFormats.map((format, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                <format.icon className={`w-8 h-8 ${format.color}`} />
                <div>
                  <h4 className="font-medium">{format.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format.extensions.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card className="bg-gradient-secondary border-border/50">
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>
            Your recently uploaded datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUploads.map((upload, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                <div className="flex items-center gap-3">
                  {upload.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-warning animate-pulse" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{upload.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{upload.size}</span>
                      <span>•</span>
                      <span>{upload.timestamp}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={upload.status === "completed" ? "default" : "secondary"}>
                  {upload.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
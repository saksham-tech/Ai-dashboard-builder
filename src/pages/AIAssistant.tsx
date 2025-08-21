import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AIQueryPanel } from "@/components/ai/ai-query-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react"

const recentQueries = [
  {
    query: "Show me sales trends for Q4",
    timestamp: "2 minutes ago",
    status: "completed",
    type: "analytics"
  },
  {
    query: "Predict user growth for next month",
    timestamp: "15 minutes ago",
    status: "completed",
    type: "prediction"
  },
  {
    query: "Find anomalies in payment data",
    timestamp: "1 hour ago",
    status: "processing",
    type: "anomaly"
  },
  {
    query: "Compare revenue by product category",
    timestamp: "3 hours ago",
    status: "completed",
    type: "analytics"
  }
]

export default function AIAssistant() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-2">
            Your intelligent data analysis companion. Ask questions, get insights, and discover patterns automatically.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main AI Query Panel */}
          <div className="lg:col-span-2">
            <AIQueryPanel />
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-chart-1" />
                  Recent Queries
                </CardTitle>
                <CardDescription>
                  Your latest AI interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentQueries.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                      <div className="flex-shrink-0 mt-1">
                        {item.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-warning animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.query}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View All History
                </Button>
              </CardContent>
            </Card>

            {/* AI Capabilities */}
            <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-chart-4" />
                  AI Capabilities
                </CardTitle>
                <CardDescription>
                  What I can help you with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-chart-1" />
                    <span className="text-sm">Data Visualization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-chart-2" />
                    <span className="text-sm">Trend Analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-chart-3" />
                    <span className="text-sm">Predictive Analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-chart-4" />
                    <span className="text-sm">Natural Language Queries</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
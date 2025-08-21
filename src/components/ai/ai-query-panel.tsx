import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Send, 
  Mic, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Users,
  DollarSign,
  Calendar,
  Filter
} from "lucide-react"

const suggestedQueries = [
  "Show me sales trends for the last quarter",
  "Compare revenue by region",
  "Which products performed best this month?",
  "Predict next month's user growth",
  "Find anomalies in customer behavior",
  "Create a funnel analysis for conversions"
]

const quickInsights = [
  {
    icon: <TrendingUp className="w-5 h-5 text-chart-1" />,
    title: "Revenue Growth",
    description: "23% increase vs last month",
    action: "View Details"
  },
  {
    icon: <Users className="w-5 h-5 text-chart-2" />,
    title: "User Acquisition",
    description: "456 new users this week",
    action: "Analyze"
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-chart-3" />,
    title: "Top Performer",
    description: "Product A leads in sales",
    action: "Deep Dive"
  }
]

export function AIQueryPanel() {
  const [query, setQuery] = useState("")
  const [isListening, setIsListening] = useState(false)

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery)
  }

  const handleSendQuery = () => {
    if (query.trim()) {
      console.log("Sending query:", query)
      // Here you would integrate with your AI backend
      setQuery("")
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // Here you would integrate with speech recognition
  }

  return (
    <div className="space-y-6">
      {/* AI Query Interface */}
      <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Data Assistant
          </CardTitle>
          <CardDescription>
            Ask natural language questions about your data and get instant insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Query Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder="Ask me anything about your data... e.g., 'Show me sales trends for the last quarter'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[60px] bg-muted/50 border-0 focus:bg-background transition-smooth resize-none pr-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendQuery()
                  }
                }}
              />
              <Button
                size="sm"
                variant={isListening ? "gradient" : "ghost"}
                className="absolute bottom-2 right-2"
                onClick={toggleListening}
              >
                <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
              </Button>
            </div>
            <Button 
              onClick={handleSendQuery}
              disabled={!query.trim()}
              variant="gradient"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggested Queries */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Suggested Queries</h4>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-smooth"
                  onClick={() => handleSuggestedQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-chart-3" />
            Quick Insights
          </CardTitle>
          <CardDescription>
            AI-generated insights from your latest data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quickInsights.map((insight, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary/10 flex items-center justify-center">
                    {insight.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {insight.action}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
          <CardContent className="p-6 text-center">
            <PieChart className="w-8 h-8 text-chart-1 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Smart Visualizations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI recommends the best chart types for your data
            </p>
            <Button variant="outline" size="sm">Generate Charts</Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-chart-2 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Predictive Analytics</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Forecast trends and identify patterns automatically
            </p>
            <Button variant="outline" size="sm">Run Forecast</Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary border-border/50 hover:border-primary/50 transition-smooth">
          <CardContent className="p-6 text-center">
            <Filter className="w-8 h-8 text-chart-3 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Anomaly Detection</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Automatically detect unusual patterns in your data
            </p>
            <Button variant="outline" size="sm">Scan Data</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
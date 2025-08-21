import { useState, useEffect } from "react"
import { Search, Bell, User, Upload, Sparkles, LogOut, Save, FolderDown, Link, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataUpload } from "./data-upload"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Label } from "../ui/label"
import { ApiConnector } from "./api-connector"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "../ui/skeleton"
import { useDashboard } from "@/context/DashboardContext"
import { ThemeToggle } from "../theme-toggle"

export function DashboardHeader() {
  const { 
    visualizations, 
    canvasBackground, 
    loadDashboard, 
    dashboardInfo, 
    setDashboardInfo, 
    clearDashboard, 
    calculatedFieldDefinitions, 
    transformedFieldDefinitions, 
    datasets,
    handleDataParsed,
    relationships,
    parameters,
    parameterValues
  } = useDashboard();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    setDashboardName(dashboardInfo?.name || "");
  }, [dashboardInfo]);

  const { data: savedDashboards, isLoading: isLoadingDashboards } = useQuery({
    queryKey: ['dashboards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('dashboards').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && isLoadOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async (dashboardData: { id?: string; user_id: string; name: string; configuration: any }) => {
      const { data, error } = await supabase.from('dashboards').upsert(dashboardData).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards', user?.id] });
      if (setDashboardInfo) {
        setDashboardInfo({ id: data.id, name: data.name });
      }
      toast.success(`Dashboard "${data.name}" saved successfully!`);
      setIsSaveOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to save dashboard: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dashboards').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards', user?.id] });
      if (dashboardInfo?.id === deletedId && clearDashboard) {
        clearDashboard();
      }
      toast.success('Dashboard deleted!');
    },
    onError: (error) => {
      toast.error(`Failed to delete dashboard: ${error.message}`);
    }
  });

  const handleDataUploaded = (data: Record<string, any>[], fields: string[], sourceName: string) => {
    handleDataParsed(data, fields, sourceName);
    setIsUploadOpen(false);
  };

  const handleSaveDashboard = () => {
    if (!dashboardName.trim()) {
      toast.error("Please enter a name for the dashboard.");
      return;
    }
    if (!user || visualizations === undefined || canvasBackground === undefined) return;

    const dashboardData = {
      id: dashboardInfo?.id,
      user_id: user.id,
      name: dashboardName.trim(),
      configuration: { visualizations, canvasBackground, calculatedFieldDefinitions, transformedFieldDefinitions, datasets, relationships, parameters, parameterValues },
    };
    saveMutation.mutate(dashboardData);
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search datasets, reports, or ask AI..."
              className="pl-10 bg-muted/50 border-0 focus:bg-background transition-smooth"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Badge variant="secondary" className="text-xs">⌘K</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <>
            <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><FolderDown className="w-4 h-4 mr-2" />My Dashboards</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>My Dashboards</DialogTitle>
                  <DialogDescription>Load or delete your saved dashboards.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-96 overflow-y-auto">
                  {isLoadingDashboards ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedDashboards?.map((dash: any) => (
                        <div key={dash.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <div>
                            <p className="font-medium">{dash.name}</p>
                            <p className="text-xs text-muted-foreground">Last updated: {new Date(dash.updated_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => { loadDashboard?.(dash); setIsLoadOpen(false); }}>Load</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(dash.id)} disabled={deleteMutation.isPending}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Save className="w-4 h-4 mr-2" />Save Dashboard</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{dashboardInfo ? 'Update Dashboard' : 'Save New Dashboard'}</DialogTitle>
                  <DialogDescription>Enter a name for your dashboard. If it exists, it will be updated.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <Label htmlFor="dashboard-name">Dashboard Name</Label>
                  <Input id="dashboard-name" value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} placeholder="e.g., Monthly Sales Report" />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSaveDashboard} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <ApiConnector onDataParsed={handleDataUploaded}>
              <Button variant="outline" size="sm">
                <Link className="w-4 h-4 mr-2" />Connect to API
              </Button>
            </ApiConnector>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-gradient-primary text-white border-0 hover:shadow-glow transition-spring">
                  <Upload className="w-4 h-4 mr-2" />Upload Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Your Data</DialogTitle>
                  <DialogDescription>Select a CSV or XLSX file to upload.</DialogDescription>
                </DialogHeader>
                <DataUpload onDataParsed={handleDataUploaded} />
              </DialogContent>
            </Dialog>
          </>
          
          <Button variant="outline" size="sm" className="bg-gradient-accent text-white border-0 hover:shadow-glow transition-spring">
            <Sparkles className="w-4 h-4 mr-2" />AI Insights
          </Button>

          <ThemeToggle />

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">3</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                  <AvatarFallback className="bg-gradient-primary text-white">{user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" /><span>Profile</span></DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
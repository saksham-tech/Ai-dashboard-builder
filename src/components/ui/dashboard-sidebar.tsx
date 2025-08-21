import { BarChart3, BrainCircuit, Database, LayoutDashboard, LifeBuoy, Settings } from "lucide-react"
import { NavLink, Link } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Data Model", href: "/data", icon: Database },
  { name: "AI Assistant", href: "/ai", icon: BrainCircuit },
]

export function DashboardSidebar() {
  return (
    <div className="hidden border-r border-sidebar-border bg-sidebar md:block w-20">
      <div className="flex h-full max-h-screen flex-col items-center">
        <div className="flex h-14 items-center justify-center border-b border-sidebar-border w-full lg:h-[60px]">
          <Link to="/" className="flex items-center justify-center font-semibold text-sidebar-foreground">
            <BarChart3 className="h-6 w-6 text-sidebar-primary" />
          </Link>
        </div>
        <nav className="flex flex-col items-center gap-4 px-2 py-4 flex-1 w-full">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground w-full",
                  isActive && "bg-sidebar-accent text-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[11px] text-center">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-2 border-t border-sidebar-border w-full">
          <nav className="flex flex-col items-center gap-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground w-full",
                  isActive && "bg-sidebar-accent text-foreground"
                )
              }
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Settings</span>
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground w-full",
                  isActive && "bg-sidebar-accent text-foreground"
                )
              }
            >
              <LifeBuoy className="h-5 w-5" />
              <span className="text-xs">Help</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  )
}
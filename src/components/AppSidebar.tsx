import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderPlus,
  Sparkles,
  Store,
  DollarSign,
  Users,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  MessageCircle,
  Brain,
  GraduationCap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "./NavLink";
import measureLogo from "@/assets/measure-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const mainNavItems: Array<{
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
  beta?: boolean;
}> = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "New Project", url: "/create-project", icon: FolderPlus },
  { title: "Facilitation Coach", url: "/facilitator-coach", icon: MessageCircle },
  { title: "Training Academy", url: "/academy", icon: GraduationCap, beta: true },
  { title: "Survey Results", url: "/survey-results", icon: Brain },
  { title: "Measure Ignite", url: "https://ignite.wemeasure.org", icon: ExternalLink, external: true },
  { title: "Measure Events", url: "https://wemeasure.org/upcoming-events/", icon: ExternalLink, external: true },
];

const monitorNavItems: typeof mainNavItems = [];

const adminNavItems = [
  { title: "Monitor Dashboard", url: "/monitor", icon: Eye },
  { title: "Training Data", url: "/synthetic-data-generator", icon: Sparkles },
  { title: "Community Data Commons", url: "/data-marketplace", icon: Store },
  { title: "Organization Earnings", url: "/organization-earnings", icon: DollarSign },
  { title: "Community Approach", url: "/community-approach", icon: Users },
  { title: "Admin Panel", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMonitor, setIsMonitor] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkRoles();
  }, []);

  const checkRoles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || null);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roleSet = new Set((roles || []).map((r) => r.role));
      setIsAdmin(roleSet.has("admin"));
      setIsMonitor(roleSet.has("monitor"));
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      navigate("/");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={measureLogo} 
            alt="MEASURE" 
            className="h-10 w-auto shrink-0"
          />
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                CARE Model
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Facilitation Platform
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={!item.external && isActive(item.url)}
                    tooltip={item.title}
                  >
                    {item.external ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    ) : (
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.beta && !collapsed && (
                          <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 border border-amber-500/30">
                            Beta
                          </span>
                        )}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>




        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Separator className="mb-2" />
        
        {!collapsed && userEmail && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {userEmail}
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign Out"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mt-2 w-full"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

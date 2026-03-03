import { LayoutDashboard, Building2, Truck, Package, FileText, Bell } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { generateAlerts } from '@/utils/alertEngine';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Shippers', url: '/shippers', icon: Building2 },
  { title: 'Carriers', url: '/carriers', icon: Truck },
  { title: 'Loads', url: '/loads', icon: Package },
  { title: 'Contracts', url: '/contracts', icon: FileText },
  { title: 'Alerts', url: '/alerts', icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { carriers, followUps, loads, contracts } = useAppContext();
  const alertCount = useMemo(() => generateAlerts(carriers, followUps, loads, contracts).length, [carriers, followUps, loads, contracts]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {!collapsed ? (
          <div>
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">DEMAR</h1>
            <p className="text-xs text-muted-foreground">Transportation</p>
          </div>
        ) : (
          <span className="text-lg font-bold text-sidebar-primary">D</span>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.title === 'Alerts' && alertCount > 0 && !collapsed && (
                        <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px]">{alertCount}</Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

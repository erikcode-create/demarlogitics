import { LayoutDashboard, Building2, Truck, Package, FileText, Bell, Phone, Kanban, CheckSquare, Mail, BarChart3, TrendingUp } from 'lucide-react';
import demarLogo from '@/assets/demar-logo.png';
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

const mainItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Shippers', url: '/shippers', icon: Building2 },
  { title: 'Carriers', url: '/carriers', icon: Truck },
  { title: 'Loads', url: '/loads', icon: Package },
  { title: 'Contracts', url: '/contracts', icon: FileText },
  { title: 'Alerts', url: '/alerts', icon: Bell },
];

const salesItems = [
  { title: 'Outbound Calls', url: '/sales/calls', icon: Phone },
  { title: 'Pipeline', url: '/sales/pipeline', icon: Kanban },
  { title: 'Tasks', url: '/sales/tasks', icon: CheckSquare },
  { title: 'Email Templates', url: '/sales/templates', icon: Mail },
  { title: 'Sales Dashboard', url: '/sales/dashboard', icon: TrendingUp },
  { title: 'Performance', url: '/sales/performance', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { carriers, followUps, loads, contracts, salesTasks } = useAppContext();
  const alertCount = useMemo(() => generateAlerts(carriers, followUps, loads, contracts).length, [carriers, followUps, loads, contracts]);
  const openTasks = salesTasks.filter(t => !t.completed).length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {!collapsed ? (
          <img src={demarLogo} alt="Demar Transportation" className="max-h-28 w-auto object-contain" />
        ) : (
          <img src={demarLogo} alt="Demar" className="max-h-20 w-auto object-contain" />
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Sales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.title === 'Tasks' && openTasks > 0 && !collapsed && (
                        <Badge variant="secondary" className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px]">{openTasks}</Badge>
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

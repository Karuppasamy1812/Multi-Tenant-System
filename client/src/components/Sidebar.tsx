import { useNavigate, useLocation } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
  Shield,
  User,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../queries/projects.query";
import { cn } from "../lib/cn";

const roleIcon = { owner: Crown, admin: Shield, member: User };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: projects } = useProjects();
  const [collapsed, setCollapsed] = useState(false);

  const RoleIcon = roleIcon[user?.role ?? "member"];
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/members", label: "Members", icon: Users },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const capitalize = (str?: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-200 flex-shrink-0",
        collapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-gray-100 px-4 flex-shrink-0",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">WorkNest</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
        >
          {collapsed ? (
            <PanelLeftOpen size={17} />
          ) : (
            <PanelLeftClose size={17} />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            title={label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
              isActive(path)
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-gray-600 hover:bg-gray-100",
              collapsed && "justify-center",
            )}
          >
            <Icon size={17} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}

        {/* Projects */}
        {!collapsed && (
          <div className="flex items-center px-3 pt-5 pb-1.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Projects
            </span>
          </div>
        )}
        <div className="space-y-0.5">
          {projects?.map((p) => (
            <button
              key={p._id}
              onClick={() => navigate(`/project/${p._id}`)}
              title={p.name}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                isActive(`/project/${p._id}`)
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100",
                collapsed && "justify-center",
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white",
                  isActive(`/project/${p._id}`)
                    ? "bg-indigo-600"
                    : "bg-gray-300",
                )}
              >
                {p.name[0].toUpperCase()}
              </div>
              {!collapsed && <span className="truncate">{p.name}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-3 flex-shrink-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-100 transition outline-none",
                collapsed && "justify-center",
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                      {capitalize(user?.name)}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown
                    size={13}
                    className="text-gray-400 flex-shrink-0"
                  />
                </>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 min-w-[200px] z-50"
              side="top"
              align="start"
              sideOffset={8}
            >
              <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-800">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Mail size={10} /> {user?.email}
                </p>
              </div>
              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 rounded-lg outline-none cursor-default">
                <RoleIcon size={12} className="text-indigo-500" />
                <span className="capitalize font-medium">{user?.role}</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
              <DropdownMenu.Item
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-lg cursor-pointer hover:bg-red-50 outline-none transition"
              >
                <LogOut size={14} /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </aside>
  );
}

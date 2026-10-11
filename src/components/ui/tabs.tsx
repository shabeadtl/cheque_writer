import * as React from "react"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  children,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<"div"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div data-slot="tabs" className={cn("", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _activeTab: value,
            _onTabChange: onValueChange,
          });
        }
        return child;
      })}
    </div>
  )
}

function TabsList({
  className,
  _activeTab,
  _onTabChange,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  _activeTab?: string;
  _onTabChange?: (value: string) => void;
}) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-1",
        className
      )}
      role="tablist"
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _activeTab,
            _onTabChange,
          });
        }
        return child;
      })}
    </div>
  )
}

function TabsTrigger({
  className,
  value,
  _activeTab,
  _onTabChange,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  value: string;
  _activeTab?: string;
  _onTabChange?: (value: string) => void;
}) {
  const isActive = _activeTab === value;

  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      aria-selected={isActive}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-[#007267] text-white shadow-md shadow-[#007267]/20"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        className
      )}
      onClick={() => _onTabChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({
  className,
  value,
  _activeTab,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value: string;
  _activeTab?: string;
  _onTabChange?: (value: string) => void;
}) {
  if (_activeTab !== value) return null;

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      className={cn("mt-4 animate-fade-in", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

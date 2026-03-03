"use client";
import { cn } from "@/lib/utils";

interface SearchTabsProps {
  activeTab: "guide" | "explore";
  onTabChange: (tab: "guide" | "explore") => void;
}

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div className="flex justify-center mb-12">
      <div className="bg-card p-1.5 rounded-full shadow-md inline-flex border border-border">
        <button
          onClick={() => onTabChange("guide")}
          className={cn(
            "px-6 md:px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300",
            activeTab === "guide"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Le Guide Personnalisé
        </button>
        <button
          onClick={() => onTabChange("explore")}
          className={cn(
            "px-6 md:px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300",
            activeTab === "explore"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Explorer par Catégorie
        </button>
      </div>
    </div>
  );
}

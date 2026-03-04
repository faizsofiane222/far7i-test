import { cn } from "@/lib/utils";

interface ModerationTab {
    id: string;
    label: string;
    badge?: number;
    icon?: React.ReactNode;
}

interface ModerationTabsProps {
    tabs: ModerationTab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function ModerationTabs({ tabs, activeTab, onTabChange }: ModerationTabsProps) {
    return (
        <div className="border-b border-[#D4D2CF] mb-8">
            <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all relative whitespace-nowrap flex items-center gap-2",
                            activeTab === tab.id
                                ? "text-[#B79A63] border-b-2 border-[#B79A63]"
                                : "text-[#1E1E1E]/40 hover:text-[#1E1E1E]/60"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className={cn(
                                "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                activeTab === tab.id
                                    ? "bg-[#B79A63] text-white"
                                    : "bg-[#1E1E1E]/10 text-[#1E1E1E]/60"
                            )}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

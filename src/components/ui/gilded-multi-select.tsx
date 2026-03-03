import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Option {
    id: string;
    label: string;
    name: string;
}

interface GildedMultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function GildedMultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Sélectionner...",
    className,
}: GildedMultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleUnselect = (id: string) => {
        onChange(selected.filter((s) => s !== id));
    };

    const handleSelect = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter((s) => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex min-h-[42px] w-full items-center justify-between rounded-md border border-[#D4D2CF] bg-[#F8F5F0] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#B79A63] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1">
                        {selected.length > 0 ? (
                            options
                                .filter((option) => selected.includes(option.id))
                                .map((option) => (
                                    <Badge
                                        key={option.id}
                                        variant="secondary"
                                        className="bg-[#B79A63]/10 text-[#B79A63] border-none hover:bg-[#B79A63]/20 transition-colors font-lato py-0.5 px-2 flex items-center gap-1"
                                    >
                                        {option.label}
                                        <X
                                            className="h-3 w-3 cursor-pointer hover:text-[#1E1E1E]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnselect(option.id);
                                            }}
                                        />
                                    </Badge>
                                ))
                        ) : (
                            <span className="text-[#1E1E1E]/50 font-lato">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 text-[#1E1E1E]" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-[#D4D2CF] bg-white shadow-lg overflow-hidden" align="start">
                <Command className="bg-white">
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    onSelect={() => handleSelect(option.id)}
                                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer aria-selected:bg-[#B79A63]/5 hover:bg-[#B79A63]/5 transition-colors font-lato text-[#1E1E1E]"
                                >
                                    <div className={cn(
                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#D4D2CF] transition-all",
                                        selected.includes(option.id)
                                            ? "bg-[#B79A63] border-[#B79A63]"
                                            : "bg-transparent"
                                    )}>
                                        {selected.includes(option.id) && (
                                            <Check className="h-3 w-3 text-white stroke-[3px]" />
                                        )}
                                    </div>
                                    <span className="flex-1 text-sm font-medium">{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

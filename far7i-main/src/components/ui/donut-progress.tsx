import React from "react";
import { cn } from "@/lib/utils";

interface DonutProgressProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function DonutProgress({
    score,
    size = 64,
    strokeWidth = 6,
    className,
}: DonutProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    // Determine color based on score
    let strokeColor = "#EF4444"; // Red (<50%)
    if (score >= 50 && score <= 75) {
        strokeColor = "#F59E0B"; // Orange (50-75%)
    } else if (score > 75) {
        strokeColor = "#10B981"; // Green (>75%)
    }

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#D4D2CF"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="opacity-20"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-in-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold font-lato text-[#1E1E1E] leading-none">{score}%</span>
            </div>
        </div>
    );
}

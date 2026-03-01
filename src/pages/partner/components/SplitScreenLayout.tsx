import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SplitScreenLayoutProps {
    children: ReactNode;
    testimonial?: {
        quote: string;
        author: string;
        role: string;
    };
    className?: string;
}

export const SplitScreenLayout = ({ children, testimonial, className }: SplitScreenLayoutProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const messages = [
        "Grow your business with serenity and trust.",
        "Rejoignez une communauté exclusive de prestataires d'excellence.",
        "Far7i vous accompagne à chaque étape pour sublimer vos services.",
        "Sarah M. - Photographe Mariage - Alger"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % messages.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={cn("min-h-screen flex flex-col lg:flex-row w-full", className)}>
            {/* Branding Side - Hero / Value Proposition */}
            <div className="flex flex-col justify-center w-full lg:w-[45%] bg-[#1E1E1E] text-[#F8F5F0] p-6 lg:p-12 relative overflow-hidden shrink-0">
                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(30,30,30,0.9),rgba(30,30,30,0.9))]" />

                <div className="relative z-10 max-w-md mx-auto lg:mx-0 w-full">
                    {/* Logo & Mobile Slider */}
                    <div className="flex items-center justify-between lg:block mb-4 lg:mb-12">
                        <div>
                            <span className="text-2xl font-serif font-bold text-[#B79A63]">far7i</span>
                            <span className="text-white ml-2 text-[10px] lg:text-xs uppercase tracking-[0.3em] font-bold">Partner</span>
                        </div>

                        {/* Mobile Micro-Indicators */}
                        <div className="flex lg:hidden gap-1">
                            {messages.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-500",
                                        currentIndex === i ? "w-4 bg-[#B79A63]" : "w-1 bg-[#B79A63]/20"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Value Proposition Content */}
                    <div className="relative h-16 lg:h-auto flex items-center mb-0 lg:mb-8">
                        {/* Mobile Animated Text */}
                        <div className="lg:hidden w-full">
                            {messages.map((msg, i) => (
                                <p
                                    key={i}
                                    className={cn(
                                        "absolute inset-0 font-serif text-lg leading-tight text-[#B79A63] transition-all duration-700 ease-in-out",
                                        currentIndex === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                                    )}
                                >
                                    "{msg}"
                                </p>
                            ))}
                        </div>

                        {/* Desktop Static Text */}
                        <h2 className="hidden lg:block font-serif text-4xl leading-tight text-[#B79A63]">
                            "{messages[0]}"
                        </h2>
                    </div>

                    <div className="hidden lg:block space-y-4">
                        <p className="font-sans text-lg opacity-80 leading-relaxed">
                            Rejoignez une communauté exclusive de prestataires d'excellence.
                            Far7i vous accompagne à chaque étape pour sublimer vos services.
                        </p>

                        <div className="pt-8 border-t border-[#B79A63]/30">
                            <p className="font-serif text-xl">Sarah M.</p>
                            <p className="text-sm opacity-60 uppercase tracking-wider">Photographe Mariage - Alger</p>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full border border-[#B79A63]/10 hidden lg:block" />
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-[#B79A63]/5 hidden lg:block" />
            </div>

            {/* Form Side - Auth Form */}
            <div className="flex-1 bg-[#F8F5F0] flex flex-col justify-center items-center p-6 md:p-8">
                <div className="w-full max-w-md bg-white lg:bg-transparent p-6 lg:p-0 rounded-3xl lg:rounded-none shadow-xl lg:shadow-none -mt-8 lg:mt-0 relative z-20">
                    {children}
                </div>
            </div>
        </div>
    );
};

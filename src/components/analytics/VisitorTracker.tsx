import { useVisitorTracking } from "@/hooks/useVisitorTracking";

export function VisitorTracker() {
    useVisitorTracking();
    return null; // This component doesn't render anything
}

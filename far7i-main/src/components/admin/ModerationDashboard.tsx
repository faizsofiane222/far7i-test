import { BarChart3, CheckCircle, XCircle, Clock, Users } from "lucide-react";

interface ModerationStats {
    new_providers: number;
    pending_provider_changes: number;
    pending_service_changes: number;
    pending_reviews: number;
    approved_today: number;
    rejected_today: number;
}

interface ModerationDashboardProps {
    stats: ModerationStats;
    loading?: boolean;
}

export function ModerationDashboard({ stats, loading }: ModerationDashboardProps) {
    const statCards = [
        {
            label: "Nouveaux Prestataires",
            value: stats.new_providers,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            label: "Modifs Profils",
            value: stats.pending_provider_changes,
            icon: Clock,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
        },
        {
            label: "Modifs Services",
            value: stats.pending_service_changes,
            icon: Clock,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            label: "Avis en Attente",
            value: stats.pending_reviews,
            icon: Clock,
            color: "text-pink-600",
            bgColor: "bg-pink-50",
        },
        {
            label: "Approuvés Aujourd'hui",
            value: stats.approved_today,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            label: "Rejetés Aujourd'hui",
            value: stats.rejected_today,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
    ];

    const totalPending = stats.new_providers + stats.pending_provider_changes + stats.pending_service_changes + stats.pending_reviews;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#B79A63] to-[#8B7355] rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-2">Tableau de Bord</h2>
                        <p className="text-white/80">Vue d'ensemble de la modération</p>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-bold">{totalPending}</div>
                        <div className="text-sm text-white/80 uppercase tracking-wider">En Attente</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl border border-[#D4D2CF] p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.bgColor}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-[#1E1E1E]">{card.value}</div>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-[#1E1E1E]/60 uppercase tracking-wider">
                            {card.label}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

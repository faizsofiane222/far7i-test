"use client";

import { Eye, MessageCircle, Star, Bell } from "lucide-react";
export function AbstractDashboardTeaser() {
  return (
    <div className="relative w-full max-w-5xl mx-auto bg-card rounded-xl shadow-2xl overflow-hidden border border-border group">
      {/* Window Bar */}
      <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-destructive/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-accent/50" />

        {/* URL Bar */}
        <div className="flex-1 flex justify-center">
          <div className="bg-background/50 rounded-full px-6 py-1 flex items-center gap-2">
            <div className="w-20 h-2 bg-primary/30 rounded-full" />
          </div>
        </div>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-primary/30" />
      </div>

      {/* Dashboard Content */}
      <div className="p-6 md:p-8 space-y-6 transition-all duration-500 group-hover:blur-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold text-foreground">Vue d'ensemble</h3>
            <div className="w-24 h-2 bg-primary/30 rounded-full mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-8 bg-muted rounded-lg" />
            <div className="w-20 h-8 bg-muted rounded-lg" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vues du Profil */}
          <div className="bg-muted/50 rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Vues du Profil</span>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-serif font-bold text-foreground">12,450</p>
            <p className="text-xs text-muted-foreground mt-1">ce mois dernier</p>
          </div>

          {/* Clics WhatsApp */}
          <div className="bg-muted/50 rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Clics </span>
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-serif font-bold text-foreground">843</p>
            <p className="text-xs text-muted-foreground mt-1">Taux de conversion élevé</p>
          </div>

          {/* Note Moyenne */}
          <div className="bg-muted/50 rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Note Moyenne</span>
              <Star className="w-4 h-4 text-primary fill-primary" />
            </div>
            <p className="text-3xl font-serif font-bold text-foreground">4.9</p>
            <div className="flex gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-4 h-1 rounded-full ${i < 4 ? "bg-primary" : "bg-primary/30"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Performance Chart */}
          <div className="md:col-span-3 bg-muted/50 rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">Performance Mensuelle</span>
              <div className="flex gap-2">
                <div className="w-12 h-5 bg-muted rounded" />
                <div className="w-12 h-5 bg-primary/20 rounded" />
              </div>
            </div>
            {/* Bar Chart */}
            <div className="h-36 flex items-end gap-3 pt-4">
              {[45, 65, 40, 80, 55, 70, 50, 85, 60].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/30 rounded-t-sm hover:bg-primary/50 transition-colors"
                    style={{
                      height: `${h}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="md:col-span-2 bg-muted/50 rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">Avis récents</span>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 bg-muted rounded-full w-full" />
                    <div className="h-2 bg-muted rounded-full w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-secondary/20 backdrop-blur-[2px] opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
        <div className="bg-secondary/90 backdrop-blur-sm px-8 py-4 rounded-full border border-border shadow-2xl">
          <span className="text-xl font-bold text-secondary-foreground tracking-widest uppercase">
            Bientôt Disponible
          </span>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { UserPlus, Megaphone, Settings2, PauseCircle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACTION_BUTTONS = [
  { icon: UserPlus, label: "Add User", tone: "blue", path: "/users/create" },
  { icon: CreditCard, label: "New Plan", tone: "amber", path: "/plans/create" },
  { icon: Megaphone, label: "Broadcast", tone: "emerald", path: "/announcements/create" },
  { icon: PauseCircle, label: "Sys Freeze", tone: "rose", path: "/settings/all" },
  { icon: Settings2, label: "Config", tone: "slate", path: "/settings/all" },
];

const TONE = {
  blue: {
    border: "hover:border-blue-500/30",
    ring: "hover:ring-blue-500/20",
    shadow: "hover:shadow-[0_14px_34px_-22px_rgba(59,130,246,0.65)]",
    tint: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    border: "hover:border-amber-500/30",
    ring: "hover:ring-amber-500/20",
    shadow: "hover:shadow-[0_14px_34px_-22px_rgba(245,158,11,0.65)]",
    tint: "bg-amber-500/10",
    icon: "text-amber-700 dark:text-amber-400",
  },
  emerald: {
    border: "hover:border-emerald-500/30",
    ring: "hover:ring-emerald-500/20",
    shadow: "hover:shadow-[0_14px_34px_-22px_rgba(16,185,129,0.65)]",
    tint: "bg-emerald-500/10",
    icon: "text-emerald-700 dark:text-emerald-400",
  },
  rose: {
    border: "hover:border-rose-500/30",
    ring: "hover:ring-rose-500/20",
    shadow: "hover:shadow-[0_14px_34px_-22px_rgba(244,63,94,0.65)]",
    tint: "bg-rose-500/10",
    icon: "text-rose-700 dark:text-rose-400",
  },
  slate: {
    border: "hover:border-slate-500/22",
    ring: "hover:ring-slate-500/16",
    shadow: "hover:shadow-[0_14px_34px_-22px_rgba(100,116,139,0.55)]",
    tint: "bg-slate-500/10",
    icon: "text-slate-700 dark:text-slate-300",
  },
};

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-surface soft-shadow soft-shadow-hover bg-gradient-to-br from-card via-card/95 to-primary/5 border border-border/70 rounded-2xl flex flex-col overflow-hidden h-full transition-all duration-300">
      {/* header untouched */}
      <div className="h-10 sm:h-11 shrink-0 border-b border-border/70 px-3 sm:px-4 flex items-center justify-between bg-secondary/30">
        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
          Quick Actions
        </span>
        <span className="text-[9px] text-muted-foreground/70 font-mono hidden sm:block">
          Admin tools
        </span>
      </div>

      {/* grid untouched */}
      <div className="p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
        {ACTION_BUTTONS.map((btn, idx) => {
          const Icon = btn.icon;
          const t = TONE[btn.tone];

          return (
            <button
              key={idx}
              onClick={() => navigate(btn.path)}
              className={[
                "group relative flex flex-col items-center justify-center gap-2 rounded-xl",
                "border border-border/60",
                "bg-background/65",
                "ring-1 ring-transparent",
                "transition-colors duration-150",
                "hover:bg-background/75",
                t.border,
                t.ring,
                t.shadow,
              ].join(" ")}
            >
              {/* top gloss */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-[55%] rounded-xl bg-gradient-to-b from-white/14 to-transparent dark:from-white/7" />

              {/* micro pattern (static) */}
              <span className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:10px_10px] dark:opacity-[0.10]" />

              {/* icon with duotone feel */}
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 grid place-items-center">
                {/* back plate */}
                <span className={`absolute inset-0 rounded-xl ${t.tint}`} />
                <span className="absolute inset-0 rounded-xl border border-border/60 bg-card/70 shadow-sm shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset]" />
                {/* ghost icon (behind) */}
                <Icon
                  size={16}
                  className="absolute opacity-20 text-foreground hidden sm:block"
                  style={{ transform: "translate(2px, 2px)" }}
                />
                <Icon
                  size={14}
                  className="absolute opacity-20 text-foreground sm:hidden"
                  style={{ transform: "translate(2px, 2px)" }}
                />
                {/* main icon */}
                <Icon size={14} className={`${t.icon} sm:hidden relative`} />
                <Icon size={16} className={`${t.icon} hidden sm:block relative`} />
              </div>

              {/* label */}
              <span className="text-[9px] sm:text-[10px] font-semibold text-foreground/80 tracking-wide">
                {btn.label}
              </span>

              {/* bottom accent line */}
              <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent opacity-80" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
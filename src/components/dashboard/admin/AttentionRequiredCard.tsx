"use client";

import { AlertTriangle, CheckSquare, Headphones, CreditCard, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface AttentionRequiredCardProps {
  openApprovalsCount: number;
  aiErrorsCount: number;
  supportTicketsCount: number;
  failedPaymentsCount: number;
}

export default function AttentionRequiredCard({
  openApprovalsCount = 3,
  aiErrorsCount = 1,
  supportTicketsCount = 2,
  failedPaymentsCount = 1,
}: AttentionRequiredCardProps) {
  const router = useRouter();

  // Combine items to list
  const alerts = [
    {
      id: "approvals",
      icon: <CheckSquare size={16} className="text-[#a78bfa]" />,
      description: `${openApprovalsCount} open goedkeuringen`,
      detail: "Agent acties wachten op fiat",
      priority: "high",
      priorityLabel: "Hoge Prioriteit",
      priorityColor: "bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20",
      buttonLabel: "Bekijken",
      onClick: () => router.push("/admin/goedkeuringen"),
    },
    {
      id: "errors",
      icon: <AlertTriangle size={16} className="text-[#F05268]" />,
      description: `${aiErrorsCount} AI-fout`,
      detail: "Inference exception gedetecteerd",
      priority: "urgent",
      priorityLabel: "1 in 24 uur",
      priorityColor: "bg-[#F05268]/10 text-[#F05268] border-[#F05268]/20",
      buttonLabel: "Oplossen",
      onClick: () => router.push("/admin/ai-agents"),
    },
    {
      id: "tickets",
      icon: <Headphones size={16} className="text-[#21B7E8]" />,
      description: `${supportTicketsCount} supporttickets`,
      detail: "Nieuwe klantvragen ingediend",
      priority: "medium",
      priorityLabel: "Medium",
      priorityColor: "bg-[#21B7E8]/10 text-[#21B7E8] border-[#21B7E8]/20",
      buttonLabel: "Toewijzen",
      onClick: () => router.push("/admin/support-tickets"),
    },
    {
      id: "payments",
      icon: <CreditCard size={16} className="text-[#E7A922]" />,
      description: `${failedPaymentsCount} mislukte betaling`,
      detail: "Stripe betaling geweigerd",
      priority: "high",
      priorityLabel: "Mislukt",
      priorityColor: "bg-[#E7A922]/10 text-[#E7A922] border-[#E7A922]/20",
      buttonLabel: "Oplossen",
      onClick: () => router.push("/admin/companies"),
    },
  ];

  return (
    <Card className="bg-[#252329] border-white/5 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
            <AlertTriangle size={14} className="text-[#F05268]" />
          </span>
          <CardTitle className="text-sm font-semibold text-zinc-100">Aandacht vereist</CardTitle>
        </div>
        <Badge variant="danger" className="font-mono px-2 py-0.5 text-[10px]">
          {openApprovalsCount + aiErrorsCount + supportTicketsCount + failedPaymentsCount} items
        </Badge>
      </CardHeader>
      
      <CardContent className="p-0">
        <ul className="divide-y divide-white/5">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02]"
            >
              {/* Left Side: Icon & text info */}
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 p-1.5 rounded-lg bg-zinc-900 border border-white/5 shrink-0">
                  {alert.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    {alert.description}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {alert.detail}
                  </p>
                </div>
              </div>

              {/* Right Side: Badge & Action button */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`hidden sm:inline-block border px-2 py-0.5 rounded text-[9px] font-medium tracking-wide ${alert.priorityColor}`}>
                  {alert.priorityLabel}
                </span>
                
                <button
                  onClick={alert.onClick}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#21B7E8]"
                >
                  <span>{alert.buttonLabel}</span>
                  <ChevronRight size={10} className="text-zinc-500" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

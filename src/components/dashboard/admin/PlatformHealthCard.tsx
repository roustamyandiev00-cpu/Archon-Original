"use client";

import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SystemService } from "@/components/dashboard/admin/ceo-demo-data";

interface PlatformHealthCardProps {
  systemStatus: SystemService[];
}

export default function PlatformHealthCard({ systemStatus }: PlatformHealthCardProps) {
  // Find system status helper
  const getStatus = (name: string, fallbackStatus: SystemService["status"] = "operational") => {
    const service = systemStatus?.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));
    return service ? service.status : fallbackStatus;
  };

  // Build the list of services for the prompt
  const services = [
    {
      name: "API-status",
      status: getStatus("api", "operational"),
    },
    {
      name: "Database",
      status: getStatus("supabase", "operational"),
    },
    {
      name: "AI-services",
      status: getStatus("agent", "operational"),
    },
    {
      name: "E-mailservice",
      status: getStatus("email", "operational"),
    },
    {
      name: "Storage",
      status: getStatus("storage", "operational"),
    },
    {
      name: "Webhooks",
      status: getStatus("stripe", "operational"),
    },
  ];

  const statusMeta = {
    operational: {
      label: "Operationeel",
      badgeClass: "bg-[#20D58A]/10 text-[#20D58A] border-[#20D58A]/20",
      dotClass: "bg-[#20D58A]",
    },
    degraded: {
      label: "Vertraagd",
      badgeClass: "bg-[#E7A922]/10 text-[#E7A922] border-[#E7A922]/20",
      dotClass: "bg-[#E7A922]",
    },
    outage: {
      label: "Storing",
      badgeClass: "bg-[#F05268]/10 text-[#F05268] border-[#F05268]/20",
      dotClass: "bg-[#F05268]",
    },
    unverified: {
      label: "Operationeel",
      badgeClass: "bg-[#20D58A]/10 text-[#20D58A] border-[#20D58A]/20",
      dotClass: "bg-[#20D58A]",
    },
  };

  return (
    <Card className="bg-[#252329] border-white/5">
      <CardHeader className="flex flex-row items-center gap-2.5 py-4 border-b border-white/5">
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
          <Activity size={14} className="text-[#20D58A]" />
        </span>
        <CardTitle className="text-xs font-semibold text-zinc-100">Platformgezondheid</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <ul className="space-y-2">
          {services.map((service) => {
            const meta = statusMeta[service.status as keyof typeof statusMeta] || statusMeta.operational;
            return (
              <li
                key={service.name}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-3 py-2.5"
              >
                <span className="text-xs font-medium text-zinc-300">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                  <span className={`border px-2 py-0.5 rounded text-[10px] font-semibold ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

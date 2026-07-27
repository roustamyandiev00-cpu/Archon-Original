"use client";

import { Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PlatformCompany } from "@/components/dashboard/admin/ceo-demo-data";
import { useRouter } from "next/navigation";

interface TopCompaniesCardProps {
  companies: PlatformCompany[];
}

export default function TopCompaniesCard({ companies }: TopCompaniesCardProps) {
  const router = useRouter();

  // Sort by revenue then by users, and take top 5
  const topCompanies = [...companies]
    .sort((a, b) => b.revenue - a.revenue || b.users - a.users)
    .slice(0, 5);

  return (
    <Card className="bg-[#252329] border-white/5">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
            <Building2 size={14} className="text-[#21B7E8]" />
          </span>
          <CardTitle className="text-xs font-semibold text-zinc-100">Topbedrijven</CardTitle>
        </div>
        <button
          onClick={() => router.push("/admin/companies")}
          className="text-[10px] font-semibold text-[#21B7E8] hover:underline"
        >
          Bekijk alle
        </button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 pb-2">
                <th className="pb-2 font-semibold">Bedrijf</th>
                <th className="pb-2 font-semibold text-right">Gebruikers</th>
                <th className="pb-2 font-semibold text-right">AI-credits</th>
                <th className="pb-2 font-semibold text-right">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topCompanies.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/companies/${c.id}`)}
                  className="group/row hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 font-medium text-zinc-200 truncate max-w-[120px] group-hover/row:text-[#21B7E8] transition-colors">
                    {c.name}
                  </td>
                  <td className="py-2.5 text-right font-mono text-zinc-400">
                    {c.users}
                  </td>
                  <td className="py-2.5 text-right font-mono text-zinc-400">
                    {c.aiUsage.toLocaleString("nl-BE")}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold text-zinc-300">
                    €{c.revenue}/m
                  </td>
                </tr>
              ))}
              
              {topCompanies.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-zinc-500">
                    Geen actieve bedrijven gevonden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

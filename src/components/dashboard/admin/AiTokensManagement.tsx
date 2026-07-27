"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Coins,
  DollarSign,
  Plus,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CompanyTokenUsage,
  TokenUsageTrendPoint,
  TokenUsageSummary,
} from "@/lib/admin/ai-tokens";
import { TokenUsageChart } from "./TokenUsageChart";

type Props = {
  companies: CompanyTokenUsage[];
  summary: TokenUsageSummary;
  trend: TokenUsageTrendPoint[];
};

export default function AiTokensManagement({ companies, summary, trend }: Props) {
  const [selectedCompany, setSelectedCompany] = useState<CompanyTokenUsage | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "grant" | "limit" | "bulk" | null
  >(null);
  const [tokensInput, setTokensInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "trial" | "low">("all");
  const grantIdempotencyKey = useRef("");

  const filteredCompanies = companies.filter((c) => {
    if (filter === "trial") return c.isTrialUser;
    if (filter === "low")
      return (
        c.lowBalanceThreshold && c.creditsRemaining < c.lowBalanceThreshold
      );
    return true;
  });

  const handleGrantTokens = (company: CompanyTokenUsage) => {
    grantIdempotencyKey.current = crypto.randomUUID();
    setSelectedCompany(company);
    setDialogType("grant");
    setTokensInput("");
    setNoteInput("");
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleSetLimit = (company: CompanyTokenUsage) => {
    setSelectedCompany(company);
    setDialogType("limit");
    setTokensInput(company.tokenLimit?.toString() ?? "");
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleBulkUpdate = () => {
    setDialogType("bulk");
    setTokensInput("50000");
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!tokensInput || loading) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const tokens = Number(tokensInput);

      let body: object;
      if (dialogType === "grant" && selectedCompany) {
        body = {
          action: "grant_tokens",
          companyId: selectedCompany.companyId,
          tokensToAdd: tokens,
          idempotencyKey: grantIdempotencyKey.current,
          note: noteInput || undefined,
        };
      } else if (dialogType === "limit" && selectedCompany) {
        body = {
          action: "update_limit",
          companyId: selectedCompany.companyId,
          tokenLimit: tokens > 0 ? tokens : null,
        };
      } else if (dialogType === "bulk") {
        body = {
          action: "bulk_update_trial",
          tokenLimit: tokens,
        };
      } else {
        return;
      }

      const response = await fetch("/api/admin/ai-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setSubmitError(data.error ?? "De beheeractie is mislukt.");
        return;
      }

      setDialogOpen(false);
      window.location.reload();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "De beheeractie is mislukt.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 px-6 py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Platformbeheer
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              AI-tokenbeheer
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Beheer AI-tokens, limieten en kosten per bedrijf. Monitor verbruik
              en pas trial-limieten aan.
            </p>
          </div>
          <Button onClick={handleBulkUpdate} variant="secondary" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Proeflimieten aanpassen
          </Button>
        </div>
      </header>

      {/* Summary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal bedrijven</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCompanies}</div>
            <p className="text-xs text-zinc-500">
              {summary.trialUsersCount} in proefperiode
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens gebruikt</CardTitle>
            <Coins className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalCreditsUsed.toLocaleString("nl-BE")}
            </div>
            <p className="text-xs text-zinc-500">
              Ø {summary.averagePerCompany.toLocaleString("nl-BE")} per bedrijf
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale kosten</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{summary.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-zinc-500">Platformbreed geregistreerd</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laag saldo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.lowBalanceCount}</div>
            <p className="text-xs text-zinc-500">Bedrijven onder drempel</p>
          </CardContent>
        </Card>
      </section>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Werkelijk tokenverbruik
          </CardTitle>
          <CardDescription>
            Verbruikstransacties van de laatste 6 maanden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenUsageChart data={trend} />
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Alle ({companies.length})
        </Button>
        <Button
          variant={filter === "trial" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("trial")}
        >
          Trial ({summary.trialUsersCount})
        </Button>
        <Button
          variant={filter === "low" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("low")}
        >
          Laag saldo ({summary.lowBalanceCount})
        </Button>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bedrijven — Token Overzicht</CardTitle>
          <CardDescription>
            Klik op een bedrijf om tokens toe te wijzen of limieten aan te passen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Gebruikt</TableHead>
                <TableHead className="text-right">Resterend</TableHead>
                <TableHead className="text-right">Limiet</TableHead>
                <TableHead className="text-right">Kosten</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-28 text-center text-sm text-zinc-500"
                  >
                    Geen bedrijven gevonden voor dit filter.
                  </TableCell>
                </TableRow>
              )}
              {filteredCompanies.map((company) => {
                const isLowBalance =
                  company.lowBalanceThreshold &&
                  company.creditsRemaining < company.lowBalanceThreshold;
                const usagePercent = company.tokenLimit
                  ? (company.creditsUsed / company.tokenLimit) * 100
                  : 0;

                return (
                  <TableRow key={company.companyId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.companyName}</div>
                        <div className="text-xs text-zinc-500">
                          {company.ownerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {company.isTrialUser && (
                          <Badge variant="default" className="text-xs">
                            Trial
                          </Badge>
                        )}
                        {isLowBalance && (
                          <Badge variant="danger" className="text-xs">
                            Laag
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {company.creditsUsed.toLocaleString("nl-BE")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {company.creditsRemaining.toLocaleString("nl-BE")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {company.tokenLimit?.toLocaleString("nl-BE") ?? "—"}
                      {company.tokenLimit && (
                        <div className="text-xs text-zinc-500">
                          {usagePercent.toFixed(0)}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      €{company.totalSpent.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGrantTokens(company)}
                          aria-label={`AI-credits toewijzen aan ${company.companyName}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetLimit(company)}
                          aria-label={`Tokenlimiet aanpassen voor ${company.companyName}`}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "grant" && "Tokens Toewijzen"}
              {dialogType === "limit" && "Token Limiet Aanpassen"}
              {dialogType === "bulk" && "Bulk Update Trial Limieten"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "grant" &&
                `Voeg extra tokens toe voor ${selectedCompany?.companyName}`}
              {dialogType === "limit" &&
                `Stel token limiet in voor ${selectedCompany?.companyName}`}
              {dialogType === "bulk" &&
                `Pas token limiet aan voor alle trial gebruikers (${summary.trialUsersCount} bedrijven)`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tokens">
                {dialogType === "grant" ? "Aantal Tokens" : "Token Limiet"}
              </Label>
              <Input
                id="tokens"
                type="number"
                placeholder="50000"
                value={tokensInput}
                onChange={(e) => setTokensInput(e.target.value)}
                min={dialogType === "grant" ? 1 : 0}
                max={dialogType === "grant" ? 10_000_000 : 1_000_000_000}
              />
            </div>

            {dialogType === "grant" && (
              <div className="space-y-2">
                <Label htmlFor="note">Notitie (optioneel)</Label>
                <Input
                  id="note"
                  placeholder="Bijv: Gratis bonus voor feedback"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
              </div>
            )}

            {submitError && (
              <p role="alert" className="text-sm text-red-400">
                {submitError}
              </p>
            )}

            {dialogType === "limit" && (
              <p className="text-xs text-zinc-500">
                Laat leeg om limiet te verwijderen
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Annuleer
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !tokensInput}>
              {loading ? "Bezig..." : "Bevestig"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  companyPlanOptions,
  companyStatusOptions,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStorage,
  formatTokens,
  planLabels,
  statusLabels,
  type CompanyLogoTone,
  type CompanyPlan,
  type CompanyStatus,
  type ManagedCompany,
} from "@/components/dashboard/admin/companies-data";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const pageSize = 8;

type PlanFilter = "all" | CompanyPlan;
type StatusFilter = "all" | CompanyStatus;
type RevenueSort = "desc" | "asc";

const logoToneClasses: Record<CompanyLogoTone, string> = {
  sky: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  violet: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
};

const planBadgeVariants: Record<CompanyPlan, BadgeVariant> = {
  Starter: "default",
  Business: "info",
  Enterprise: "violet",
};

const statusBadgeVariants: Record<CompanyStatus, BadgeVariant> = {
  active: "success",
  trial: "warning",
  suspended: "danger",
};

export default function CompaniesDataTable({
  companies,
}: {
  companies: ManagedCompany[];
}) {
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [revenueSort, setRevenueSort] = useState<RevenueSort>("desc");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return companies
      .filter((company) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          [
            company.name,
            company.domain,
            company.owner,
            company.ownerEmail,
            company.plan,
            statusLabels[company.status],
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);

        const matchesPlan =
          planFilter === "all" || company.plan === planFilter;
        const matchesStatus =
          statusFilter === "all" || company.status === statusFilter;

        return matchesQuery && matchesPlan && matchesStatus;
      })
      .sort((a, b) =>
        revenueSort === "desc"
          ? b.monthlyRevenue - a.monthlyRevenue
          : a.monthlyRevenue - b.monthlyRevenue,
      );
  }, [companies, planFilter, query, revenueSort, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filteredCompanies.length);
  const visibleCompanies = filteredCompanies.slice(pageStart, pageEnd);

  function resetFilters() {
    setQuery("");
    setPlanFilter("all");
    setStatusFilter("all");
    setRevenueSort("desc");
    setPage(1);
  }

  function toggleRevenueSort() {
    setRevenueSort((current) => (current === "desc" ? "asc" : "desc"));
    setPage(1);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            Search, filter, sort, and manage all customer companies.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <SlidersHorizontal size={14} />
          <span>
            {filteredCompanies.length.toLocaleString("nl-BE")} of{" "}
            {companies.length.toLocaleString("nl-BE")} companies
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_12rem_12rem_auto]">
          <label className="relative block">
            <span className="sr-only">Search companies</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search companies, owners, domains..."
              className="pl-9"
            />
          </label>

          <label>
            <span className="sr-only">Filter by plan</span>
            <Select
              value={planFilter}
              onChange={(event) => {
                setPlanFilter(event.target.value as PlanFilter);
                setPage(1);
              }}
            >
              <option value="all">All plans</option>
              {companyPlanOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {planLabels[plan]}
                </option>
              ))}
            </Select>
          </label>

          <label>
            <span className="sr-only">Filter by status</span>
            <Select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              {companyStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </Select>
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={resetFilters}
            className="justify-center"
          >
            <RotateCcw size={15} />
            Reset
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <Table className="min-w-[1320px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[260px]">Company Name</TableHead>
                <TableHead className="min-w-[190px]">Owner</TableHead>
                <TableHead>Subscription Plan</TableHead>
                <TableHead className="text-right">Active Users</TableHead>
                <TableHead className="text-right">AI Tokens Used</TableHead>
                <TableHead className="text-right">AI Cost</TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={toggleRevenueSort}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
                    aria-label="Sort by monthly revenue"
                  >
                    Monthly Revenue
                    {revenueSort === "desc" ? (
                      <ArrowDown size={13} />
                    ) : (
                      <ArrowUp size={13} />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-right">Storage Used</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risico</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right md:sticky md:right-0 md:z-10 md:bg-zinc-950 md:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCompanies.length > 0 ? (
                visibleCompanies.map((company) => (
                  <TableRow key={company.id} id={`company-${company.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border font-mono text-xs font-semibold ${logoToneClasses[company.logoTone]}`}
                          aria-hidden
                        >
                          {company.logoInitials}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/companies/${company.id}`}
                            className="block truncate font-medium text-zinc-100 transition-colors hover:text-sky-300"
                          >
                            {company.name}
                          </Link>
                          <p className="truncate font-mono text-xs text-zinc-500">
                            {company.domain}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate text-zinc-200">{company.owner}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {company.ownerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={planBadgeVariants[company.plan]}>
                        {planLabels[company.plan]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {company.activeUsers.toLocaleString("nl-BE")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {formatTokens(company.aiTokensUsed)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {formatCurrency(company.aiCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-zinc-100">
                      {formatCurrency(company.monthlyRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {formatStorage(company.storageUsedGb)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {formatDateTime(company.lastLogin)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariants[company.status]}>
                        {statusLabels[company.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          company.risicoStatus === "normaal"
                            ? "default"
                            : "warning"
                        }
                      >
                        {(company.risicoStatus ?? "normaal").replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {formatDate(company.createdAt)}
                    </TableCell>
                    <TableCell className="text-right md:sticky md:right-0 md:bg-zinc-950 md:shadow-[-16px_0_24px_rgba(9,9,11,0.72)]">
                      <CompanyActionMenu
                        company={company}
                        open={openMenuId === company.id}
                        onOpenChange={(open) =>
                          setOpenMenuId(open ? company.id : null)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={13} className="py-12 text-center">
                    <div className="mx-auto max-w-sm">
                      <p className="text-sm font-medium text-zinc-200">
                        No companies found
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Adjust search or filters to broaden the company list.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Showing{" "}
            <span className="font-mono text-zinc-300">
              {filteredCompanies.length === 0 ? 0 : pageStart + 1}
            </span>{" "}
            to{" "}
            <span className="font-mono text-zinc-300">{pageEnd}</span> of{" "}
            <span className="font-mono text-zinc-300">
              {filteredCompanies.length.toLocaleString("nl-BE")}
            </span>{" "}
            companies
          </p>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="min-w-24 text-center font-mono text-xs text-zinc-400">
              Page {currentPage} / {pageCount}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage === pageCount}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyActionMenu({
  company,
  open,
  onOpenChange,
}: {
  company: ManagedCompany;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  function closeMenu() {
    onOpenChange(false);
  }

  return (
    <div className="relative inline-flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!open);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open actions for ${company.name}`}
      >
        <MoreHorizontal size={16} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 py-1 text-left shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <MenuLink
            href={`/admin/companies/${company.id}`}
            icon={<ExternalLink size={14} />}
            onClick={closeMenu}
          >
            Open Company
          </MenuLink>
          <MenuItem icon={<Pencil size={14} />} onClick={closeMenu} disabled>
            Edit
          </MenuItem>
          <MenuItem
            icon={<Ban size={14} />}
            onClick={closeMenu}
            disabled
          >
            Suspend
          </MenuItem>
          <MenuItem
            icon={<CheckCircle2 size={14} />}
            onClick={closeMenu}
            disabled
          >
            Activate
          </MenuItem>
          <div className="my-1 h-px bg-white/10" />
          <MenuItem icon={<CreditCard size={14} />} onClick={closeMenu} disabled>
            View Billing
          </MenuItem>
          <MenuItem icon={<Bot size={14} />} onClick={closeMenu} disabled>
            View AI Usage
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-700 disabled:hover:bg-transparent"
    >
      <span className="text-zinc-500">{icon}</span>
      {children}
    </button>
  );
}

function MenuLink({
  children,
  icon,
  href,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
    >
      <span className="text-zinc-500">{icon}</span>
      {children}
    </Link>
  );
}

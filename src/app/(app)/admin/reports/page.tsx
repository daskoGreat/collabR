import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import ReportsAdmin from "./reports-admin";
import BackButton from "@/components/back-button";

export default async function AdminReportsPage() {
    await requireRole("ADMIN", "MODERATOR");

    const reports = await prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            reporter: { select: { name: true } },
            resolver: { select: { name: true } },
        },
    });

    return (
        <>
            <div className="topbar">
                <div className="row" style={{ gap: "var(--space-4)" }}>
                    <BackButton />
                    <div className="topbar-title">
                        <span className="text-muted">admin /</span>{" "}
                        <span className="topbar-title-highlight">⚑</span> reports
                    </div>
                </div>
            </div>
            <ReportsAdmin
                reports={reports.map((r: typeof reports[number]) => ({
                    id: r.id,
                    reporterName: r.reporter.name,
                    targetType: r.targetType,
                    targetId: r.targetId,
                    reason: r.reason,
                    status: r.status,
                    resolverName: r.resolver?.name || null,
                    resolvedAt: r.resolvedAt?.toISOString() || null,
                    createdAt: r.createdAt.toISOString(),
                }))}
            />
        </>
    );
}

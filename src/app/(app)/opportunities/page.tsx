import { prisma } from "@/lib/db";
import OpportunityBoard from "@/components/opportunity-board";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";

export default async function OpportunitiesPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const opportunities = await prisma.opportunity.findMany({
        include: {
            user: { select: { id: true, name: true } },
            _count: { select: { comments: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    // Serialize dates for client components
    const serializedOpportunities = opportunities.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        deadline: o.deadline ? o.deadline.toISOString() : null,
        type: o.type as any,
        location: o.location as any,
    }));

    return (
        <Container style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-2xl)' }}>
            <Stack direction="vertical" gap="xl">
                <Stack direction="vertical" gap="xs">
                    <Typography variant="caption" className="text-secondary uppercase tracking-widest">
                        Opportunities & Growth
                    </Typography>
                    <Typography variant="h1">
                        Find your next step, together.
                    </Typography>
                </Stack>

                <OpportunityBoard
                    initialOpportunities={serializedOpportunities as any}
                    currentUserName={session.user.name ?? undefined}
                />
            </Stack>
        </Container>
    );
}

import { requireRole } from "@/lib/auth-guard";
import { getPendingRequests } from "@/lib/actions/join-requests";
import RequestsAdmin from "./requests-admin";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { Typography } from "@/components/ui/typography";
import BackButton from "@/components/back-button";

export default async function AdminRequestsPage() {
    await requireRole("ADMIN", "MODERATOR");

    const result = await getPendingRequests();

    // In server components, passing Date objects to Client Components 
    // requires them to be serialized. Prisma returns Dates.
    const serializedRequests = result.requests?.map(req => ({
        ...req,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
    })) || [];

    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Stack direction="horizontal" gap={16} align="center" style={{ marginBottom: "1.5rem" }}>
                        <BackButton />
                        <Stack direction="horizontal" gap={8} align="center">
                            <Typography style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>administratör</Typography>
                            <Typography style={{ color: "rgba(255,255,255,0.2)" }}>/</Typography>
                            <Typography style={{ color: "white", fontWeight: 700 }}>ansökningar</Typography>
                        </Stack>
                    </Stack>

                    <Typography style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                        Medlemsansökningar
                    </Typography>
                </Box>

                <RequestsAdmin initialRequests={serializedRequests} />
            </Stack>
        </Container>
    );
}

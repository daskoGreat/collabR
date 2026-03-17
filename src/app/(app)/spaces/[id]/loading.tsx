import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";

export default function Loading() {
    return (
        <Container style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <Stack gap={48}>
                <Box>
                    <Skeleton width="400px" height="48px" style={{ marginBottom: "1rem" }} />
                    <Skeleton width="100%" height="20px" style={{ opacity: 0.5 }} />
                </Box>

                <Box style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem" }}>
                    <Box style={{ gridColumn: "span 8" }}>
                        <Stack gap={32}>
                            <Box style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Skeleton width="200px" height="24px" style={{ marginBottom: "2rem" }} />
                                <Skeleton height="150px" borderRadius="16px" />
                            </Box>
                            <Box style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Skeleton width="200px" height="24px" style={{ marginBottom: "2rem" }} />
                                <Stack gap={16}>
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} height="80px" borderRadius="16px" />
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    </Box>
                    <Box style={{ gridColumn: "span 4" }}>
                        <Stack gap={24}>
                            <Skeleton height="300px" borderRadius="24px" />
                            <Skeleton height="150px" borderRadius="24px" />
                        </Stack>
                    </Box>
                </Box>
            </Stack>
        </Container>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getThreadData } from "@/lib/actions/chat";
import DmView from "./dm-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Box } from "@/components/layout/Box";
import { ArrowLeft } from "lucide-react";

interface Props {
    params: any;
}

export default function DmPage({ params }: Props) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [initializing, setInitializing] = useState(true);
    const [data, setData] = useState<any>(null);
    const [threadId, setThreadId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const p = await params;
            setThreadId(p.threadId);

            if (status === "authenticated") {
                try {
                    const res = await getThreadData(p.threadId);
                    if (res && 'success' in res) {
                        setData(res.thread);
                    } else if (res && 'error' in res) {
                        if (res.error === "not_found") router.push("/messages");
                    }
                } catch (err) {
                    console.error("Failed to load thread:", err);
                } finally {
                    setTimeout(() => setInitializing(false), 600);
                }
            } else if (status === "unauthenticated") {
                router.push("/login");
            }
        }
        load();
    }, [status, params, router]);

    if (status === "loading" || initializing) {
        return (
            <Container style={{ paddingTop: '2rem' }}>
                <Stack gap={32}>
                    <Box>
                        <Stack direction="horizontal" gap={16} align="center" style={{ marginBottom: "1rem" }}>
                            <Skeleton width="40px" height="40px" borderRadius="12px" />
                            <Skeleton width="200px" height="32px" />
                        </Stack>
                    </Box>
                    <Box style={{ flex: 1, minHeight: '60vh', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
                        <Stack gap={24}>
                            <Skeleton height="80px" borderRadius="16px" width="60%" />
                            <Skeleton height="80px" borderRadius="16px" width="40%" style={{ alignSelf: 'flex-end' }} />
                            <Skeleton height="80px" borderRadius="16px" width="70%" />
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        );
    }

    if (!data || !session?.user) return null;

    const isGroup = data.isGroup;
    let title = data.name || "Gruppchatt";
    let otherUser: any = null;

    if (!isGroup) {
        const otherMember = data.members.find((m: any) => m.userId !== session.user.id);
        otherUser = otherMember?.user || { id: "unknown", name: "Borttagen användare", lastSeenAt: null };
        title = otherUser.name;
    }

    const currentUser = session.user;

    return (
        <DmView
            threadId={threadId!}
            title={title}
            isGroup={isGroup}
            otherUser={otherUser}
            currentUser={{
                id: currentUser.id,
                name: currentUser.name || "",
                avatarId: (currentUser as any).avatarId
            }}
            initialMessages={data.messages}
        />
    );
}

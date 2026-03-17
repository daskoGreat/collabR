"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { Box } from "@/components/layout/Box";

export default function LandingPage() {
  return (
    <Box style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Floral Corners Frame - Fixed to Viewport edges */}
      <Box style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.9
      }}>
        {/* Top Left */}
        <Box style={{
          position: 'absolute',
          top: '-2.5%',
          left: '-2.5%',
          width: '50vw',
          maxWidth: '600px',
          height: '50vh',
          maxHeight: '600px',
          backgroundImage: 'url("/floral_border.png")',
          backgroundSize: '200% 200%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Top Right */}
        <Box style={{
          position: 'absolute',
          top: '-2.5%',
          right: '-2.5%',
          width: '50vw',
          maxWidth: '600px',
          height: '50vh',
          maxHeight: '600px',
          backgroundImage: 'url("/floral_border.png")',
          backgroundSize: '200% 200%',
          backgroundPosition: '100% 0',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Bottom Left */}
        <Box style={{
          position: 'absolute',
          bottom: '-2.5%',
          left: '-2.5%',
          width: '50vw',
          maxWidth: '600px',
          height: '50vh',
          maxHeight: '600px',
          backgroundImage: 'url("/floral_border.png")',
          backgroundSize: '200% 200%',
          backgroundPosition: '0 100%',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Bottom Right */}
        <Box style={{
          position: 'absolute',
          bottom: '-2.5%',
          right: '-2.5%',
          width: '50vw',
          maxWidth: '600px',
          height: '50vh',
          maxHeight: '600px',
          backgroundImage: 'url("/floral_border.png")',
          backgroundSize: '200% 200%',
          backgroundPosition: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }} />
      </Box>

      <Container style={{
        maxWidth: '1000px',
        position: 'relative',
        zIndex: 10,
        textAlign: 'center'
      }}>
        <Stack direction="vertical" gap="xl" align="center">

          <Typography style={{
            fontSize: 'min(7rem, 14vw)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-outfit)',
            color: '#ffffff',
            margin: 0
          }}>
            Welcome to The<br />Support Network!
          </Typography>

          <Link href="/register" style={{ textDecoration: 'none' }}>
            <Typography style={{
              fontSize: 'min(2.75rem, 6vw)',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'var(--font-outfit)',
              marginTop: '1rem'
            }} className="hover:opacity-80 transition-opacity">
              Click here to join
            </Typography>
          </Link>

          <Box style={{ margin: '1rem 0' }}>
            <img src="/heart.png" alt="Heart" style={{ width: 'min(12rem, 24vw)', height: 'auto' }} />
          </Box>

          <Stack direction="vertical" gap="lg" align="center" style={{ marginTop: '1rem' }}>
            <Typography style={{
              fontSize: '1.25rem',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-inter)',
              fontWeight: 500
            }}>
              Already a member?
            </Typography>

            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Box style={{
                border: '1px solid rgba(255,255,255,0.5)',
                padding: '1rem 4rem',
                borderRadius: '9999px',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-block'
              }} className="hover:bg-white hover:text-black">
                <Typography style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-inter)'
                }}>
                  Sign In
                </Typography>
              </Box>
            </Link>
          </Stack>

        </Stack>
      </Container>
    </Box>
  );
}

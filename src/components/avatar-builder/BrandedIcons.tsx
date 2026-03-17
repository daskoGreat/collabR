"use client";

import React from "react";

export const BRANDED_AVATARS = [
    {
        id: "default", label: "Neutral", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="2" opacity="0.2" />
                <circle cx="50" cy="40" r="15" stroke={color} strokeWidth="3" />
                <path d="M20 80C25 70 35 65 50 65C65 65 75 70 80 80" stroke={color} strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        id: "support", label: "Support", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 30C35 30 25 40 25 55C25 75 50 90 50 90C50 90 75 75 75 55C75 40 65 30 50 30Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
                <circle cx="50" cy="55" r="8" fill={color} opacity="0.2" />
            </svg>
        )
    },
    {
        id: "heart-shield", label: "Heart Shield", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 20L20 35V60C20 75 50 85 50 85C50 85 80 75 80 60V35L50 20Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
                <path d="M50 40C45 40 40 44 40 50C40 58 50 65 50 65C50 65 60 58 60 50C60 44 55 40 50 40Z" stroke={color} strokeWidth="2" fill={color} opacity="0.2" />
            </svg>
        )
    },
    {
        id: "calm-face", label: "Calm Face", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="3" />
                <path d="M35 45H45M55 45H65" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <path d="M40 65C40 65 45 70 50 70C55 70 60 65 60 65" stroke={color} strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        id: "star", label: "Guiding Star", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 15L58 42H85L63 58L71 85L50 68L29 85L37 58L15 42H42L50 15Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
                <circle cx="50" cy="53" r="10" fill={color} opacity="0.1" />
            </svg>
        )
    },
    {
        id: "open-hands", label: "Open Hands", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 60C30 60 20 50 20 40C20 30 30 25 35 35" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <path d="M70 60C70 60 80 50 80 40C80 30 70 25 65 35" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="65" r="10" stroke={color} strokeWidth="3" opacity="0.3" />
            </svg>
        )
    },
    {
        id: "community", label: "Community", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="30" r="10" stroke={color} strokeWidth="3" />
                <circle cx="25" cy="60" r="10" stroke={color} strokeWidth="3" />
                <circle cx="75" cy="60" r="10" stroke={color} strokeWidth="3" />
                <path d="M35 60H65" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
            </svg>
        )
    },
    {
        id: "growth", label: "Growth", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 85V40M50 40L35 55M50 40L65 55" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M30 85H70" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="30" r="5" fill={color} />
            </svg>
        )
    },
    {
        id: "meditation", label: "Meditation", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.2" />
                <path d="M30 70C30 70 40 50 50 50C60 50 70 70 70 70" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="35" r="8" stroke={color} strokeWidth="3" />
            </svg>
        )
    },
    {
        id: "pathway", label: "Pathway", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 80C20 80 40 75 50 50C60 25 80 20 80 20" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <circle cx="80" cy="20" r="6" fill={color} />
            </svg>
        )
    },
    {
        id: "sunrise", label: "Sunrise", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 70H80" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <path d="M30 70C30 50 40 40 50 40C60 40 70 50 70 70" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <path d="M50 20V30M30 40L35 45M70 40L65 45" stroke={color} strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        id: "bridge", label: "Bridge", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 60C20 60 40 40 50 40C60 40 80 60 80 60" stroke={color} strokeWidth="4" strokeLinecap="round" />
                <path d="M20 70H80" stroke={color} strokeWidth="2" opacity="0.3" />
            </svg>
        )
    },
    {
        id: "ear", label: "Listening", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40 30C40 30 30 35 30 50C30 65 40 70 40 70" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <path d="M45 40C45 40 38 43 38 50C38 57 45 60 45 60" stroke={color} strokeWidth="2" opacity="0.5" />
                <circle cx="65" cy="50" r="10" stroke={color} strokeWidth="3" />
            </svg>
        )
    },
    {
        id: "nodes", label: "Connected", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="8" stroke={color} strokeWidth="2" />
                <circle cx="70" cy="30" r="8" stroke={color} strokeWidth="2" />
                <circle cx="50" cy="70" r="8" stroke={color} strokeWidth="2" />
                <path d="M38 30H62M35 38L45 62M65 38L55 62" stroke={color} strokeWidth="2" strokeDasharray="4 2" opacity="0.4" />
            </svg>
        )
    },
    {
        id: "compass", label: "Compass", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="3" />
                <path d="M50 30L55 50L50 70L45 50L50 30Z" stroke={color} strokeWidth="2" fill={color} opacity="0.2" />
                <circle cx="50" cy="50" r="2" fill={color} />
            </svg>
        )
    },
    {
        id: "lotus", label: "Peace", icon: (color: string) => (
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 80C50 80 30 60 30 45C30 30 50 20 50 20" stroke={color} strokeWidth="2" />
                <path d="M50 80C50 80 70 60 70 45C70 30 50 20 50 20" stroke={color} strokeWidth="2" />
                <path d="M50 80V40" stroke={color} strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
];

export function getBrandedAvatar(id: string) {
    return BRANDED_AVATARS.find(a => a.id === id) || BRANDED_AVATARS[0];
}

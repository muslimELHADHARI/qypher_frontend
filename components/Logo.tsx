"use client";

import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-glow ${className}`}
    >
      <defs>
        <linearGradient id="qypher-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D35400" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Circle (Broken) */}
      <path
        d="M80 50C80 66.5685 66.5685 80 50 80C33.4315 80 20 66.5685 20 50C20 33.4315 33.4315 20 50 20C58.2843 20 65.7843 23.3579 71.2132 28.7868"
        stroke="url(#qypher-gradient)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Interlocking Inner Curve */}
      <path
        d="M50 35C41.7157 35 35 41.7157 35 50C35 58.2843 41.7157 65 50 65C58.2843 65 65 58.2843 65 50"
        stroke="url(#qypher-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Q Tail / Link */}
      <path
        d="M65 65L85 85"
        stroke="url(#qypher-gradient)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Central Quantum Particle */}
      <circle cx="50" cy="50" r="4" fill="white" filter="url(#glow)">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

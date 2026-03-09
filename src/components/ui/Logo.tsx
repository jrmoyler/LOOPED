"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoopedLogo({ size = "md", className = "" }: LogoProps) {
  const scales = { sm: 0.6, md: 1, lg: 1.5 };
  const scale = scales[size];
  const w = 160 * scale;
  const h = 36 * scale;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 160 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* L */}
      <text
        x="0"
        y="28"
        fontFamily="'Inter', Arial, sans-serif"
        fontWeight="700"
        fontSize="28"
        letterSpacing="3"
        fill="white"
      >
        L
      </text>
      {/* First O */}
      <text
        x="20"
        y="28"
        fontFamily="'Inter', Arial, sans-serif"
        fontWeight="700"
        fontSize="28"
        letterSpacing="3"
        fill="white"
      >
        O
      </text>
      {/* Second O — broken loop */}
      {/* White base ring */}
      <circle cx="62" cy="16" r="12" stroke="white" strokeWidth="4.5" fill="none" />
      {/* Accent break arc in #7B61FF */}
      <path
        d="M62 4 A12 12 0 1 1 50.4 22"
        stroke="#7B61FF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* P */}
      <text
        x="78"
        y="28"
        fontFamily="'Inter', Arial, sans-serif"
        fontWeight="700"
        fontSize="28"
        letterSpacing="3"
        fill="white"
      >
        PED
      </text>
    </svg>
  );
}

export function LoopedGlyph({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square bg */}
      <rect width="40" height="40" rx="10" fill="#0B0B0B" />
      {/* White ring */}
      <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="4" fill="none" />
      {/* Accent break arc */}
      <path
        d="M20 8 A12 12 0 1 1 8.4 26"
        stroke="#7B61FF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

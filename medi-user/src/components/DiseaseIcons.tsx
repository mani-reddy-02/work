import React from 'react';

const BaseSvg = ({ className }: { className?: string }, children: React.ReactNode) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

const strokeProps = {
  stroke: "#1a1a2e",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

export const HeartIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 54 C32 54 10 38 10 22 C10 14 16 8 24 8 C28 8 32 12 32 12 C32 12 36 8 40 8 C48 8 54 14 54 22 C54 38 32 54 32 54 Z" fill="#ff4757" {...strokeProps} />
      <path d="M18 20 C22 14 26 18 26 18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </>
  )
);

export const KidneyIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 16 L32 56" fill="none" {...strokeProps} stroke="#4a69bd" />
      <path d="M26 16 C12 16 10 38 22 42 C26 44 30 38 26 32 C22 26 28 20 28 20 Z" fill="#ff6b81" {...strokeProps} />
      <path d="M38 16 C52 16 54 38 42 42 C38 44 34 38 38 32 C42 26 36 20 36 20 Z" fill="#ff6b81" {...strokeProps} />
      <circle cx="20" cy="30" r="2" fill="#fff" opacity="0.6" />
      <circle cx="44" cy="30" r="2" fill="#fff" opacity="0.6" />
    </>
  )
);

export const SkinIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M16 12 L48 12 C52 12 56 16 56 20 L56 44 C56 48 52 52 48 52 L16 52 C12 52 8 48 8 44 L8 20 C8 16 12 12 16 12 Z" fill="#f8c291" {...strokeProps} />
      <circle cx="20" cy="24" r="3" fill="#e55039" {...strokeProps} />
      <circle cx="40" cy="36" r="4" fill="#e55039" {...strokeProps} />
      <circle cx="46" cy="20" r="2" fill="#e55039" {...strokeProps} />
      <circle cx="26" cy="42" r="3" fill="#e55039" {...strokeProps} />
      <circle cx="34" cy="28" r="2" fill="#e55039" {...strokeProps} />
    </>
  )
);

export const LiverIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M10 32 C10 16 26 12 44 20 C54 24 56 36 50 44 C44 52 24 50 16 44 C12 40 10 36 10 32 Z" fill="#e58e26" {...strokeProps} />
      <path d="M16 34 C24 30 32 38 40 34" fill="none" opacity="0.4" {...strokeProps} />
      <circle cx="24" cy="24" r="2" fill="#fff" opacity="0.5" />
      <circle cx="40" cy="30" r="3" fill="#f8c291" {...strokeProps} />
      <circle cx="28" cy="40" r="2" fill="#f8c291" {...strokeProps} />
    </>
  )
);

export const BrainIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 52 C20 52 10 44 10 32 C10 20 20 12 32 12 C44 12 54 20 54 32 C54 44 44 52 32 52 Z" fill="#f8a5c2" {...strokeProps} />
      <path d="M32 12 L32 52" fill="none" {...strokeProps} />
      <path d="M16 32 C16 24 24 16 32 16" fill="none" {...strokeProps} />
      <path d="M48 32 C48 24 40 16 32 16" fill="none" {...strokeProps} />
      <path d="M16 32 C24 32 24 48 32 48" fill="none" {...strokeProps} />
      <path d="M48 32 C40 32 40 48 32 48" fill="none" {...strokeProps} />
    </>
  )
);

export const LungsIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 8 L32 28" fill="none" {...strokeProps} />
      <path d="M32 24 L24 32" fill="none" {...strokeProps} />
      <path d="M32 24 L40 32" fill="none" {...strokeProps} />
      <path d="M30 18 C20 18 10 26 12 40 C14 54 26 56 30 50 C34 44 30 28 30 18 Z" fill="#ff9ff3" {...strokeProps} />
      <path d="M34 18 C44 18 54 26 52 40 C50 54 38 56 34 50 C30 44 34 28 34 18 Z" fill="#ff9ff3" {...strokeProps} />
    </>
  )
);

export const VirusIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <circle cx="32" cy="32" r="16" fill="#1dd1a1" {...strokeProps} />
      <path d="M32 16 L32 8" fill="none" {...strokeProps} />
      <circle cx="32" cy="6" r="3" fill="#ff6b6b" {...strokeProps} />
      <path d="M32 48 L32 56" fill="none" {...strokeProps} />
      <circle cx="32" cy="58" r="3" fill="#ff6b6b" {...strokeProps} />
      <path d="M16 32 L8 32" fill="none" {...strokeProps} />
      <circle cx="6" cy="32" r="3" fill="#ff6b6b" {...strokeProps} />
      <path d="M48 32 L56 32" fill="none" {...strokeProps} />
      <circle cx="58" cy="32" r="3" fill="#ff6b6b" {...strokeProps} />
      <path d="M20 20 L14 14" fill="none" {...strokeProps} />
      <circle cx="12" cy="12" r="3" fill="#5f27cd" {...strokeProps} />
      <path d="M44 44 L50 50" fill="none" {...strokeProps} />
      <circle cx="52" cy="52" r="3" fill="#5f27cd" {...strokeProps} />
      <path d="M44 20 L50 14" fill="none" {...strokeProps} />
      <circle cx="52" cy="12" r="3" fill="#5f27cd" {...strokeProps} />
      <path d="M20 44 L14 50" fill="none" {...strokeProps} />
      <circle cx="12" cy="52" r="3" fill="#5f27cd" {...strokeProps} />
    </>
  )
);

export const BoneIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M18 24 C10 24 10 12 18 12 C24 12 26 18 32 18 C38 18 40 12 46 12 C54 12 54 24 46 24 C40 24 38 28 38 36 C38 44 40 48 46 48 C54 48 54 60 46 60 C40 60 38 54 32 54 C26 54 24 60 18 60 C10 60 10 48 18 48 C24 48 26 44 26 36 C26 28 24 24 18 24 Z" fill="#c8d6e5" {...strokeProps} />
      <path d="M26 36 L38 36" fill="none" opacity="0.3" {...strokeProps} />
    </>
  )
);

export const StomachIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M38 10 L38 22 C38 26 44 28 48 32 C54 38 56 48 48 54 C40 60 20 60 12 52 C8 48 12 40 16 38 C22 35 24 28 24 22 L24 10" fill="#ff9f43" {...strokeProps} />
      <path d="M24 16 L38 16" fill="none" {...strokeProps} />
    </>
  )
);

export const EyeIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 48 C16 48 6 32 6 32 C6 32 16 16 32 16 C48 16 58 32 58 32 C58 32 48 48 32 48 Z" fill="#fff" {...strokeProps} />
      <circle cx="32" cy="32" r="12" fill="#54a0ff" {...strokeProps} />
      <circle cx="32" cy="32" r="5" fill="#111827" />
      <circle cx="28" cy="28" r="3" fill="#fff" />
    </>
  )
);

export const ToothIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M20 14 C20 8 44 8 44 14 C44 26 52 40 44 54 C40 60 32 48 32 40 C32 48 24 60 20 54 C12 40 20 26 20 14 Z" fill="#fff" {...strokeProps} />
      <path d="M24 22 C26 20 30 20 32 22" fill="none" opacity="0.3" {...strokeProps} />
    </>
  )
);

export const DropsIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 12 C32 12 44 32 44 42 C44 50 38 56 32 56 C26 56 20 50 20 42 C20 32 32 12 32 12 Z" fill="#48dbfb" {...strokeProps} />
      <circle cx="28" cy="46" r="3" fill="#fff" opacity="0.6" />
    </>
  )
);

export const RibbonIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M42 54 L32 38 C28 32 22 28 22 20 C22 14 26 10 32 10 C38 10 42 14 42 20 C42 28 36 32 32 38 L22 54" fill="none" stroke="#f368e0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 54 L32 38 C28 32 22 28 22 20 C22 14 26 10 32 10 C38 10 42 14 42 20 C42 28 36 32 32 38 L22 54" fill="none" {...strokeProps} />
    </>
  )
);

export const EarIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M28 12 C40 12 48 20 48 32 C48 44 40 54 32 54 C24 54 20 48 20 40 C20 32 32 36 32 28 C32 20 26 22 24 16 C22 10 24 12 28 12 Z" fill="#f8c291" {...strokeProps} />
      <path d="M38 32 C38 24 32 20 28 20" fill="none" opacity="0.5" {...strokeProps} />
    </>
  )
);

export const FemaleIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <circle cx="32" cy="24" r="14" fill="#ff9ff3" {...strokeProps} />
      <path d="M32 38 L32 58" fill="none" {...strokeProps} />
      <path d="M22 48 L42 48" fill="none" {...strokeProps} />
    </>
  )
);

export const MaleIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <circle cx="26" cy="38" r="14" fill="#54a0ff" {...strokeProps} />
      <path d="M36 28 L50 14" fill="none" {...strokeProps} />
      <path d="M40 14 L50 14 L50 24" fill="none" {...strokeProps} />
    </>
  )
);

export const ChildIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <circle cx="32" cy="32" r="22" fill="#f8c291" {...strokeProps} />
      <path d="M20 28 C22 24 26 24 28 28" fill="none" {...strokeProps} />
      <path d="M36 28 C38 24 42 24 44 28" fill="none" {...strokeProps} />
      <circle cx="24" cy="32" r="3" fill="#111827" />
      <circle cx="40" cy="32" r="3" fill="#111827" />
      <path d="M28 42 C30 46 34 46 36 42" fill="none" {...strokeProps} />
      <path d="M16 32 C10 32 10 24 16 20" fill="none" {...strokeProps} />
      <path d="M48 32 C54 32 54 24 48 20" fill="none" {...strokeProps} />
    </>
  )
);

export const PsychiatryIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M20 54 L20 46 C20 34 10 28 16 16 C22 4 42 4 48 16 C54 28 44 34 44 46 L44 54" fill="#f8c291" {...strokeProps} />
      <circle cx="32" cy="24" r="6" fill="#feca57" {...strokeProps} />
      <path d="M28 24 L36 24 M32 20 L32 28 M29 21 L35 27 M29 27 L35 21" fill="none" {...strokeProps} />
    </>
  )
);

export const ThermometerIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 10 C28 10 26 12 26 16 L26 40 C22 44 22 52 32 52 C42 52 42 44 38 40 L38 16 C38 12 36 10 32 10 Z" fill="#fff" {...strokeProps} />
      <circle cx="32" cy="46" r="4" fill="#ff4757" />
      <path d="M32 46 L32 24" fill="none" stroke="#ff4757" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 24 L42 24 M38 32 L42 32" fill="none" {...strokeProps} />
    </>
  )
);

export const WindIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M12 24 L40 24 C46 24 48 18 44 14 C40 10 36 16 38 20" fill="none" stroke="#48dbfb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 36 L50 36 C56 36 58 30 54 26 C50 22 46 28 48 32" fill="none" stroke="#48dbfb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 48 L32 48 C38 48 40 42 36 38 C32 34 28 40 30 44" fill="none" stroke="#48dbfb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="48" r="4" fill="#ff6b6b" {...strokeProps} />
      <circle cx="16" cy="12" r="3" fill="#1dd1a1" {...strokeProps} />
    </>
  )
);

export const HeadacheIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M20 54 L20 46 C20 34 10 28 16 16 C22 4 42 4 48 16 C54 28 44 34 44 46 L44 54" fill="#f8c291" {...strokeProps} />
      <path d="M36 10 L28 24 L36 26 L26 40" fill="#feca57" {...strokeProps} />
    </>
  )
);

export const PainIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 10 L32 54" fill="none" stroke="#ff4757" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 26 L48 26" fill="none" stroke="#ff4757" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 14 L44 38" fill="none" stroke="#ff4757" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 14 L20 38" fill="none" stroke="#ff4757" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
);

export const JointIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <circle cx="32" cy="32" r="14" fill="#ff4757" opacity="0.8" />
      <path d="M14 14 C10 18 10 26 16 30 C22 34 28 36 32 32 C36 28 34 22 30 16 C26 10 18 10 14 14 Z" fill="#c8d6e5" {...strokeProps} />
      <path d="M50 50 C54 46 54 38 48 34 C42 30 36 28 32 32 C28 36 30 42 34 48 C38 54 46 54 50 50 Z" fill="#c8d6e5" {...strokeProps} />
    </>
  )
);

export const SparklesIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 8 C32 20 44 32 56 32 C44 32 32 44 32 56 C32 44 20 32 8 32 C20 32 32 20 32 8 Z" fill="#feca57" {...strokeProps} />
      <circle cx="16" cy="16" r="3" fill="#ff9ff3" {...strokeProps} />
      <circle cx="48" cy="48" r="4" fill="#48dbfb" {...strokeProps} />
    </>
  )
);

export const IntestinesIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M16 20 C16 10 48 10 48 20 C48 28 16 32 16 40 C16 48 48 52 48 60" fill="none" stroke="#ff9f43" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 20 C16 10 48 10 48 20 C48 28 16 32 16 40 C16 48 48 52 48 60" fill="none" {...strokeProps} />
    </>
  )
);

export const ThroatIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M22 10 L22 32 C22 42 16 48 16 54 L48 54 C48 48 42 42 42 32 L42 10" fill="#f8c291" {...strokeProps} />
      <circle cx="32" cy="36" r="8" fill="#ff4757" {...strokeProps} />
      <path d="M28 20 L36 20" fill="none" {...strokeProps} />
    </>
  )
);

export const ShieldVirusIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 8 L12 16 L12 32 C12 46 22 56 32 60 C42 56 52 46 52 32 L52 16 Z" fill="#54a0ff" {...strokeProps} />
      <path d="M32 16 L32 52" fill="none" opacity="0.3" {...strokeProps} />
      <circle cx="32" cy="34" r="10" fill="#1dd1a1" {...strokeProps} />
      <path d="M32 24 L32 20 M32 44 L32 48 M22 34 L18 34 M42 34 L46 34" fill="none" {...strokeProps} />
    </>
  )
);

export const VomitIcon = ({ className }: { className?: string }) => (
  BaseSvg({ className },
    <>
      <path d="M32 44 C20 44 12 36 12 24 C12 12 20 8 32 8 C44 8 52 12 52 24 C52 36 44 44 32 44 Z" fill="#f8c291" {...strokeProps} />
      <path d="M24 20 L28 24 M40 20 L36 24" fill="none" {...strokeProps} />
      <path d="M32 36 C36 36 38 44 34 50 C30 56 36 60 32 60 C28 60 34 56 30 50 C26 44 28 36 32 36 Z" fill="#1dd1a1" {...strokeProps} />
    </>
  )
);

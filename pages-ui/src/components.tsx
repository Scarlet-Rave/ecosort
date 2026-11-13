import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconName =
  | "leaf"
  | "arrow"
  | "upload"
  | "scan"
  | "check"
  | "chevron"
  | "info"
  | "close"
  | "refresh"
  | "shield"
  | "spark"
  | "cardboard"
  | "glass"
  | "metal"
  | "paper"
  | "plastic"
  | "trash";

const paths: Record<IconName, ReactNode> = {
  leaf: (
    <>
      <path d="M20 4c-8-1-15 2-15 9a6 6 0 0 0 6 6c7 0 10-7 9-15Z" />
      <path d="M4 21 15 10M9 16v-5M9 16h5" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" />
    </>
  ),
  scan: (
    <>
      <path d="M8 3H4v4m12-4h4v4M4 17v4h4m12-4v4h-4M3 12h18" />
      <path d="m9 9 3-2 3 2v6l-3 2-3-2Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.1" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  refresh: (
    <>
      <path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
    </>
  ),
  cardboard: (
    <>
      <path d="m3 8 9-5 9 5v10l-9 4-9-4ZM3 8l9 5 9-5M12 13v9M7 5.8l10 5v5l-4-2" />
    </>
  ),
  glass: (
    <>
      <path d="M9 3h6M10 3v5l-4 6v6c0 1 2 2 6 2s6-1 6-2v-6l-4-6V3M7 13h10M9 16v3" />
    </>
  ),
  metal: (
    <>
      <ellipse cx="12" cy="5" rx="6" ry="2.5" />
      <path d="M6 5v14c0 3 12 3 12 0V5M6 9c3 2 9 2 12 0M6 17c3 2 9 2 12 0M9 12h6m-6 2h6" />
    </>
  ),
  paper: (
    <>
      <path d="M6 2h9l5 5v15H6ZM15 2v6h5M3 6v15M9 12h8m-8 4h8m-8 3h5" />
    </>
  ),
  plastic: (
    <>
      <path d="M9 2h6v4H9ZM9 6v3l-3 4v7c0 3 12 3 12 0v-7l-3-4V6M6 14h12M6 18h12M10 10h4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
  children: ReactNode;
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Notice({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <div className={`notice ${warning ? "notice-warning" : ""}`} role={warning ? "alert" : "note"}>
      <Icon name="info" size={19} />
      <div>{children}</div>
    </div>
  );
}

export function MaterialArt({ type, large = false }: { type: IconName; large?: boolean }) {
  return (
    <span className={`material-art material-${type} ${large ? "art-large" : ""}`}>
      <Icon name={type} size={large ? 58 : 31} />
    </span>
  );
}

export function EmptyIllustration() {
  return (
    <svg className="empty-illustration" viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <ellipse cx="120" cy="145" rx="83" ry="7" fill="#E8EDDF" />
      <circle cx="120" cy="77" r="64" fill="#F0F3E8" />
      <path d="M83 80h74l-7 63H90Z" fill="#DAE7C9" stroke="#5D7A4D" strokeWidth="1.5" />
      <path d="M78 74h84v9H78z" fill="#EBF0E3" stroke="#5D7A4D" strokeWidth="1.5" />
      <path
        d="M107 72v-7h26v7M106 96v31m14-31v31m14-31v31"
        stroke="#5D7A4D"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g transform="rotate(-19 80 49)">
        <rect
          x="65"
          y="20"
          width="25"
          height="39"
          rx="4"
          fill="#F5F3E7"
          stroke="#8C9874"
          strokeWidth="1.4"
        />
        <path d="M72 29h11m-11 7h11m-11 7h7" stroke="#8C9874" strokeWidth="1.4" />
      </g>
      <g transform="rotate(18 151 40)">
        <path
          d="M146 14h10v9l7 10v20h-24V33l7-10Z"
          fill="#D6E7C7"
          stroke="#6D8A56"
          strokeWidth="1.4"
        />
        <path d="M145 13h12v6h-12zM140 36h21m-21 10h21" stroke="#6D8A56" strokeWidth="1.4" />
      </g>
      <path
        d="M183 110c-5-21 1-34 18-37 1 15-4 27-18 37ZM183 111c-12-5-17-12-15-22 12 3 17 11 15 22ZM182 123V99"
        fill="#BBD794"
        stroke="#6D8A56"
        strokeWidth="1.4"
      />
      <path
        d="m49 88 3-6 3 6 6 3-6 3-3 6-3-6-6-3ZM185 37v8m-4-4h8M61 120v6m-3-3h6"
        stroke="#91A477"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

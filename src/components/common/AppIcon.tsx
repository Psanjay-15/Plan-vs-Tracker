type IconName =
  | "actuals"
  | "brand"
  | "categories"
  | "category"
  | "lock"
  | "overview"
  | "plans"
  | "report"
  | "target"
  | "unlock"
  | "user"
  | "variance"
  | "wallet";

interface AppIconProps {
  name: IconName;
  size?: number;
}

export function AppIcon({ name, size = 18 }: AppIconProps) {
  const content = (() => {
    switch (name) {
      case "brand":
        return (
          <>
            <path d="M4 19V11" />
            <path d="M10 19V5" />
            <path d="M16 19v-6" />
            <path d="M3 19h18" />
          </>
        );
      case "overview":
        return (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </>
        );
      case "plans":
        return (
          <>
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 4.5V3h6v1.5" />
            <path d="M9 10h6M9 14h6M9 18h4" />
          </>
        );
      case "actuals":
        return (
          <>
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
            <path d="M9 8h6M9 12h6M9 16h3" />
          </>
        );
      case "report":
        return (
          <>
            <path d="M4 20V5M4 20h16" />
            <path d="m7 15 4-4 3 2 5-6" />
          </>
        );
      case "lock":
        return (
          <>
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <path d="M12 14v3" />
          </>
        );
      case "unlock":
        return (
          <>
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 7.4-2.1" />
            <path d="M12 14v3" />
          </>
        );
      case "categories":
      case "category":
        return (
          <>
            <path d="M20 13.2 13.2 20a2 2 0 0 1-2.8 0L3 12.6V3h9.6l7.4 7.4a2 2 0 0 1 0 2.8Z" />
            <circle cx="8" cy="8" r="1.5" />
          </>
        );
      case "user":
        return (
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
          </>
        );
      case "target":
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1" />
          </>
        );
      case "wallet":
        return (
          <>
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V6.5Z" />
            <path d="M4 8h16M15 13h5" />
            <circle cx="15" cy="13" r=".5" />
          </>
        );
      case "variance":
        return (
          <>
            <path d="M5 18 19 4M12 4h7v7" />
            <path d="M5 7v11h11" />
          </>
        );
    }
  })();

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {content}
    </svg>
  );
}

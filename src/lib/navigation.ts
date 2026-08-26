export interface NavItem {
  href: string;
  label: string;
  pageTitle: string;
  eyebrow: string;
  description: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/atlas",
    label: "ATLAS",
    pageTitle: "FRA ATLAS",
    eyebrow: "Spatial WebGIS Engine",
    description: "Spatial intelligence for FRA claims, verification and monitoring across study states.",
  },
  {
    href: "/admin",
    label: "ADMIN",
    pageTitle: "ADMINISTRATOR CONSOLE",
    eyebrow: "Executive Command & Decision Center",
    description: "Authorize, verify, and resolve Forest Rights Act title requests with audit trail logging.",
  },
  {
    href: "/dashboard",
    label: "DASHBOARD",
    pageTitle: "ANALYTICS DASHBOARD",
    eyebrow: "State & National Telemetry",
    description: "Real-time state and national metrics computed directly from registered claims.",
  },
  {
    href: "/digitize",
    label: "DIGITIZE",
    pageTitle: "CLAIM DIGITIZATION",
    eyebrow: "Document Processing Pipeline",
    description: "From scanned physical claim forms to structured, human-verified digital records.",
  },
  {
    href: "/dss",
    label: "DSS",
    pageTitle: "DECISION SUPPORT SYSTEM",
    eyebrow: "Explainable Scheme Engine",
    description: "Deterministic, explainable rule engine matching titleholders to government schemes.",
  },
  {
    href: "/schemes",
    label: "SCHEMES",
    pageTitle: "SCHEME CONVERGENCE",
    eyebrow: "Cross-Ministerial Welfare",
    description: "Unlock Post-Title scheme benefits across PM-KISAN, MGNREGA, JJM, and DAJGUA.",
  },
  {
    href: "/research",
    label: "RESEARCH",
    pageTitle: "RESEARCH & EVIDENCE",
    eyebrow: "Empirical Studies & Publications",
    description: "Published research, empirical benchmarks, and comparative state implementation analysis.",
  },
];

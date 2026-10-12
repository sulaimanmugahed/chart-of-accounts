import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={18}
      height={18}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m3 10.5 9-7 9 7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Icon>
)

export const BuildingIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
    <path d="M15 9h3a2 2 0 0 1 2 2v10" />
    <path d="M3 21h18" />
    <path d="M8 7h3M8 11h3M8 15h3" />
  </Icon>
)

export const LayersIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  </Icon>
)

export const TreeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 3v10a3 3 0 0 0 3 3h6" />
    <path d="M4 8h6" />
    <rect x="12" y="2" width="8" height="6" rx="1.5" />
    <rect x="12" y="11" width="8" height="6" rx="1.5" />
    <rect x="12" y="19" width="8" height="3" rx="1.5" />
  </Icon>
)

export const SparklesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </Icon>
)

export const LinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 4.9" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.1a5 5 0 0 0 7.07 7.07L13 19.1" />
  </Icon>
)

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const PencilIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
)

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    <path d="M10 11v5M14 11v5" />
  </Icon>
)

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
)

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
)

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
)

export const ChevronsUpDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
  </Icon>
)

export const ArrowUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
)

export const ArrowDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Icon>
)

export const XIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
)

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m20 6-11 11-5-5" />
  </Icon>
)

export const AlertTriangleIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Icon>
)

export const InfoIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-5M12 8h.01" />
  </Icon>
)

export const RefreshIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Icon>
)

export const ColumnsIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16M15 4v16" />
  </Icon>
)

export const FilterIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 5h16l-6 7v6l-4 2v-8Z" />
  </Icon>
)

export const LockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
)

export const UnlockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 7.5-2" />
  </Icon>
)

export const ShieldIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
)

export const WalletIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M16 12h3" />
  </Icon>
)

export const FileTextIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
    <path d="M14 3v5h5M14 3l5 5v3" />
    <path d="M9 13h5M9 17h4" />
  </Icon>
)

export const HistoryIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 8v4l3 2" />
  </Icon>
)

export const SlidersIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="7" cy="18" r="2" />
  </Icon>
)

export const CheckCircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </Icon>
)

export const XCircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Icon>
)

export const DatabaseIcon = (props: IconProps) => (
  <Icon {...props}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </Icon>
)

export const PlayIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 4.5v15l12-7.5Z" />
  </Icon>
)

export const EyeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const ExternalLinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
)

export const ListIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </Icon>
)

export const CoinsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9" cy="9" r="6" />
    <path d="M15.5 4.3a6 6 0 0 1 0 11.4" />
    <path d="M8 22c3.3 0 6-2.7 6-6" />
  </Icon>
)

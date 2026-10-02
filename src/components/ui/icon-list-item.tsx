import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

export interface IconListItemProps extends React.ComponentProps<"li"> {
  /** Iconify icon name, e.g. "lucide:check". */
  icon: string;
  iconClassName?: string;
}

/** A list item with a leading icon — for feature lists, checklists, contact details. Use inside a `<ul>`. */
export function IconListItem({ icon, iconClassName, children, className, ...props }: IconListItemProps) {
  return (
    <li className={cn("flex items-start gap-2", className)} {...props}>
      <Icon icon={icon} className={cn("mt-0.5 size-5 shrink-0 text-primary", iconClassName)} aria-hidden="true" />
      <div className="flex-1 space-y-1">{children}</div>
    </li>
  );
}

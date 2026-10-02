import Link from "next/link";
import { Icon } from "@iconify/react";

import type { CalendarCategories, CalendarEvent, CalendarLabels } from "@/lib/calendar/types";
import {
  DEFAULT_CALENDAR_LABELS,
  formatEventWhen,
  getCategoryColorClass,
  getEventColorClasses,
  isExternalUrl,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

export type EventCardProps<TMeta = unknown> = {
  event: CalendarEvent<TMeta>;
  categories?: CalendarCategories;
  labels?: Partial<CalendarLabels>;
  /** Show the image (or icon placeholder) banner. Defaults to true when the event has an image. */
  showMedia?: boolean;
  className?: string;
};

/** Read-only event details: media, when, title, category, description, location and link. */
export function EventCard<TMeta = unknown>({ event, categories, labels, showMedia, className }: EventCardProps<TMeta>) {
  const text = { ...DEFAULT_CALENDAR_LABELS, ...labels };
  const category = event.category ? categories?.[event.category] : undefined;
  const colors = getEventColorClasses(event, categories);
  const external = event.url ? isExternalUrl(event.url) : false;
  const media = showMedia ?? !!event.imageUrl;
  const linkClass = "inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline";
  const linkContent = (
    <>
      {event.urlLabel ?? text.learnMore}
      <Icon icon={external ? "lucide:arrow-up-right" : "lucide:arrow-right"} className="size-3.5" aria-hidden="true" />
    </>
  );

  return (
    <article className={cn("flex flex-col gap-3", className)}>
      {media && (
        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary consumer-supplied hosts; next/image would need each one allow-listed
            <img src={event.imageUrl} alt={event.imageAlt ?? ""} loading="lazy" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Icon icon="lucide:calendar" className="size-10" aria-hidden="true" />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{formatEventWhen(event, { withYear: true })}</p>
        <h3 className="text-lg font-semibold leading-snug text-foreground">{event.title}</h3>
        {category && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={cn("size-2 rounded-full", event.color ? colors.bar : getCategoryColorClass(category))} />
            {category.label}
          </p>
        )}
      </div>

      {event.location && (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Icon icon="lucide:map-pin" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {event.location}
        </p>
      )}

      {event.description && <p className="whitespace-pre-line text-sm text-foreground">{event.description}</p>}

      {event.url &&
        (external ? (
          <a href={event.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {linkContent}
          </a>
        ) : (
          <Link href={event.url} className={linkClass}>
            {linkContent}
          </Link>
        ))}
    </article>
  );
}

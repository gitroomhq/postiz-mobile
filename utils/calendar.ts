import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getHours,
  parseISO,
  set,
  isBefore,
} from "date-fns";
import type { CalendarDay, ScheduledPost, TimeSlot } from "@/types";

/** Generate the grid of days for a given month (Monday-start weeks). */
export function getCalendarDays(
  month: Date,
  selectedDate: Date,
  postsMap: Map<string, ScheduledPost[]>,
): CalendarDay[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(
    (date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      return {
        date,
        isCurrentMonth: isSameMonth(date, month),
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate),
        hasEvents: postsMap.has(dateKey),
      };
    },
  );
}

/** Group posts by date key (yyyy-MM-dd). */
export function groupPostsByDate(
  posts: ScheduledPost[],
): Map<string, ScheduledPost[]> {
  const map = new Map<string, ScheduledPost[]>();
  for (const post of posts) {
    const key = format(parseISO(post.scheduledAt), "yyyy-MM-dd");
    const existing = map.get(key) || [];
    existing.push(post);
    map.set(key, existing);
  }
  return map;
}

/** Get posts for a specific date, sorted by time. */
export function getPostsForDate(
  posts: ScheduledPost[],
  date: Date,
): ScheduledPost[] {
  return posts
    .filter((p) => isSameDay(parseISO(p.scheduledAt), date))
    .sort(
      (a, b) =>
        parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime(),
    );
}

/** Generate time slots from startHour to endHour. */
export function generateTimeSlots(
  startHour: number = 0,
  endHour: number = 23,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const ampm = h < 12 ? "am" : "pm";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push({
      hour: h,
      label: `${hour12}:00 ${ampm}`,
    });
  }
  return slots;
}

/** Get the hour (0-23) from a post's scheduledAt. */
export function getPostHour(post: ScheduledPost): number {
  return getHours(parseISO(post.scheduledAt));
}

/** Format date for display: "Wed, 24 Feb" */
export function formatSelectedDate(date: Date): string {
  return format(date, "EEE, d MMM");
}

/** Format date for detail display: "February 26, 2026 9:00 am" */
export function formatPostDateTime(isoString: string): string {
  return format(parseISO(isoString), "MMMM d, yyyy h:mm a")
    .replace(/ AM$/, " am")
    .replace(/ PM$/, " pm");
}

/** Format month name: "February" */
export function formatMonthName(date: Date): string {
  return format(date, "MMMM");
}

/** Check if a date is in the past. */
export function isDatePassed(date: Date): boolean {
  return isBefore(date, new Date());
}

export { addMonths, subMonths, isSameDay, parseISO, format, set };

import type { NotificationItem } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format a date as "29 March, 2026" for notification items. */
function formatNotifDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`;
}

/** Format a date as a section title ("Today", "Yesterday", or "March 26"). */
function dayTitle(daysOffset: number): string {
  if (daysOffset === 0) return "Today";
  if (daysOffset === -1) return "Yesterday";
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export const NOTIFICATIONS_BY_DAY: { title: string; items: NotificationItem[] }[] = [
  {
    title: dayTitle(0),
    items: [
      {
        id: "today-1",
        social: "x",
        avatar: "https://i.pravatar.cc/64?img=11",
        networkLabel: "X",
        link: "https://twitter.com/wichedguro/st...",
        date: formatNotifDate(0),
        time: "10:30 am",
        unread: true,
      },
      {
        id: "today-2",
        social: "instagram",
        avatar: "https://i.pravatar.cc/64?img=16",
        networkLabel: "Instagram",
        link: "https://instagram.com/p/abc...",
        date: formatNotifDate(0),
        time: "9:15 am",
        unread: true,
      },
      {
        id: "today-3",
        social: "tiktok",
        avatar: "https://i.pravatar.cc/64?img=17",
        networkLabel: "Tiktok",
        link: "https://tiktok.com/tiktok...",
        date: formatNotifDate(0),
        time: "8:00 am",
        unread: true,
      },
    ],
  },
  {
    title: dayTitle(-1),
    items: [
      {
        id: "yesterday-1",
        social: "tiktok",
        avatar: "https://i.pravatar.cc/64?img=12",
        networkLabel: "Tiktok",
        link: "https://tiktok.com/tiktok...",
        date: formatNotifDate(-1),
        time: "10:30 am",
        unread: false,
      },
      {
        id: "yesterday-2",
        social: "instagram",
        avatar: "https://i.pravatar.cc/64?img=13",
        networkLabel: "Instagram",
        link: "https://instagram.com...",
        date: formatNotifDate(-1),
        time: "10:30 am",
        unread: false,
      },
      {
        id: "yesterday-3",
        social: "x",
        avatar: "https://i.pravatar.cc/64?img=18",
        networkLabel: "X",
        link: "https://twitter.com/wichedguro/po...",
        date: formatNotifDate(-1),
        time: "3:45 pm",
        unread: false,
      },
    ],
  },
  {
    title: dayTitle(-2),
    items: [
      {
        id: "2daysago-1",
        social: "pinterest",
        avatar: "https://i.pravatar.cc/64?img=14",
        networkLabel: "Pinterest",
        link: "https://pinterest.com/...",
        date: formatNotifDate(-2),
        time: "10:30 am",
        unread: false,
      },
      {
        id: "2daysago-2",
        social: "tiktok",
        avatar: "https://i.pravatar.cc/64?img=15",
        networkLabel: "Tiktok",
        link: "https://tiktok.com/tiktok...",
        date: formatNotifDate(-2),
        time: "10:30 am",
        unread: false,
      },
    ],
  },
  {
    title: dayTitle(-4),
    items: [
      {
        id: "4daysago-1",
        social: "x",
        avatar: "https://i.pravatar.cc/64?img=19",
        networkLabel: "X",
        link: "https://twitter.com/wichedguro/st...",
        date: formatNotifDate(-4),
        time: "2:00 pm",
        unread: false,
      },
      {
        id: "4daysago-2",
        social: "instagram",
        avatar: "https://i.pravatar.cc/64?img=20",
        networkLabel: "Instagram",
        link: "https://instagram.com/p/xyz...",
        date: formatNotifDate(-4),
        time: "11:30 am",
        unread: false,
      },
      {
        id: "4daysago-3",
        social: "pinterest",
        avatar: "https://i.pravatar.cc/64?img=21",
        networkLabel: "Pinterest",
        link: "https://pinterest.com/pin/...",
        date: formatNotifDate(-4),
        time: "9:00 am",
        unread: false,
      },
    ],
  },
];

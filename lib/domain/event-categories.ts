import type { EventCategory } from "./models";
export const EVENT_CATEGORIES: Record<EventCategory, string> = {
  "career-networking": "Career & Networking",
  "professional-development": "Professional Development",
  "technical-workshop": "Technical Workshops",
  "general-body-meeting": "General Body Meetings",
  competition: "Competitions",
  "social-recreational": "Social & Recreational",
};
export const CATEGORY_DESCRIPTIONS: Record<EventCategory, string> = {
  "career-networking":
    "Employer sessions, career fairs, alumni and professional networking.",
  "professional-development":
    "Resume, interview, leadership and professional skills.",
  "technical-workshop":
    "Hands-on engineering, software, design and educational technical seminars.",
  "general-body-meeting":
    "Membership updates, organization announcements and regular meetings.",
  competition:
    "Hackathons, design challenges, case competitions and technical contests.",
  "social-recreational":
    "Mixers, games, outings and community-building activities.",
};
export const categoryLabel = (category: EventCategory | null) =>
  category ? EVENT_CATEGORIES[category] : "Category under review";

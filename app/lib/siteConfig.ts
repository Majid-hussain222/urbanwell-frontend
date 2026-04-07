export type NavItem = {
  label: string;
  href: string;
};

export const marketingNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Trainers", href: "/trainers" },
  { label: "Nutritionists", href: "/nutritionists" },
  { label: "Gym Packages", href: "/gym-packages" },
  { label: "Meal Plans", href: "/meals" },
  { label: "Supplements", href: "/supplements" },
  { label: "Articles", href: "/articles" },
];

export const heroStats = [
  { value: "25K+", label: "Wellness actions tracked" },
  { value: "97%", label: "Goal adherence support" },
  { value: "24/7", label: "AI guidance layer" },
  { value: "1", label: "Unified health ecosystem" },
];

export const featureCards = [
  {
    eyebrow: "AI Intelligence",
    title: "A wellness engine, not just a dashboard.",
    description:
      "UrbanWell combines workouts, nutrition, coaches, progress analytics, and smart recommendations into one premium health experience.",
    accent: "var(--lime)",
  },
  {
    eyebrow: "Real Experts",
    title: "Certified trainers and nutrition support.",
    description:
      "Connect users with trusted professionals, guided sessions, and personalized recommendations that extend beyond generic fitness content.",
    accent: "var(--cyan)",
  },
  {
    eyebrow: "Data-Driven Progress",
    title: "Turn daily inputs into actionable health insight.",
    description:
      "Track streaks, body metrics, performance trends, bookings, plans, and habits through one clean operating layer.",
    accent: "var(--violet)",
  },
];

export const moduleCards = [
  {
    title: "AI Workout Generator",
    href: "/workouts/generate",
    badge: "Core Engine",
    description:
      "Generate personalized workout plans based on user goals, level, training style, and preferred intensity.",
  },
  {
    title: "Meal Plans",
    href: "/meals",
    badge: "Nutrition",
    description:
      "Build premium meal experiences with calories, macros, meal slots, AI recommendations, and saved plans.",
  },
  {
    title: "Supplements",
    href: "/supplements",
    badge: "Performance",
    description:
      "Create a trusted supplement discovery flow with filters, recommendations, dosage guidance, and safety messaging.",
  },
  {
    title: "Articles",
    href: "/articles",
    badge: "Content Hub",
    description:
      "Turn UrbanWell into a wellness publishing platform with editorial content, education, and evergreen discovery.",
  },
  {
    title: "Bookings",
    href: "/bookings",
    badge: "Appointments",
    description:
      "Manage coaching sessions, nutrition consults, status tracking, and user-friendly scheduling from one place.",
  },
  {
    title: "Progress Tracker",
    href: "/progress",
    badge: "Analytics",
    description:
      "Visualize consistency, logged activity, body progress, goals, milestones, and long-term transformation trends.",
  },
];

export const transformationPoints = [
  "Unified premium UX across public and protected pages",
  "Auth-aware navigation so logged-in users land in the right place",
  "A stronger homepage positioned like a serious wellness SaaS",
  "Deeper discoverability for trainers, meals, supplements, and articles",
];
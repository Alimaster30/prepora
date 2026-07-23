import { themeColors } from "@/lib/utils";
import type { ResumeLayoutId } from "@/lib/resume-layouts";

export type ResumeTemplateId = "blank" | "software-engineer" | "marketing" | "new-graduate" | "designer";

export type ResumeTemplateExperience = {
  title: string;
  companyName: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  workSummary: string;
};

export type ResumeTemplateEducation = {
  universityName: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ResumeTemplateSkill = { name: string; rating: number };

export type ResumeTemplateData = {
  id: ResumeTemplateId;
  label: string;
  description: string;
  /** Lucide icon name for UI */
  icon: "FileText" | "Code2" | "Megaphone" | "GraduationCap" | "Palette";
  /** Default visual layout in the builder / PDF */
  resumeLayoutId: ResumeLayoutId;
  themeColor: string;
  personal: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    address: string;
    phone: string;
    email: string;
  };
  summary: string;
  experience: ResumeTemplateExperience[];
  education: ResumeTemplateEducation[];
  skills: ResumeTemplateSkill[];
};

const PLACEHOLDER_EMAIL = "you@example.com";
const PLACEHOLDER_PHONE = "+15551234567";
const PLACEHOLDER_ADDRESS = "123 Main Street, San Francisco, CA 94102";

export const RESUME_TEMPLATES: ResumeTemplateData[] = [
  {
    id: "blank",
    label: "Blank",
    description: "Start from scratch with only your resume title.",
    icon: "FileText",
    resumeLayoutId: "classic",
    themeColor: themeColors[0],
    personal: {
      firstName: "",
      lastName: "",
      jobTitle: "",
      address: "",
      phone: "",
      email: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
  },
  {
    id: "software-engineer",
    label: "Software Engineer",
    description: "Technical summary, engineering experience, and core stack skills.",
    icon: "Code2",
    resumeLayoutId: "modern",
    themeColor: "#6366f1",
    personal: {
      firstName: "Alex",
      lastName: "Rivera",
      jobTitle: "Senior Software Engineer",
      address: PLACEHOLDER_ADDRESS,
      phone: PLACEHOLDER_PHONE,
      email: PLACEHOLDER_EMAIL,
    },
    summary:
      "Full-stack engineer with 5+ years building scalable web applications. Passionate about clean architecture, performance, and mentoring junior developers. Experienced with cloud infrastructure and agile delivery.",
    experience: [
      {
        title: "Senior Software Engineer",
        companyName: "Northwind Labs",
        city: "San Francisco",
        state: "CA",
        startDate: "2021-03-01",
        endDate: "",
        workSummary:
          "<p>Designed and shipped customer-facing features for a SaaS analytics platform serving 50k+ weekly active users.</p><p>Led migration of legacy APIs to Node.js microservices, reducing p95 latency by 35%.</p><p>Mentored three engineers through code reviews, pairing sessions, and quarterly goal planning.</p>",
      },
      {
        title: "Software Engineer",
        companyName: "Blue Harbor Tech",
        city: "Oakland",
        state: "CA",
        startDate: "2018-06-01",
        endDate: "2021-02-28",
        workSummary:
          "<p>Built responsive React dashboards and REST APIs using TypeScript and PostgreSQL.</p><p>Improved CI/CD pipelines with GitHub Actions, cutting release cycle time in half.</p>",
      },
    ],
    education: [
      {
        universityName: "State University",
        degree: "Bachelor of Science",
        major: "Computer Science",
        startDate: "2014-09-01",
        endDate: "2018-05-15",
        description:
          "Coursework in algorithms, distributed systems, and databases. Capstone: real-time collaboration tool with WebSockets.",
      },
    ],
    skills: [
      { name: "TypeScript", rating: 5 },
      { name: "React", rating: 5 },
      { name: "Node.js", rating: 4 },
      { name: "PostgreSQL", rating: 4 },
      { name: "AWS", rating: 3 },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Campaigns, growth metrics, and brand-focused experience.",
    icon: "Megaphone",
    resumeLayoutId: "executive",
    themeColor: "#a855f7",
    personal: {
      firstName: "Jordan",
      lastName: "Lee",
      jobTitle: "Marketing Manager",
      address: PLACEHOLDER_ADDRESS,
      phone: PLACEHOLDER_PHONE,
      email: PLACEHOLDER_EMAIL,
    },
    summary:
      "Data-driven marketer with experience across demand generation, content strategy, and cross-channel campaigns. Comfortable owning funnel metrics from awareness through conversion and partnering with sales and product teams.",
    experience: [
      {
        title: "Marketing Manager",
        companyName: "Summit Consumer Brands",
        city: "Chicago",
        state: "IL",
        startDate: "2020-01-06",
        endDate: "",
        workSummary:
          "<p>Managed a $2M annual paid media budget across search, social, and programmatic channels.</p><p>Launched lifecycle email programs that improved trial-to-paid conversion by 18% quarter over quarter.</p><p>Partnered with product marketing on GTM plans for two major product releases.</p>",
      },
      {
        title: "Marketing Specialist",
        companyName: "Brightline Media",
        city: "Chicago",
        state: "IL",
        startDate: "2017-05-15",
        endDate: "2019-12-20",
        workSummary:
          "<p>Owned social content calendar and community engagement for a mid-market B2B brand.</p><p>Produced webinars and case studies that generated qualified pipeline for enterprise sales.</p>",
      },
    ],
    education: [
      {
        universityName: "Midwest College",
        degree: "Bachelor of Arts",
        major: "Communications",
        startDate: "2013-08-20",
        endDate: "2017-05-10",
        description:
          "Focus on digital media and strategic communication. President of the student advertising club.",
      },
    ],
    skills: [
      { name: "Google Analytics", rating: 5 },
      { name: "SEO", rating: 4 },
      { name: "Content strategy", rating: 5 },
      { name: "HubSpot", rating: 4 },
      { name: "Campaign reporting", rating: 4 },
    ],
  },
  {
    id: "new-graduate",
    label: "New Graduate",
    description: "Education-forward layout with internships and projects.",
    icon: "GraduationCap",
    resumeLayoutId: "minimal",
    themeColor: "#0ea5e9",
    personal: {
      firstName: "Sam",
      lastName: "Patel",
      jobTitle: "Recent Graduate — Open to Roles",
      address: PLACEHOLDER_ADDRESS,
      phone: PLACEHOLDER_PHONE,
      email: PLACEHOLDER_EMAIL,
    },
    summary:
      "Motivated recent graduate with strong analytical skills and hands-on experience from internships and academic projects. Eager to contribute to a collaborative team and grow in a full-time role.",
    experience: [
      {
        title: "Software Engineering Intern",
        companyName: "City Health Systems",
        city: "Boston",
        state: "MA",
        startDate: "2023-06-01",
        endDate: "2023-08-15",
        workSummary:
          "<p>Implemented internal tooling dashboards using React and helped document API endpoints for the engineering wiki.</p><p>Participated in daily standups and sprint planning with a team of twelve engineers.</p>",
      },
    ],
    education: [
      {
        universityName: "Riverside University",
        degree: "Bachelor of Science",
        major: "Information Systems",
        startDate: "2020-09-01",
        endDate: "2024-05-20",
        description:
          "GPA 3.7. Relevant coursework: data structures, web development, databases, and UX design. Senior project: campus event scheduling app used by student organizations.",
      },
    ],
    skills: [
      { name: "Python", rating: 4 },
      { name: "JavaScript", rating: 4 },
      { name: "SQL", rating: 3 },
      { name: "Team collaboration", rating: 5 },
      { name: "Public speaking", rating: 4 },
    ],
  },
  {
    id: "designer",
    label: "Designer",
    description: "UX/UI focus with portfolio-friendly project bullets.",
    icon: "Palette",
    resumeLayoutId: "modern",
    themeColor: "#ec4899",
    personal: {
      firstName: "Riley",
      lastName: "Nguyen",
      jobTitle: "Product Designer",
      address: PLACEHOLDER_ADDRESS,
      phone: PLACEHOLDER_PHONE,
      email: PLACEHOLDER_EMAIL,
    },
    summary:
      "Product designer specializing in end-to-end UX for complex workflows. Comfortable from discovery research through high-fidelity UI and handoff to engineering. Advocate for accessible, inclusive design systems.",
    experience: [
      {
        title: "Product Designer",
        companyName: "Parallel Design Co.",
        city: "Austin",
        state: "TX",
        startDate: "2021-04-01",
        endDate: "",
        workSummary:
          "<p>Redesigned onboarding for a fintech product, improving completion rates by 22% in usability testing.</p><p>Maintained Figma design system used by designers and engineers across three squads.</p><p>Ran weekly design critiques and partnered with PMs to prioritize roadmap experiments.</p>",
      },
      {
        title: "UX Designer",
        companyName: "Studio Meridian",
        city: "Austin",
        state: "TX",
        startDate: "2019-01-07",
        endDate: "2021-03-15",
        workSummary:
          "<p>Delivered mobile and web flows for e-commerce clients in retail and wellness verticals.</p><p>Created interactive prototypes for stakeholder reviews and developer handoff.</p>",
      },
    ],
    education: [
      {
        universityName: "School of Design & Technology",
        degree: "Bachelor of Fine Arts",
        major: "Interaction Design",
        startDate: "2015-09-01",
        endDate: "2019-05-12",
        description:
          "Studio-focused program covering visual design, prototyping, and human-centered research methods.",
      },
    ],
    skills: [
      { name: "Figma", rating: 5 },
      { name: "User research", rating: 4 },
      { name: "Prototyping", rating: 5 },
      { name: "Design systems", rating: 4 },
      { name: "Accessibility", rating: 4 },
    ],
  },
];

export function getResumeTemplateById(
  id: string
): ResumeTemplateData | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id);
}

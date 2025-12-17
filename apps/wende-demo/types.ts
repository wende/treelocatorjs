export interface Experience {
  role: string;
  company: string;
  location: string;
  period: string;
  description: string;
  responsibilities: string[];
}

export interface Project {
  name: string;
  description: string;
  stats?: string;
  link?: string;
}

export interface Skill {
  category: string;
  items: string[];
}
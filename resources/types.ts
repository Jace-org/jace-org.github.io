
export interface Skill {
  name: string;
  proficiency: number;
}

export interface Project {
  title: string;
  description: string;
  image: string;
  tags: string[];
}

export interface Education {
  degree: string;
  institution: string;
  status: string;
}

export interface ResourceFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'archive' | 'script' | 'image';
  size: string;
  date: string;
  category: string;
}

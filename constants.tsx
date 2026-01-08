
import { Skill, Project, Education, ResourceFile } from './types';

export const SKILLS: Skill[] = [
  { name: 'Full Stack Dev', proficiency: 98 },
  { name: 'Network Architect', proficiency: 92 },
  { name: 'Server Configuration, Optimization, and Troubleshooting', proficiency: 90 },
  { name: 'Linux/Windows Server Setup, Configuration, and Administration', proficiency: 94 },
  { name: 'React & Modern Frontend', proficiency: 95 },
  { name: 'PHP (Core) & MySQL', proficiency: 95 },
  { name: 'Python & Automation', proficiency: 75 },
  { name: 'Cybersecurity & Auditing', proficiency: 40 },
];

export const PROJECTS: Project[] = [
  {
    title: 'Family Heredity Tree',
    description: 'A socio-media integrated application for tracking lineage and family history with social features.',
    image: 'https://picsum.photos/seed/family/600/400',
    tags: ['PHP', 'MySQL', 'Social API']
  },
  {
    title: 'Notes Sharing Platform',
    description: 'A collaborative environment for students and professionals to share and manage digital notes.',
    image: 'https://picsum.photos/seed/notes/600/400',
    tags: ['React', 'Node.js', 'PostgreSQL']
  },
  {
    title: 'Eco Web Platform',
    description: 'A fully production-ready marketplace for sustainable and ecological products.',
    image: 'https://picsum.photos/seed/eco/600/400',
    tags: ['E-commerce', 'React', 'Firebase']
  },
  {
    title: 'Kandel Holdings',
    description: 'A sophisticated personal financial activity tracker and asset management dashboard.',
    image: 'https://picsum.photos/seed/finance/600/400',
    tags: ['Dashboard', 'Python', 'Chart.js']
  },
];

export const EDUCATION: Education = {
  degree: 'Bachelor BSc (Hons) in Cybersecurity and Ethical Hacking',
  institution: 'Computing & IT Faculty',
  status: 'Currently Pursuing'
};

export const RESOURCES: ResourceFile[] = [
  { id: '1', name: 'Network_Security_Audit_v1.pdf', type: 'pdf', size: '2.4 MB', date: '2024-03-15', category: 'Security' },
  { id: '2', name: 'Server_Hardening_Checklist.doc', type: 'doc', size: '850 KB', date: '2024-02-10', category: 'Infrastructure' },
  { id: '3', name: 'FullStack_Architecture_Ref.archive', type: 'archive', size: '12.1 MB', date: '2024-04-01', category: 'Dev' },
  { id: '4', name: 'Auto_Optimization_Script.script', type: 'script', size: '12 KB', date: '2024-05-12', category: 'Automation' },
  { id: '5', name: 'Project_Uki_Diagram.image', type: 'image', size: '4.2 MB', date: '2024-01-20', category: 'Design' },
  { id: '6', name: 'Linux_Kernel_Tuning.pdf', type: 'pdf', size: '1.8 MB', date: '2024-05-20', category: 'Server' },
];

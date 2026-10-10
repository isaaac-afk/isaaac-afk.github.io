export interface Project {
  id: string;
  title: string;
  field: string;
  description: string;
  details: string;
  tags: string[];
  url: string;
  linkLabel: string;
  component: string;
  sources: string[];
}

export interface Experience {
  organization: string;
  role: string;
  dates: string;
  summary: string;
  tags: string[];
}

export const profile = {
  name: 'Isaac Glenu',
  email: 'isaacglenu@gmail.com',
  github: 'https://github.com/isaaac-afk',
  linkedin: 'https://www.linkedin.com/in/isaac-glenu7',
  tagline: 'Toward surgical robotics.',
  // Shown in the hero beside the pulsing status light. Edit this one string to update it.
  currentlyBuilding: 'real-time ECG arrhythmia detection on STM32',
};

export const experience: Experience[] = [
  {
    organization: 'Upgraded', role: 'Software Engineering Intern', dates: 'MAY–AUG 2026',
    summary: 'Shipped PerfectDraft, an AI grant-writing tool for Ontario innovation programs. Built the Next.js + Supabase stack and the Claude + Composio agent that drafts, retrieves, and revises grant sections end-to-end.',
    tags: ['TypeScript', 'Next.js', 'Supabase', 'Claude API', 'Composio'],
  },
  {
    organization: 'Structural Biomechanics Lab', role: 'Research Assistant', dates: 'SEP 2026–PRESENT',
    summary: 'Supporting grad-student experiments at the University of Waterloo under Prof. Naveen Chandrashekar — hands-on tissue mechanics setup, data collection, and processing.',
    tags: ['Experimental mechanics', 'Data processing'],
  },
  {
    organization: 'Biotron & e-NABLE', role: 'Mechanical Team Member', dates: 'SEP 2025–MAY 2026',
    summary: 'Mechanical design for hip-exoskeleton and prosthetic-hand systems. SolidWorks modelling, FDM fabrication, and iteration with the clinical users.',
    tags: ['SolidWorks', 'FDM', 'Mechanical design'],
  },
  {
    organization: 'Inspirit AI', role: 'ML Researcher', dates: 'MAY–AUG 2024',
    summary: 'Built a scikit-learn pipeline predicting coronary risk from clinical features. First exposure to ML applied to cardiac data — direct line to the arrhythmia work that followed.',
    tags: ['Python', 'scikit-learn', 'Cardiology ML'],
  },
];

export const projects: Project[] = [
  {
    id: 'ecg', title: 'A heartbeat,\nunderstood.', field: 'ECG · Embedded machine learning',
    description: 'Arrhythmia detection built for the constraints of a microcontroller.',
    details: 'An ECG classification pipeline for STM32 deployment, connecting signal processing with embedded inference. The work compares floating-point and int8 models under microcontroller constraints.',
    tags: ['STM32', 'TinyML', 'Signal processing'],
    url: 'https://github.com/isaaac-afk/arrhythmia-detection-mcu', linkLabel: 'View repository',
    component: 'Wrist control board', sources: ['https://github.com/isaaac-afk/arrhythmia-detection-mcu'],
  },
  {
    id: 'emg', title: 'Intent,\ntranslated.', field: 'Surface EMG · Myoelectric control',
    description: 'Classifying hand gestures from surface-EMG signals modeled on public datasets.',
    details: 'A Python pipeline for simulated surface EMG: filtering signals, extracting features, and classifying hand gestures with SciPy and scikit-learn.',
    tags: ['Python', 'SciPy', 'scikit-learn'],
    url: 'https://github.com/isaaac-afk/emg-gesture-classification', linkLabel: 'View repository', component: 'End effector',
    sources: ['https://github.com/isaaac-afk/emg-gesture-classification', 'IsaacRobresCVcombine.pdf', 'IsaacSoftresCV.pdf'],
  },
  {
    id: 'lattice', title: 'Bone,\nmatched.', field: 'Titanium lattice · Biomimetic design',
    description: 'Tuning implant stiffness toward bone to counter stress shielding.',
    details: 'Simple-cubic, octet-truss, and gyroid lattices generated in Python and screened with the Gibson-Ashby scaling law to find the porosity windows that match cortical and trabecular bone. An analytical first pass, with slicer-ready STL exports; FEA is the next step.',
    tags: ['Python', 'Gibson-Ashby', 'Additive manufacturing'],
    url: 'https://github.com/isaaac-afk/porous-implant-lattice-study', linkLabel: 'View repository', component: 'Structural frame',
    sources: ['https://github.com/isaaac-afk/porous-implant-lattice-study'],
  },
  {
    id: 'gait', title: 'Motion,\nmeasured.', field: 'IMU sensor fusion · Biomechanics',
    description: 'Finding structure in the way we walk.',
    details: 'A complementary-filter approach to knee-flexion analysis using HuGaDB sensor data. This single-subject exploration investigates movement patterns; it does not establish clinical validity.',
    tags: ['Python', 'Gait analysis', 'Sensor data'],
    url: 'https://github.com/isaaac-afk/gait-analysis', linkLabel: 'View repository', component: 'Joint sensing',
    sources: ['https://github.com/isaaac-afk/gait-analysis'],
  },
  {
    id: 'skinsight', title: 'Trust,\nbefore accuracy.', field: 'Dermatology ML · Explainability',
    description: 'A skin-lesion classifier that shows its work.',
    details: 'A dermatology lesion classifier (ISIC 2019, EfficientNet-B0) with Grad-CAM explainability and a focus score that flags low-trust predictions. Educational tool, not a diagnostic one.',
    tags: ['Python', 'PyTorch', 'Grad-CAM'],
    url: 'https://github.com/isaaac-afk/skinsight-ai', linkLabel: 'View repository', component: 'Vision head',
    sources: ['https://github.com/isaaac-afk/skinsight-ai'],
  },
];

export const components = [
  ['base', 'Base & drive', 'A grounded foundation for the assembly.'],
  ['shoulder', 'Shoulder joint', 'The first major articulation in the kinematic chain.'],
  ['elbow', 'Elbow joint', 'A rotary joint that extends the instrument workspace.'],
  ['wrist', 'Wrist assembly', 'Fine orientation close to the instrument tip.'],
  ['pcb', 'STM32 control board', 'A conceptual embedded controller for sensing and actuation.'],
  ['jaws', 'Instrument jaws', 'An articulated gripper for the illustrative tool motion.'],
  ['sensors', 'Joint sensors', 'Conceptual sensing modules positioned at the joints.'],
  ['plate', 'Conceptual titanium tool plate', 'A modeled end-effector interface, included as conceptual artwork.'],
] as const;

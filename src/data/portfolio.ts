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

export const profile = {
  name: 'Isaac Glenu',
  email: 'isaacglenu@gmail.com',
  github: 'https://github.com/isaaac-afk',
};

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
    id: 'emg', title: 'Intent,\ninto movement.', field: 'EMG · Pattern recognition',
    description: 'Classifying hand gestures from simulated muscle signals.',
    details: 'A Python pipeline for simulated surface EMG: filtering signals, extracting features, and classifying hand gestures with SciPy and scikit-learn.',
    tags: ['Python', 'SciPy', 'scikit-learn'],
    url: 'https://github.com/isaaac-afk/emg-gesture-classification', linkLabel: 'View repository', component: 'Articulated instrument jaws',
    sources: ['https://github.com/isaaac-afk/emg-gesture-classification', 'IsaacRobresCVcombine.pdf', 'IsaacSoftresCV.pdf'],
  },
  {
    id: 'gait', title: 'Movement,\nmeasured.', field: 'Biomechanics · Data analysis',
    description: 'Finding structure in the way we walk.',
    details: 'A complementary-filter approach to knee-flexion analysis using HuGaDB sensor data. This single-subject exploration investigates movement patterns; it does not establish clinical validity.',
    tags: ['Python', 'Gait analysis', 'Sensor data'],
    url: 'https://github.com/isaaac-afk/gait-analysis', linkLabel: 'View repository', component: 'Joint sensor modules',
    sources: ['https://github.com/isaaac-afk/gait-analysis'],
  },
  {
    id: 'robot', title: 'Components,\ncoordinated.', field: 'Robotics · Motion control',
    description: 'A four-axis robotic arm, brought together with ROS 2.',
    details: 'Voice commands travel from Alexa through Flask and ROS 2 to MoveIt 2, a custom C++ controller, and an Arduino-driven four-axis arm. This physical project is separate from the conceptual six-axis artwork shown here.',
    tags: ['ROS 2', 'MoveIt 2', 'C++', 'Arduino'],
    url: 'https://github.com/isaaac-afk/ros2-robotic-arm-alexa', linkLabel: 'View repository', component: 'Final assembly',
    sources: ['https://github.com/isaaac-afk/ros2-robotic-arm-alexa', 'IsaacRobresCVcombine.pdf', 'IsaacSoftresCV.pdf'],
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

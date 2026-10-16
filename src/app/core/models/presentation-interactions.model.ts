interface PollInteraction {
  type: 'poll';
  question: string;
  options: string[];
  multiSelect?: boolean;
}

interface ReflectionInteraction {
  type: 'reflection';
  question: string;
  placeholder: string;
  rows?: number;
}

export interface SlideInteractions {
  present?: PollInteraction[];
  scroll?: ReflectionInteraction[];
}

type Choice = { id: string; text: string; correct?: boolean };
type Question = { id: string; prompt: string; choices: Choice[] };

const QUESTIONS: Question[] = [
  {
    id: 'math_1',
    prompt: 'A parrot found 12 berries and shared them equally with 3 friends. How many berries did each get?',
    choices: [
      { id: 'a', text: '3', correct: true },
      { id: 'b', text: '4' },
      { id: 'c', text: '6' }
    ]
  },
  {
    id: 'science_1',
    prompt: 'Which of these is a living thing you might see in the jungle?',
    choices: [
      { id: 'a', text: 'A river' },
      { id: 'b', text: 'A jaguar', correct: true },
      { id: 'c', text: 'A rock' }
    ]
  },
  {
    id: 'logic_1',
    prompt: 'You need a 3-digit code: first and last digits are the same, and the middle is 0. Which is it?',
    choices: [
      { id: 'a', text: '101' },
      { id: 'b', text: '303', correct: true },
      { id: 'c', text: '120' }
    ]
  }
];

export class QuestionManager {
  private overlay: HTMLDivElement;
  private promptEl: HTMLDivElement;
  private choicesEl: HTMLDivElement;
  private feedbackEl: HTMLDivElement;

  constructor(overlay: HTMLDivElement, promptEl: HTMLDivElement, choicesEl: HTMLDivElement, feedbackEl: HTMLDivElement) {
    this.overlay = overlay;
    this.promptEl = promptEl;
    this.choicesEl = choicesEl;
    this.feedbackEl = feedbackEl;
  }

  async ask(id: string): Promise<boolean> {
    const q = QUESTIONS.find(q => q.id === id);
    if (!q) return true;

    this.promptEl.textContent = q.prompt;
    this.feedbackEl.textContent = '';
    this.choicesEl.innerHTML = '';

    const userChoice: { id?: string } = {};
    for (const choice of q.choices) {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.onclick = () => {
        userChoice.id = choice.id;
        for (const child of Array.from(this.choicesEl.children)) {
          (child as HTMLButtonElement).style.outline = '';
          (child as HTMLButtonElement).style.background = '';
        }
        btn.style.outline = '2px solid #4f46e5';
        btn.style.background = '#eef2ff';
      };
      this.choicesEl.appendChild(btn);
    }

    const submit = document.getElementById('submit') as HTMLButtonElement;
    submit.classList.remove('hidden');

    this.overlay.classList.remove('hidden');
    return new Promise<boolean>((resolve) => {
      const onSubmit = () => {
        if (!userChoice.id) {
          this.feedbackEl.textContent = 'Choose an answer to continue.';
          this.feedbackEl.style.color = '#b45309';
          return;
        }
        const chosen = q.choices.find(c => c.id === userChoice.id);
        const isCorrect = Boolean(chosen?.correct);
        this.feedbackEl.textContent = isCorrect ? 'Correct! The path opens.' : 'Not quite. Try again!';
        this.feedbackEl.style.color = isCorrect ? '#16a34a' : '#dc2626';
        if (isCorrect) {
          setTimeout(() => {
            this.overlay.classList.add('hidden');
            submit.classList.add('hidden');
            submit.removeEventListener('click', onSubmit);
            resolve(true);
          }, 600);
        }
      };
      submit.addEventListener('click', onSubmit);
    });
  }
}

export type Gate = never;


import type { ArchetypeId, QuizQuestion } from "@/types";
const q = (id: number, text: string, options: [ArchetypeId, string][]): QuizQuestion => ({ id, text, options: options.map(([archetype, text]) => ({ archetype, text })) });
export const questions: QuizQuestion[] = [
  q(1, "You have an important project to start. What's most likely to hold you back?", [
    ["perfectionist", "I want to figure out how to do it really well before starting."],
    ["approval_seeker", "I imagine how other people might judge the result."],
    ["worrier", "I keep thinking about what could go wrong."],
    ["self_doubter", "I'm not sure I have what it takes to do it."],
    ["dreamer", "I enjoy imagining the finished project more than doing the steps."],
    ["overwhelmed", "It feels too big. I have no idea where to begin."]
  ]),
  q(2, "A task has been on your to-do list all week. What best explains the delay?", [
    ["overdoer", "I have so many commitments that I can't find the time."],
    ["defier", "I don't like feeling that someone is forcing me to do it."],
    ["crisis_maker", "It doesn't feel urgent enough to make me act yet."],
    ["instant_gratification", "I keep choosing something more enjoyable instead."],
    ["purpose_drifter", "I can't see why doing this really matters to me."],
    ["shame_spiraler", "The longer I avoid it, the guiltier I feel about returning."]
  ]),
  q(3, "You're working on something and hit a difficult part. What happens?", [
    ["perfectionist", "I get caught polishing details instead of moving forward."],
    ["worrier", "I'm afraid of making a decision I'll regret."],
    ["dreamer", "I start imagining a more exciting version of the project."],
    ["overdoer", "Another commitment interrupts me, and I switch to that."],
    ["crisis_maker", "I leave the difficult part until the deadline gets closer."],
    ["purpose_drifter", "I begin questioning whether the task is worth the effort."]
  ]),
  q(4, "Someone gives you an assignment due Friday. What might get in your way?", [
    ["approval_seeker", "I worry they won't be happy with what I produce."],
    ["self_doubter", "I'm not confident I can complete it successfully."],
    ["overwhelmed", "There are so many parts that I can't decide what to tackle first."],
    ["defier", "Being told what to do makes me want to resist."],
    ["instant_gratification", "I keep taking fun little breaks that turn into long ones."],
    ["shame_spiraler", "Once I fall behind, I feel too guilty to face the assignment."]
  ]),
  q(5, "You're supposed to share your work with others. What's hardest?", [
    ["perfectionist", "I keep finding things I want to improve first."],
    ["approval_seeker", "I worry about criticism, embarrassment, or disapproval."],
    ["overdoer", "I've been too busy with other commitments to prepare."],
    ["defier", "I dislike having to share it on someone else's terms."],
    ["purpose_drifter", "I'm not convinced sharing it serves a meaningful goal."],
    ["shame_spiraler", "I've already delayed so much that I feel embarrassed to show it."]
  ]),
  q(6, "You finally have a free afternoon. Why might you still put things off?", [
    ["worrier", "I can't decide what to do without worrying about the outcome."],
    ["self_doubter", "I doubt I'll be able to make worthwhile progress."],
    ["dreamer", "I get lost thinking about possibilities instead of taking action."],
    ["overwhelmed", "There are too many things on my mind to pick just one."],
    ["crisis_maker", "Without a deadline, I can't seem to activate my focus."],
    ["instant_gratification", "Doing something enjoyable right now feels much more appealing."]
  ]),
  q(7, "You've made a little progress, but there's still more to do. What happens?", [
    ["perfectionist", "My progress doesn't feel meaningful because the result isn't good enough."],
    ["self_doubter", "Seeing what's left makes me doubt my ability to finish."],
    ["overwhelmed", "The remaining steps blur together, and I freeze."],
    ["overdoer", "I move on to other responsibilities I've agreed to handle."],
    ["instant_gratification", "I reward myself with a distraction and forget to return."],
    ["shame_spiraler", "I criticize myself for not doing more, then avoid continuing."]
  ]),
  q(8, "You're given a vague task with little guidance. What do you tend to do?", [
    ["approval_seeker", "I keep trying to guess what would impress the person who assigned it."],
    ["worrier", "I spend time trying to eliminate every possible risk."],
    ["dreamer", "I brainstorm ambitious ideas without testing a small one."],
    ["defier", "I feel resistant to following directions I didn't choose."],
    ["crisis_maker", "I wait until time pressure forces me to make a move."],
    ["purpose_drifter", "I struggle to care because I don't see a personal reason for doing it."]
  ]),
  q(9, "You planned to get something done today, but it's now evening. What happened?", [
    ["perfectionist", "I spent too much time preparing, researching, or refining."],
    ["dreamer", "I got carried away thinking about ideas instead of executing them."],
    ["overwhelmed", "Everything felt equally important, so I barely started."],
    ["defier", "I avoided an obligation that felt imposed on me."],
    ["crisis_maker", "I assumed I'd become productive when the deadline was closer."],
    ["shame_spiraler", "After a slow start, I felt bad about myself and stopped trying."]
  ]),
  q(10, "When you choose between an important task and something else, what usually pulls you away?", [
    ["approval_seeker", "Thinking about how my work will be judged."],
    ["worrier", "Thinking about negative outcomes and uncertain consequences."],
    ["self_doubter", "Feeling that I'm not capable enough to succeed."],
    ["overdoer", "Other people's requests and commitments I've already made."],
    ["instant_gratification", "Something fun that makes me feel good immediately."],
    ["purpose_drifter", "Feeling disconnected from the reason I should do the task."]
  ])
];

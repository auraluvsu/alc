import type { Module } from '../types'

export const n12: Module = {
  n: 12,
  title: 'Reinforcement Learning',
  tour: '17 · Reinforcement Learning',
  summary: 'Learning by acting: Markov decision processes, value iteration, Q-learning and deep Q-networks, policy gradients, and how these ideas apply to optimal execution and market making, along with why RL in markets is harder than in games.',
  topics: ['MDPs', 'Value iteration', 'Q-learning & DQN', 'Policy gradients', 'Execution & market making'],
  cpp23: ['Gymnasium (the maintained successor to OpenAI Gym) is the standard environment API; Stable-Baselines3 and TorchRL provide tested algorithms.'],
  lessons: [
    {
      id: 'mdp',
      title: 'Markov decision processes',
      blocks: [
        { kind: 'analogy', text: "Supervised learning is a teacher marking every answer. Reinforcement learning is learning to play a game where you're only told the score, sometimes long after the move that earned it. An MDP describes the game: states you can be in, actions you can take, how actions move you between states, the rewards along the way, and a discount γ saying how much future rewards are worth today." },
        { kind: 'code', code: `import numpy as np

# A tiny execution problem: sell 2 lots over 3 periods. State = (time left, inventory).
# Selling more at once costs more market impact, holding inventory carries risk,
# and anything unsold at the end is dumped at a big penalty.
T, Q = 3, 2
actions = [0, 1, 2]                                  # lots to sell this period

def reward(q_sell):                                  # proceeds minus quadratic impact
    return q_sell * 1.0 - 0.3 * q_sell ** 2

def step(t, inv, a):
    a = min(a, inv)
    r = reward(a)
    t2, inv2 = t + 1, inv - a
    r -= 0.05 * inv2                                 # small cost (risk) of holding inventory
    if t2 == T and inv2 > 0:
        r -= 2.0 * inv2                              # forced liquidation penalty
    return t2, inv2, r` },
        { kind: 'check', q: 'What does the discount factor γ express?', options: ['The learning rate', 'How much future rewards are worth relative to immediate ones', 'Exploration rate', 'Number of actions'], answer: 1, hint: 'A pound today vs a pound next year.', explain: 'γ near 1 = far-sighted.' },
      ],
    },
    {
      id: 'value',
      title: 'Value iteration',
      blocks: [
        { kind: 'analogy', text: "Value iteration works backwards from the end of the game. On the last move, the best action is obvious. Knowing that, the second-to-last move becomes obvious too, and so on to the start. The value of a state is the best total reward you can still collect from it: the Bellman equation, the foundation of everything in RL." },
        { kind: 'code', code: `V = np.zeros((T + 1, Q + 1))                     # V[t, inv]: best reward-to-go
policy = np.zeros((T, Q + 1), dtype=int)
for t in reversed(range(T)):                       # backwards induction
    for inv in range(Q + 1):
        best, best_a = -np.inf, 0
        for a in actions:
            if a > inv: continue
            t2, inv2, r = step(t, inv, a)
            total = r + V[t2, inv2]                 # Bellman: reward now + value of where you land
            if total > best: best, best_a = total, a
        V[t, inv], policy[t, inv] = best, best_a

policy[0, 2], policy[1, 1], policy[2, 1]        # (1, 1, 1): spread the sale evenly to limit impact
V[0, 2]                                          # 1.35 = 2 × (1.0 − 0.3) − 0.05 holding cost` },
        { kind: 'p', text: 'This only works when you know the rules of the game (transition probabilities and rewards) and the state space is small. Real markets satisfy neither, which is why model-free methods learn from experience instead.' },
        { kind: 'check', q: 'Why does the optimal policy sell 1 lot per period rather than 2 at once?', options: ['Random', 'Quadratic impact makes one large sale costlier than two small ones', 'The discount factor', 'Inventory limits'], answer: 1, hint: '0.3 × 2² vs 2 × 0.3 × 1².', explain: 'This is the core idea of Almgren–Chriss optimal execution.' },
      ],
    },
    {
      id: 'q',
      title: 'Q-learning & DQN',
      blocks: [
        { kind: 'analogy', text: "Q-learning learns a score Q(state, action) for every pair, \"how good is doing this here, then playing well afterwards?\", purely from experience. After each step it nudges its estimate towards the reward received plus the best score available from the next state. It explores with some randomness (ε-greedy) so it doesn't lock onto the first decent habit. A DQN replaces the table with a neural network." },
        { kind: 'code', code: `rng = np.random.default_rng(0)
Qtab = np.zeros((T + 1, Q + 1, len(actions)))
alpha, eps = 0.1, 0.2
for episode in range(5000):
    t, inv = 0, Q
    while t < T:
        valid = [a for a in actions if a <= inv]
        a = rng.choice(valid) if rng.random() < eps else max(valid, key=lambda a: Qtab[t, inv, a])
        t2, inv2, r = step(t, inv, a)
        target = r + (0 if t2 == T else max(Qtab[t2, inv2, b] for b in actions if b <= inv2))
        Qtab[t, inv, a] += alpha * (target - Qtab[t, inv, a])     # TD update
        t, inv = t2, inv2
Qtab[0, 2].argmax()                       # 1: learned the same policy, from experience only
Qtab[0, 2].round(2)                       # [1.25, 1.35, 0.8]: Q-values for selling 0, 1, 2

# DQN essentials: a network Q(s) → one value per action, a replay buffer of past transitions,
# and a slowly updated "target network" to stabilise the bootstrapped targets.` },
        { kind: 'check', q: 'What is the Q-learning target for a transition?', options: ['The reward only', 'Reward plus the best Q-value from the next state', 'The average Q', 'The policy'], answer: 1, hint: 'Bellman again, learned from samples.', explain: 'Discounted by γ in general.' },
      ],
    },
    {
      id: 'pg',
      title: 'Policy gradients',
      blocks: [
        { kind: 'analogy', text: "Instead of scoring actions, policy gradients learn the policy directly: a network that outputs action probabilities. Play an episode; if it went well, make the actions you took more likely; if badly, less likely. Subtracting a baseline (the average outcome) reduces noise, and modern methods such as PPO add guard-rails so each update can't change the policy too much." },
        { kind: 'code', code: `import torch
from torch import nn

policy_net = nn.Sequential(nn.Linear(2, 32), nn.Tanh(), nn.Linear(32, len(actions)))
opt = torch.optim.Adam(policy_net.parameters(), lr=1e-2)

def run_episode():
    t, inv, logps, total = 0, Q, [], 0.0
    while t < T:
        logits = policy_net(torch.tensor([t / T, inv / Q], dtype=torch.float32))
        logits = logits.masked_fill(torch.tensor([a > inv for a in actions]), -1e9)   # invalid actions
        dist = torch.distributions.Categorical(logits=logits)
        a = dist.sample()
        logps.append(dist.log_prob(a))
        t, inv, r = step(t, inv, int(a))
        total += r
    return torch.stack(logps).sum(), total

baseline = 0.0
for it in range(500):                                   # REINFORCE with a moving-average baseline
    logp, G = run_episode()
    baseline = 0.95 * baseline + 0.05 * G
    loss = -(G - baseline) * logp
    opt.zero_grad(); loss.backward(); opt.step()` },
        { kind: 'check', q: 'Why subtract a baseline from the return in REINFORCE?', options: ['To change the optimum', 'To reduce gradient variance without biasing it', 'To speed up the environment', 'Required by Adam'], answer: 1, hint: 'Was this episode better or worse than usual?', explain: 'Actor-critic methods learn the baseline.' },
      ],
    },
    {
      id: 'markets',
      title: 'Execution, market making & caveats',
      blocks: [
        { kind: 'analogy', text: "RL shines when your actions change what happens next, which is exactly the situation in execution and market making: selling moves the price, and quoting changes which orders you receive. It struggles for pure alpha prediction, where your small trades don't change the market and supervised learning is simpler and more honest." },
        { kind: 'list', items: [
          '**Optimal execution**: state = time left, inventory, spread, volatility, queue position; action = how much to trade and how aggressively; reward = proceeds minus impact and risk. Almgren–Chriss gives the classical benchmark the agent must beat.',
          '**Market making**: state = inventory, spread, order-book imbalance; action = bid/ask offsets and sizes; reward = spread captured minus inventory risk (Avellaneda–Stoikov is the classical model).',
          '**The simulator problem**: agents learn to exploit their simulator. A market simulator that ignores your own impact, or replays history without reacting, teaches strategies that fail live.',
          '**Sample efficiency**: games give millions of episodes; markets give one history. Use RL for the parts you can simulate credibly (execution against an impact model), not as a black box for alpha.',
          '**Safety**: hard limits (position, loss, order rate) belong outside the agent, enforced by the risk system.',
        ] },
        { kind: 'check', q: 'Why is RL a better fit for execution than for predicting returns?', options: ['Execution data is bigger', 'Your actions affect future states (price impact), which RL models and supervised learning doesn\'t', 'Returns are easy', 'RL is faster'], answer: 1, hint: 'Do your actions change the world?', explain: 'For pure prediction, supervised learning is simpler.' },
      ],
    },
  ],
  quiz: [
    { q: 'An MDP consists of…', options: ['Data and labels', 'States, actions, transitions, rewards and a discount', 'Layers and losses', 'Prices only'], answer: 1, explain: 'The rules of the game.' },
    { q: 'The Bellman equation expresses a state\'s value as…', options: ['Its reward only', 'Immediate reward plus the (discounted) value of the next state under the best action', 'An average of all states', 'A constant'], answer: 1, explain: 'The basis of RL.' },
    { q: 'Value iteration requires…', options: ['Only experience', 'A known model of transitions and rewards', 'A neural network', 'A GPU'], answer: 1, explain: 'Model-based.' },
    { q: 'Q-learning is…', options: ['Model-based', 'Model-free, learning from sampled transitions', 'Supervised', 'Unsupervised'], answer: 1, explain: 'TD updates.' },
    { q: 'ε-greedy means…', options: ['Always greedy', 'Mostly greedy, random with probability ε', 'Always random', 'Decaying learning rate'], answer: 1, explain: 'Exploration.' },
    { q: 'A DQN\'s replay buffer…', options: ['Stores weights', 'Stores past transitions to sample decorrelated batches', 'Stores policies', 'Replays prices live'], answer: 1, explain: 'Plus a target network.' },
    { q: 'Policy gradients optimise…', options: ['A Q-table', 'The policy\'s parameters directly', 'The environment', 'The reward'], answer: 1, explain: 'REINFORCE, PPO, etc.' },
    { q: 'A key danger of RL for trading is…', options: ['Too much data', 'Exploiting an unrealistic simulator', 'Too few actions', 'GPU cost'], answer: 1, explain: 'Simulate impact credibly.' },
  ],
}

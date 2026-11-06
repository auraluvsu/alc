import type { Module } from '../types'

export const l03: Module = {
  n: 3,
  title: 'Classification',
  tour: '3 · Classification',
  summary: 'Predicting categories: training a binary classifier, why accuracy misleads on imbalanced data, the confusion matrix, precision and recall, ROC and precision-recall curves, choosing and calibrating a decision threshold, and multiclass problems.',
  topics: ['Binary classifiers', 'Confusion matrix', 'Precision, recall & F1', 'ROC & PR curves', 'Thresholds & calibration', 'Multiclass'],
  cpp23: [
    '`TunedThresholdClassifierCV` (1.5) chooses the decision threshold by cross-validation; `FixedThresholdClassifier` sets one explicitly.',
    '`CalibratedClassifierCV` accepts a `FrozenEstimator` (1.6) to calibrate an already-fitted model.',
  ],
  lessons: [
    {
      id: 'binary',
      title: 'A first binary classifier',
      blocks: [
        { kind: 'analogy', text: "A binary classifier is a smoke alarm: it looks at the evidence and says \"fire\" or \"no fire\". Underneath it actually produces a *score* (how smoky is it?), and a threshold turns the score into a yes or no. Most of this module is about choosing and judging that threshold." },
        { kind: 'code', code: `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# Imbalanced data: 5% positives, like defaults, frauds or big-move days
X, y = make_classification(n_samples=20_000, n_features=10, n_informative=4,
                           weights=[0.95], flip_y=0.01, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)

clf = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)
clf.predict(X_te[:5])              # hard labels (threshold 0.5)
clf.predict_proba(X_te[:5])[:, 1]  # scores: P(class 1)
clf.score(X_te, y_te)              # accuracy ≈ 0.949 …

(y_te == 0).mean()                 # ≈ 0.946: "always say no" scores almost the same` },
        { kind: 'pitfall', text: 'On imbalanced data, accuracy is nearly useless: a model that never predicts the rare class scores 95% on this dataset. Always compare against the majority-class baseline and use metrics that look at the positive class.' },
        { kind: 'check', q: '5% of days are big-move days. A model predicting "no big move" every day has what accuracy?', options: ['50%', '5%', '95%', '0%'], answer: 2, hint: 'It\'s right on every quiet day.', explain: 'And it\'s useless. Use precision and recall instead.' },
      ],
    },
    {
      id: 'confusion',
      title: 'Confusion matrix, precision & recall',
      blocks: [
        { kind: 'analogy', text: "Precision asks: when the alarm rang, how often was there a fire? Recall asks: of all the fires, how many did the alarm catch? A twitchy alarm has high recall and low precision (it catches every fire and every slice of toast); a lazy one has the reverse. You can't maximise both, so you choose based on what a false alarm and a missed fire each cost." },
        { kind: 'code', code: `from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, classification_report

pred = clf.predict(X_te)
confusion_matrix(y_te, pred)
# [[TN  FP]       rows = actual, columns = predicted
#  [FN  TP]]

precision_score(y_te, pred)     # TP / (TP + FP): ≈ 0.93, its rare "yes" is trustworthy
recall_score(y_te, pred)        # TP / (TP + FN): here ≈ 0.05! It catches 13 of 269 positives
f1_score(y_te, pred)            # harmonic mean of the two
print(classification_report(y_te, pred, digits=3))` },
        { kind: 'list', items: [
          '**Fraud screening**: missing fraud is expensive, a manual review is cheap → favour recall.',
          '**Trade signal**: every "yes" costs spread and risk → favour precision.',
          'F1 is a convenient single number only when both errors cost about the same, which in finance they rarely do.',
        ] },
        { kind: 'check', q: 'A signal fires 40 times; 10 were real opportunities, and there were 50 real opportunities in total. Precision and recall?', options: ['0.25 and 0.2', '0.2 and 0.25', '0.8 and 0.5', '0.25 and 0.8'], answer: 0, hint: 'Precision = 10/40, recall = 10/50.', explain: 'Precision 0.25, recall 0.2.' },
      ],
    },
    {
      id: 'curves',
      title: 'ROC & precision-recall curves',
      blocks: [
        { kind: 'analogy', text: "Rather than judging one threshold, sweep the dial through every setting and plot what happens. The ROC curve plots catching fires against false alarms on quiet days; the precision-recall curve plots trustworthiness against coverage. The area under each curve summarises the ranking quality across all thresholds." },
        { kind: 'code', code: `from sklearn.metrics import roc_auc_score, average_precision_score, precision_recall_curve, RocCurveDisplay

scores = clf.predict_proba(X_te)[:, 1]
roc_auc_score(y_te, scores)            # 0.5 = random ranking, 1.0 = perfect
average_precision_score(y_te, scores)  # area under the PR curve; baseline = positive rate (0.05)

prec, rec, thr = precision_recall_curve(y_te, scores)
RocCurveDisplay.from_predictions(y_te, scores)` },
        { kind: 'p', text: 'ROC AUC can look flattering on heavily imbalanced data, because the huge number of negatives keeps the false-positive *rate* small even when false positives outnumber true ones. When positives are rare, the precision-recall curve and average precision tell the more honest story.' },
        { kind: 'check', q: 'With 1% positives, what does a random classifier\'s average precision come to?', options: ['0.5', 'About 0.01', '1.0', '0'], answer: 1, hint: 'Precision of random guesses = the positive rate.', explain: 'ROC AUC for random is 0.5 regardless of imbalance.' },
      ],
    },
    {
      id: 'threshold',
      title: 'Thresholds & calibration',
      blocks: [
        { kind: 'analogy', text: "The default threshold of 0.5 is an arbitrary factory setting. Set the dial from the costs: if a false alarm costs £1 and a missed fire costs £20, you should ring at much lower smoke levels. Calibration is a separate question: when the model says 70%, does the event happen 70% of the time? Position sizing needs calibrated probabilities, not just a good ranking." },
        { kind: 'code', code: `from sklearn.model_selection import TunedThresholdClassifierCV
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import make_scorer

def profit(y_true, y_pred):                 # +20 per caught positive, −1 per false alarm
    tp = ((y_true == 1) & (y_pred == 1)).sum()
    fp = ((y_true == 0) & (y_pred == 1)).sum()
    return 20 * tp - fp

tuned = TunedThresholdClassifierCV(LogisticRegression(max_iter=1000),
                                   scoring=make_scorer(profit), cv=5).fit(X_tr, y_tr)
tuned.best_threshold_                       # well below 0.5 for these costs

cal = CalibratedClassifierCV(LogisticRegression(max_iter=1000), method="isotonic", cv=5).fit(X_tr, y_tr)
frac_pos, mean_pred = calibration_curve(y_te, cal.predict_proba(X_te)[:, 1], n_bins=10)
# A well-calibrated model has frac_pos ≈ mean_pred in every bin` },
        { kind: 'check', q: 'Missing a positive costs 20× more than a false alarm. Which way should the threshold move from 0.5?', options: ['Up', 'Down', 'Stay', 'To exactly 0.95'], answer: 1, hint: 'Ring the alarm more readily.', explain: 'Lower thresholds trade precision for recall.' },
      ],
    },
    {
      id: 'multiclass',
      title: 'Multiclass classification',
      blocks: [
        { kind: 'analogy', text: "With three or more classes (down / flat / up), most models score every class and pick the highest. Some binary-only models are wrapped automatically: one-vs-rest trains one alarm per class; one-vs-one trains one for every pair." },
        { kind: 'code', code: `from sklearn.ensemble import HistGradientBoostingClassifier

rng = np.random.default_rng(0)
ret = rng.normal(0, 0.01, 5000)
y3 = np.select([ret < -0.005, ret > 0.005], [0, 2], default=1)    # down, flat, up
Xm = np.c_[ret + rng.normal(0, 0.02, 5000), rng.normal(size=(5000, 4))]   # weak signal

m = HistGradientBoostingClassifier(max_depth=3).fit(Xm[:4000], y3[:4000])
m.predict_proba(Xm[4000:4003])           # one column per class, rows sum to 1
confusion_matrix(y3[4000:], m.predict(Xm[4000:]))   # 3×3
f1_score(y3[4000:], m.predict(Xm[4000:]), average="macro")   # average over classes equally` },
        { kind: 'check', q: 'What does `average="macro"` do for a multiclass F1?', options: ['Weights by class size', 'Averages each class\'s F1 equally', 'Uses only the largest class', 'Micro-averages counts'], answer: 1, hint: 'Each class gets one vote.', explain: '"weighted" weights by support; "micro" pools all counts.' },
      ],
    },
  ],
  quiz: [
    { q: 'On 95/5 imbalanced data, accuracy of the majority-class baseline is…', options: ['5%', '50%', '95%', '100%'], answer: 2, explain: 'So accuracy is misleading.' },
    { q: 'Precision is…', options: ['TP / (TP + FN)', 'TP / (TP + FP)', 'TN / (TN + FP)', '(TP + TN) / N'], answer: 1, explain: 'How trustworthy a "yes" is.' },
    { q: 'Recall is…', options: ['TP / (TP + FN)', 'TP / (TP + FP)', 'FP / (FP + TN)', 'TN / N'], answer: 0, explain: 'How many positives were caught.' },
    { q: 'ROC AUC of a random ranking is…', options: ['0', '0.5', '1', 'The positive rate'], answer: 1, explain: 'Average precision is the positive rate.' },
    { q: 'For rare positives, which curve is more informative?', options: ['ROC', 'Precision-recall', 'Learning curve', 'Lift only'], answer: 1, explain: 'ROC can flatter.' },
    { q: 'What chooses a threshold by cross-validation in sklearn 1.5+?', options: ['GridSearchCV', 'TunedThresholdClassifierCV', 'Pipeline', 'cross_val_score'], answer: 1, explain: 'With any scorer, including custom costs.' },
    { q: 'Calibration means…', options: ['High accuracy', 'Predicted probabilities match observed frequencies', 'Balanced classes', 'Fast inference'], answer: 1, explain: 'Needed for sizing positions.' },
    { q: 'Macro-averaged F1…', options: ['Weights by support', 'Treats every class equally', 'Uses one class', 'Is accuracy'], answer: 1, explain: 'Good when small classes matter.' },
  ],
}

import type { Module } from '../types'

export const d08: Module = {
  n: 8,
  title: 'Time Series',
  tour: '11 · Time Series',
  summary: 'Timestamps, time zones and periods; resampling ticks into bars and daily into monthly; rolling and expanding windows; exponentially weighted statistics; shifting and lagging without look-ahead; and business-day calendars.',
  topics: ['Dates, times & time zones', 'Resampling & bars', 'Rolling windows', 'EWMA', 'shift & lag', 'Business calendars'],
  cpp23: [
    'Microsecond resolution is the default when parsing (3.0).',
    'Frequency aliases changed: "ME" month end, "QE" quarter end, "YE" year end, "h" hour, "min" minute, "s" second (2.2+).',
  ],
  lessons: [
    {
      id: 'dates',
      title: 'Dates, times & time zones',
      blocks: [
        { kind: 'analogy', text: "A naive timestamp is a time written on a sticky note with no city. \"09:00\" means nothing to a desk spanning London, New York and Tokyo. Store everything in UTC, the way airlines do, and convert to local time only for display or for session rules (\"the London fix is at 15:00 local\")." },
        { kind: 'code', code: `import pandas as pd, numpy as np

ts = pd.Timestamp("2026-03-27 15:00", tz="Europe/London")
ts.tz_convert("America/New_York")      # 2026-03-27 11:00-04:00 (US already on summer time)
ts.tz_convert("UTC")                   # 2026-03-27 15:00+00:00 (UK switches on 29 March)

idx = pd.date_range("2026-03-27 14:00", periods=4, freq="h", tz="UTC")
idx.tz_convert("Europe/London")

naive = pd.to_datetime(["2026-03-02 09:00"])
naive.tz_localize("Europe/London")     # attach a zone to naive times
pd.Timestamp("2026-03-02") + pd.Timedelta(hours=6, minutes=30)
pd.Timestamp("2026-01-31") + pd.offsets.MonthEnd()   # 2026-02-28
(pd.Timestamp("2026-03-06") - pd.Timestamp("2026-03-02")).days   # 4` },
        { kind: 'pitfall', text: 'The US and UK change clocks on different dates (three weeks apart in March). A naive "14:30 London = 09:30 New York" rule is wrong for those weeks. Keep data in UTC and convert with real time zones.' },
        { kind: 'check', q: 'What should raw market data timestamps be stored in?', options: ['Local exchange time, naive', 'UTC, time-zone aware', 'Strings', 'Unix seconds only'], answer: 1, hint: 'Airlines.', explain: 'Convert at the edges.' },
      ],
    },
    {
      id: 'resample',
      title: 'Resampling & bars',
      blocks: [
        { kind: 'analogy', text: "Resampling is changing the size of the buckets time is poured into. Downsampling (ticks → 1-minute bars, daily → monthly) pours many observations into one bucket and needs a rule for combining them: first, last, max, sum. Upsampling (monthly → daily) creates empty buckets that need a fill rule." },
        { kind: 'code', code: `rng = np.random.default_rng(0)
t = pd.date_range("2026-03-02 08:00", periods=10_000, freq="250ms", tz="UTC")
ticks = pd.DataFrame({"px": 2385 + rng.normal(0, 0.05, len(t)).cumsum(),
                      "size": rng.integers(1, 10, len(t))}, index=t)

bars = ticks["px"].resample("1min").ohlc()                    # open, high, low, close
bars["volume"] = ticks["size"].resample("1min").sum()
bars["vwap"] = (ticks["px"] * ticks["size"]).resample("1min").sum() / bars["volume"]
bars.shape                                                    # (42, 6): 2500 s ≈ 41.7 minutes

daily = prices.resample("B").last()                           # business-daily closes
monthly_ret = prices.resample("ME").last().pct_change()       # month-end returns

# Bar labels: by default a 1-min bar is labelled by its START (09:00 covers 09:00–09:00:59)
ticks["px"].resample("1min", label="right", closed="right").last()   # label by end time` },
        { kind: 'pitfall', text: 'A bar labelled 09:00 contains data up to 09:00:59. If your strategy acts "at 09:00" using that bar\'s close, it\'s using a price from the future. Label bars by their close time (`label="right"`), or shift before using them.' },
        { kind: 'check', q: 'Which resample alias means "month end" in modern pandas?', options: ['"M"', '"ME"', '"MS"', '"mo"'], answer: 1, hint: 'The old alias was deprecated.', explain: '"MS" is month start.' },
      ],
    },
    {
      id: 'rolling',
      title: 'Rolling & expanding windows',
      blocks: [
        { kind: 'analogy', text: "A rolling window is a magnifying glass sliding along the series: at each point it looks at the last N observations and reports a statistic. An expanding window is a glass that grows: everything from the start up to now. Both only look backwards by default, which is what you want." },
        { kind: 'code', code: `rets = pd.Series(rng.normal(0.0003, 0.01, 500), index=pd.bdate_range("2025-01-01", periods=500))

vol20 = rets.rolling(20).std() * np.sqrt(252)          # NaN for the first 19 days
vol20_mp = rets.rolling(20, min_periods=10).std()       # results once 10 obs exist
vol30d = rets.rolling("30D").std()                     # time-based window (calendar days)
sharpe_exp = rets.expanding(min_periods=60).mean() / rets.expanding(min_periods=60).std()

mkt = pd.Series(rng.normal(0.0003, 0.01, 500), index=rets.index)
beta60 = rets.rolling(60).cov(mkt) / mkt.rolling(60).var()   # rolling beta
z = (rets - rets.rolling(60).mean()) / rets.rolling(60).std()   # rolling z-score

rets.rolling(20).apply(lambda w: (w > 0).mean(), raw=True)     # custom stat; raw=True passes NumPy` },
        { kind: 'pitfall', text: '`rolling(..., center=True)` uses future observations. It\'s for smoothing charts, never for features or signals.' },
        { kind: 'check', q: 'What\'s the difference between `rolling(20)` and `rolling("30D")`?', options: ['None', '20 observations vs 30 calendar days of observations', 'Days vs seconds', 'Speed only'], answer: 1, hint: 'Count vs time.', explain: 'Time-based windows need a DatetimeIndex and handle gaps naturally.' },
      ],
    },
    {
      id: 'ewm',
      title: 'Exponentially weighted statistics',
      blocks: [
        { kind: 'analogy', text: "A rolling window treats the 20th day ago exactly like yesterday, then forgets it completely on day 21: a cliff edge. An exponentially weighted average fades old data smoothly, like memory, so a single shock doesn't cause a jump when it drops out of the window. Risk models (RiskMetrics) use it for volatility." },
        { kind: 'code', code: `ewvol = rets.ewm(halflife=10).std() * np.sqrt(252)     # weight halves every 10 days
ewvol_rm = rets.ewm(alpha=0.06, adjust=False).std()     # RiskMetrics-style λ = 0.94
ema_fast = prices.ewm(span=12, adjust=False).mean()
ema_slow = prices.ewm(span=26, adjust=False).mean()
macd = ema_fast - ema_slow                             # the MACD indicator

ewcorr = rets.ewm(halflife=30).corr(mkt)               # time-varying correlation` },
        { kind: 'list', items: [
          '`span`, `halflife`, `com` and `alpha` are four ways to set the same decay rate. `halflife` is the easiest to reason about.',
          '`adjust=False` gives the recursive form `y_t = (1−α)·y_{t−1} + α·x_t`, matching most trading platforms and C++ implementations.',
        ] },
        { kind: 'check', q: 'With halflife=10, how much weight does a return from 10 days ago get relative to today\'s?', options: ['Zero', 'Half', 'A tenth', 'The same'], answer: 1, hint: 'Half-life.', explain: '20 days ago gets a quarter.' },
      ],
    },
    {
      id: 'shift',
      title: 'shift, lag & business calendars',
      blocks: [
        { kind: 'analogy', text: "`shift(1)` slides a column down one row, so each date sees *yesterday's* value. It's the single most important function in backtesting: a signal computed from today's close can only be traded tomorrow, so the signal must be shifted before it's multiplied by returns." },
        { kind: 'code', code: `px = pd.Series(2385 * np.exp(rng.normal(0, 0.01, 500).cumsum()), index=rets.index)
ret = px.pct_change()
signal = np.sign(px.rolling(10).mean() - px.rolling(50).mean())   # +1 / -1

wrong = signal * ret              # look-ahead: today's signal used for today's return
right = signal.shift(1) * ret     # decided at yesterday's close, earned today
right.mean() * 252, wrong.mean() * 252   # "wrong" uses today's close to trade today: impossible live

fwd_ret_5d = px.shift(-5) / px - 1        # FUTURE return: only as a training label, never a feature

from pandas.tseries.holiday import USFederalHolidayCalendar
from pandas.tseries.offsets import CustomBusinessDay
us_bd = CustomBusinessDay(calendar=USFederalHolidayCalendar())
pd.date_range("2026-11-24", periods=4, freq=us_bd)    # skips Thanksgiving (26 Nov)` },
        { kind: 'pitfall', text: 'Any negative shift (`shift(-n)`) looks into the future. It\'s correct for building labels (what happened next) and wrong anywhere else. Grep your feature code for `shift(-` before trusting a backtest.' },
        { kind: 'check', q: 'Your signal uses today\'s close. Which line computes strategy returns correctly?', options: ['signal * ret', 'signal.shift(1) * ret', 'signal.shift(-1) * ret', 'signal * ret.shift(1)'], answer: 1, hint: 'Decide today, earn tomorrow.', explain: 'The last option pairs today\'s signal with yesterday\'s return, which is backwards.' },
      ],
    },
  ],
  quiz: [
    { q: 'Best practice for storing timestamps?', options: ['Local naive', 'UTC aware', 'Strings', 'Excel serials'], answer: 1, explain: 'Convert for display.' },
    { q: 'tz_localize vs tz_convert?', options: ['Same', 'localize attaches a zone to naive times; convert changes zone of aware times', 'Reversed', 'Both remove zones'], answer: 1, explain: 'Converting naive times raises.' },
    { q: 'Ticks to OHLC bars uses…', options: ['rolling', 'resample(...).ohlc()', 'groupby(sym)', 'shift'], answer: 1, explain: 'Plus sum for volume.' },
    { q: 'By default a resampled 1-minute bar is labelled by…', options: ['Its end', 'Its start', 'Its midpoint', 'The last tick'], answer: 1, explain: 'Watch for look-ahead.' },
    { q: 'rolling(center=True) is safe for…', options: ['Signals', 'Charts only', 'Labels', 'Backtests'], answer: 1, explain: 'It uses future data.' },
    { q: 'EWMA with adjust=False is…', options: ['A rolling mean', 'The recursive exponential filter', 'Unweighted', 'Centred'], answer: 1, explain: 'Matches most platforms.' },
    { q: 'What does `px.shift(-5) / px - 1` compute?', options: ['Past 5-day return', 'Forward 5-day return (a label)', 'Volatility', 'Momentum'], answer: 1, explain: 'Never use it as a feature.' },
    { q: 'Strategy returns should be…', options: ['signal * ret', 'signal.shift(1) * ret', 'signal.shift(-1) * ret', 'signal + ret'], answer: 1, explain: 'No look-ahead.' },
  ],
}

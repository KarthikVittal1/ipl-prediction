# =============================================================================
#  IPL MATCH PREDICTION MODEL — 2008 to 2026
# =============================================================================

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings, os, joblib
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report

warnings.filterwarnings('ignore')
plt.rcParams['figure.dpi'] = 110

# ── PATHS — update if needed ──────────────────────────────────────────────────
PATH_2025 = r"C:\Users\Sravanth.claaps\IPL-project\Backend\data\2008-2025 ipl dataset"
PATH_2026 = r"C:\Users\Sravanth.claaps\IPL-project\Backend\data\2026 dataset"
SAVE_DIR  = r"C:\Users\Sravanth.claaps\IPL-project\Backend\model"

TEAM_COLORS = {
    "Mumbai Indians"              : "#004BA0",
    "Chennai Super Kings"         : "#F7A721",
    "Royal Challengers Bangalore" : "#EC1C24",
    "Kolkata Knight Riders"       : "#3A225D",
    "Delhi Capitals"              : "#17449B",
    "Punjab Kings"                : "#ED1B24",
    "Rajasthan Royals"            : "#E91E8C",
    "Sunrisers Hyderabad"         : "#FF6600",
    "Gujarat Titans"              : "#1C4899",
    "Lucknow Super Giants"        : "#00A3E0",
}

TEAM_MAP = {
    "Delhi Daredevils"       : "Delhi Capitals",
    "Kings XI Punjab"        : "Punjab Kings",
    "Deccan Chargers"        : "Sunrisers Hyderabad",
    "Gujarat Lions"          : "Gujarat Titans",
    "Rising Pune Supergiant" : "Chennai Super Kings",
    "Pune Warriors India"    : "Chennai Super Kings",
    "Kochi Tuskers Kerala"   : "Chennai Super Kings",
}

SHORT_TO_FULL = {
    "MI"  : "Mumbai Indians",   "CSK" : "Chennai Super Kings",
    "RCB" : "Royal Challengers Bangalore", "KKR" : "Kolkata Knight Riders",
    "DC"  : "Delhi Capitals",   "PBKS": "Punjab Kings",
    "RR"  : "Rajasthan Royals", "SRH" : "Sunrisers Hyderabad",
    "GT"  : "Gujarat Titans",   "LSG" : "Lucknow Super Giants",
    "PK"  : "Punjab Kings",
}
FULL_TO_SHORT = {v: k for k, v in SHORT_TO_FULL.items()}


# ── STEP 1 — LOAD DATA ────────────────────────────────────────────────────────
def load_old_data():
    m = pd.read_csv(os.path.join(PATH_2025, 'matches.csv'))
    d = pd.read_csv(os.path.join(PATH_2025, 'deliveries.csv'))
    for col in ['team1','team2','toss_winner','winner']:
        if col in m.columns: m[col] = m[col].replace(TEAM_MAP)
    m['date'] = pd.to_datetime(m['date'], errors='coerce')
    print(f"  2008-2025 matches: {len(m):,}  deliveries: {len(d):,}")
    return m, d


def load_2026_data():
    raw = pd.read_csv(os.path.join(PATH_2026, 'matches.csv'))
    d26 = pd.read_csv(os.path.join(PATH_2026, 'deliveries.csv'))

    df = raw[raw['match_result'] == 'completed'].copy().reset_index(drop=True)
    for col in ['team1','team2','toss_winner','match_winner']:
        df[col] = df[col].map(lambda x: SHORT_TO_FULL.get(str(x).strip(), x))

    df = df.rename(columns={
        'first_ings_score' :'first_innings_score',
        'first_ings_wkts'  :'first_innings_wickets',
        'second_ings_score':'second_innings_score',
        'second_ings_wkts' :'second_innings_wickets',
        'match_result'     :'result',
        'match_winner'     :'winner',
    })

    df['win_by'] = df.apply(lambda r:
        'wickets' if pd.notna(r.get('wb_wickets')) and r.get('wb_wickets',0) > 0
        else 'runs', axis=1)
    df['toss_decision'] = df['toss_decision'].str.lower().map(
        lambda x: 'field' if x in ['bowl','field'] else 'bat')
    df['season']       = 2026
    df['result']       = 'normal'
    df['is_day_night'] = True
    df['first_innings_overs']  = 20.0
    df['second_innings_overs'] = 20.0
    df['date'] = pd.to_datetime(df['date'], format='%B %d, %Y', errors='coerce')

    for col in ['batting_team','bowling_team']:
        if col in d26.columns:
            d26[col] = d26[col].map(lambda x: SHORT_TO_FULL.get(str(x).strip(), x))

    print(f"  2026 matches: {len(df)}  deliveries: {len(d26):,}")
    return df, d26


def merge_all(m_old, d_old, m_26, d_26):
    CORE = ['date','season','venue','team1','team2',
            'toss_winner','toss_decision',
            'first_innings_score','first_innings_wickets','first_innings_overs',
            'second_innings_score','second_innings_wickets','second_innings_overs',
            'result','winner','win_by','is_day_night']

    o = m_old[[c for c in CORE if c in m_old.columns]].copy()
    n = m_26[[c for c in CORE if c in m_26.columns]].copy()
    for col in CORE:
        if col not in o.columns: o[col] = np.nan
        if col not in n.columns: n[col] = np.nan

    matches = pd.concat([o, n], ignore_index=True).sort_values('date').reset_index(drop=True)

    common = sorted(set(d_old.columns) & set(d_26.columns))
    deliveries = pd.concat([d_old[common], d_26[common]], ignore_index=True)

    print(f"  TOTAL matches: {len(matches):,} | seasons: {sorted(matches['season'].dropna().unique())}")
    return matches, deliveries


# ── STEP 2 — FAST FEATURE ENGINEERING (no row loops!) ────────────────────────
def build_features_fast(matches):
    print("  Building features (vectorized, fast)...")

    m = matches[matches['result'] == 'normal'].copy()
    m = m[m['winner'].notna()].copy()
    m = m.sort_values('date').reset_index(drop=True)
    m['match_idx'] = np.arange(len(m))

    # ── 1. Overall all-time win rate per team (pre-computed) ──────────────────
    all_teams = pd.concat([m['team1'], m['team2']]).unique()

    def overall_win_rate(team):
        played = m[(m['team1'] == team) | (m['team2'] == team)]
        return (played['winner'] == team).sum() / max(len(played), 1)

    win_rate_map = {t: overall_win_rate(t) for t in all_teams}
    m['t1_overall_wr'] = m['team1'].map(win_rate_map)
    m['t2_overall_wr'] = m['team2'].map(win_rate_map)

    # ── 2. Head-to-head win rate per pair (pre-computed) ─────────────────────
    def h2h_for_pair(t1, t2):
        h = m[((m['team1']==t1)&(m['team2']==t2))|
              ((m['team1']==t2)&(m['team2']==t1))]
        return (h['winner'] == t1).sum() / max(len(h), 1)

    pair_cache = {}
    def get_h2h(row):
        key = tuple(sorted([row['team1'], row['team2']])) + (row['team1'],)
        if key not in pair_cache:
            pair_cache[key] = h2h_for_pair(row['team1'], row['team2'])
        return pair_cache[key]

    m['h2h_rate'] = m.apply(get_h2h, axis=1)

    # ── 3. Season win rate per team ───────────────────────────────────────────
    season_wr = {}
    for season in m['season'].unique():
        sm = m[m['season'] == season]
        for team in all_teams:
            played = sm[(sm['team1']==team)|(sm['team2']==team)]
            wr = (played['winner']==team).sum() / max(len(played), 1)
            season_wr[(season, team)] = wr

    m['t1_season_wr'] = m.apply(lambda r: season_wr.get((r['season'], r['team1']), 0.5), axis=1)
    m['t2_season_wr'] = m.apply(lambda r: season_wr.get((r['season'], r['team2']), 0.5), axis=1)

    # ── 4. Venue win rate per team (pre-computed) ─────────────────────────────
    venue_wr = {}
    for venue in m['venue'].unique():
        vm = m[m['venue'] == venue]
        for team in all_teams:
            played = vm[(vm['team1']==team)|(vm['team2']==team)]
            wr = (played['winner']==team).sum() / max(len(played), 1)
            venue_wr[(venue, team)] = wr

    m['t1_venue_wr'] = m.apply(lambda r: venue_wr.get((r['venue'], r['team1']), 0.5), axis=1)
    m['t2_venue_wr'] = m.apply(lambda r: venue_wr.get((r['venue'], r['team2']), 0.5), axis=1)

    # ── 5. Toss features ──────────────────────────────────────────────────────
    m['toss_winner_is_t1'] = (m['toss_winner'] == m['team1']).astype(int)
    m['bat_first']         = (m['toss_decision'] == 'bat').astype(int)
    m['is_day_night_i']    = m['is_day_night'].astype(int)

    # ── 6. Score features ─────────────────────────────────────────────────────
    m['first_innings_score']    = pd.to_numeric(m['first_innings_score'],    errors='coerce')
    m['first_innings_wickets']  = pd.to_numeric(m['first_innings_wickets'],  errors='coerce')
    m['second_innings_score']   = pd.to_numeric(m['second_innings_score'],   errors='coerce')
    m['second_innings_wickets'] = pd.to_numeric(m['second_innings_wickets'], errors='coerce')
    m['first_innings_overs']    = pd.to_numeric(m['first_innings_overs'],    errors='coerce')

    m['run_rate_1']   = m['first_innings_score']  / m['first_innings_overs'].replace(0, np.nan)
    m['score_diff']   = m['second_innings_score'] - m['first_innings_score']
    m['wkts_in_hand'] = 10 - m['second_innings_wickets'].fillna(0)

    # ── 7. Encode teams & venue ───────────────────────────────────────────────
    le_team  = LabelEncoder()
    le_venue = LabelEncoder()
    all_team_vals = pd.concat([m['team1'], m['team2']]).unique()
    le_team.fit(all_team_vals)
    m['team1_enc']  = le_team.transform(m['team1'])
    m['team2_enc']  = le_team.transform(m['team2'])
    m['venue_enc']  = le_venue.fit_transform(m['venue'])

    # ── 8. Target — 1 if team1 wins, 0 if team2 wins ─────────────────────────
    m['target'] = (m['winner'] == m['team1']).astype(int)
    print(f"  Target balance: team1 wins={m['target'].sum()} | team2 wins={(m['target']==0).sum()}")

    print(f"  Features ready: {len(m):,} matches")
    return m, le_team, le_venue, win_rate_map, season_wr, venue_wr


# ── STEP 3 — TRAIN MODEL ──────────────────────────────────────────────────────
FEATURES = [
    'team1_enc', 'team2_enc', 'venue_enc',
    'toss_winner_is_t1', 'bat_first', 'is_day_night_i',
    't1_overall_wr', 't2_overall_wr',
    'h2h_rate',
    't1_season_wr', 't2_season_wr',
    't1_venue_wr',  't2_venue_wr',
    'first_innings_score', 'run_rate_1',
    'score_diff', 'wkts_in_hand',
]

PRE_MATCH_FEATURES = [
    'team1_enc', 'team2_enc', 'venue_enc',
    'toss_winner_is_t1', 'bat_first', 'is_day_night_i',
    't1_overall_wr', 't2_overall_wr',
    'h2h_rate',
    't1_season_wr', 't2_season_wr',
    't1_venue_wr',  't2_venue_wr',
]


def train_models(m):
    # Split: train on 2008-2025, test on 2026
    train = m[m['season'] < 2026]
    test  = m[m['season'] == 2026]

    results = {}

    for feat_name, feats in [("Pre-match (before toss)", PRE_MATCH_FEATURES),
                              ("Full-match (with scores)", FEATURES)]:
        X_tr = train[feats].fillna(0)
        y_tr = train['target']
        X_te = test[feats].fillna(0)
        y_te = test['target']

        # Also do a random split for reference
        Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(
            m[feats].fillna(0), m['target'], test_size=0.2, random_state=42)

        sc  = StandardScaler()
        clf = GradientBoostingClassifier(n_estimators=200, max_depth=4,
                                          learning_rate=0.05, random_state=42)
        clf.fit(sc.fit_transform(Xr_tr), yr_tr)

        acc_split = accuracy_score(yr_te, clf.predict(sc.transform(Xr_te)))
        acc_2026  = accuracy_score(y_te,  clf.predict(sc.transform(X_te))) if len(X_te) > 0 else 0

        print(f"\n  [{feat_name}]")
        print(f"    Random split accuracy : {acc_split*100:.1f}%")
        print(f"    2026 holdout accuracy : {acc_2026*100:.1f}%")

        results[feat_name] = (clf, sc, acc_split, acc_2026)

    # Save the pre-match model (most useful for predictions)
    clf_pre, sc_pre, _, _ = results["Pre-match (before toss)"]
    clf_full, sc_full, _, _ = results["Full-match (with scores)"]

    joblib.dump(clf_pre,  os.path.join(SAVE_DIR, 'ipl_clf_pre.pkl'))
    joblib.dump(sc_pre,   os.path.join(SAVE_DIR, 'ipl_scaler_pre.pkl'))
    joblib.dump(clf_full, os.path.join(SAVE_DIR, 'ipl_clf_full.pkl'))
    joblib.dump(sc_full,  os.path.join(SAVE_DIR, 'ipl_scaler_full.pkl'))
    joblib.dump(m,        os.path.join(SAVE_DIR, 'ipl_matches_processed.pkl'))
    joblib.dump(le_team,      os.path.join(SAVE_DIR, 'ipl_le_team.pkl'))
    joblib.dump(le_venue,     os.path.join(SAVE_DIR, 'ipl_le_venue.pkl'))
    joblib.dump(win_rate_map, os.path.join(SAVE_DIR, 'ipl_win_rate.pkl'))
    joblib.dump(season_wr,    os.path.join(SAVE_DIR, 'ipl_season_wr.pkl'))
    joblib.dump(venue_wr,     os.path.join(SAVE_DIR, 'ipl_venue_wr.pkl'))
    print(f"\n  Models saved to: {SAVE_DIR}")

    return clf_pre, sc_pre, clf_full, sc_full


# ── STEP 4 — EDA CHARTS ──────────────────────────────────────────────────────
def run_eda(matches):
    mn = matches[matches['result'] == 'normal'].copy()
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle("IPL 2008-2026 Analysis", fontsize=16, fontweight='bold')

    ms = mn.groupby('season').size()
    bc = ['#EC1C24' if s == 2026 else '#004BA0' for s in ms.index]
    axes[0,0].bar(ms.index, ms.values, color=bc)
    axes[0,0].set_title("Matches Per Season"); axes[0,0].set_xlabel("Season")

    avg = mn.groupby('season')['first_innings_score'].mean()
    axes[0,1].plot(avg.index, avg.values, marker='o', color='#F7A721', linewidth=2)
    axes[0,1].set_title("Avg 1st Innings Score"); axes[0,1].set_xlabel("Season")

    mn['toss_won'] = (mn['toss_winner'] == mn['winner'])
    td = mn.groupby('toss_decision')['toss_won'].mean() * 100
    axes[0,2].bar(td.index, td.values, color=['#004BA0','#F7A721'])
    axes[0,2].set_title("Toss Decision -> Win %"); axes[0,2].set_ylabel("%")

    wins = mn['winner'].value_counts().head(10)
    cols = [TEAM_COLORS.get(t, '#999') for t in wins.index]
    axes[1,0].barh(wins.index[::-1], wins.values[::-1], color=cols[::-1])
    axes[1,0].set_title("All-Time Top 10 Wins")

    wins26 = mn[mn['season']==2026]['winner'].value_counts()
    axes[1,1].bar(wins26.index, wins26.values, color='#FF6600')
    axes[1,1].set_title("IPL 2026 Wins Per Team")
    axes[1,1].tick_params(axis='x', rotation=45)

    wm = mn.groupby('win_by').size()
    axes[1,2].pie(wm.values, labels=wm.index, autopct='%1.1f%%',
                  colors=['#004BA0','#F7A721'])
    axes[1,2].set_title("Win Method: Runs vs Wickets")

    plt.tight_layout()
    out = os.path.join(SAVE_DIR, 'eda_2008_2026.png')
    plt.savefig(out, bbox_inches='tight', dpi=120)
    plt.close()   # <-- don't block, just save and continue
    print(f"  EDA saved -> {out}")


# ── STEP 5 — PREDICT ANY MATCH ────────────────────────────────────────────────
def predict_match(m, clf, sc, le_team, le_venue,
                  win_rate_map, season_wr, venue_wr,
                  team1, team2, venue,
                  toss_winner=None, toss_decision='bat',
                  is_day_night=True):

    t1_enc = le_team.transform([team1])[0] if team1 in le_team.classes_ else 0
    t2_enc = le_team.transform([team2])[0] if team2 in le_team.classes_ else 0
    v_enc  = le_venue.transform([venue])[0] if venue in le_venue.classes_ else 0

    tw   = 1 if toss_winner == team1 else 0
    bat  = 1 if toss_decision == 'bat' else 0
    dn   = int(is_day_night)

    t1_wr   = win_rate_map.get(team1, 0.5)
    t2_wr   = win_rate_map.get(team2, 0.5)
    h2h     = 0.5  # neutral for future match

    t1_swr  = season_wr.get((2026, team1), t1_wr)
    t2_swr  = season_wr.get((2026, team2), t2_wr)
    t1_vwr  = venue_wr.get((venue, team1), t1_wr)
    t2_vwr  = venue_wr.get((venue, team2), t2_wr)

    row = np.array([[t1_enc, t2_enc, v_enc, tw, bat, dn,
                     t1_wr, t2_wr, h2h,
                     t1_swr, t2_swr, t1_vwr, t2_vwr]])

    proba = clf.predict_proba(sc.transform(row))[0]
    # proba[1] = probability that team1 wins (target=1)
    # proba[0] = probability that team2 wins (target=0)
    t1_p, t2_p = proba[1], proba[0]
    winner = FULL_TO_SHORT.get(team1, team1) if t1_p > t2_p else FULL_TO_SHORT.get(team2, team2)
    conf   = max(t1_p, t2_p)

    t1s = FULL_TO_SHORT.get(team1, team1)
    t2s = FULL_TO_SHORT.get(team2, team2)
    bar1 = '█' * int(t1_p * 20)
    bar2 = '█' * int(t2_p * 20)

    print('\n' + '='*55)
    print(f'  IPL MATCH PREDICTION')
    print(f'  {team1}  vs  {team2}')
    print(f'  Venue: {venue}')
    print('='*55)
    print(f'  Predicted Winner : *** {winner} ***')
    print(f'  Confidence       : {conf*100:.1f}%')
    print(f'  {t1s:<6}: {t1_p*100:5.1f}%  {bar1}')
    print(f'  {t2s:<6}: {t2_p*100:5.1f}%  {bar2}')
    print('='*55)

    return {team1: round(t1_p, 4), team2: round(t2_p, 4)}


# ── STEP 6 — PLAYOFF MATRIX ───────────────────────────────────────────────────
def playoff_matrix(m, clf, sc, le_team, le_venue,
                   win_rate_map, season_wr, venue_wr, top4, venue):
    print('\n PLAYOFF WIN PROBABILITY MATRIX')
    print('='*70)
    header = f'{"":26}' + ''.join(f'{FULL_TO_SHORT.get(t,t):>10}' for t in top4)
    print(header); print('-'*70)
    for t1 in top4:
        row = f'{FULL_TO_SHORT.get(t1,t1):<26}'
        for t2 in top4:
            if t1 == t2:
                row += f'{"---":>10}'
            else:
                res = predict_match(m, clf, sc, le_team, le_venue,
                                    win_rate_map, season_wr, venue_wr,
                                    t1, t2, venue)
                row += f'{res[t1]*100:>9.1f}%'
        print(row)
    print('='*70)


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    print("\n" + "="*55)
    print("  IPL MODEL 2008-2026  |  FAST VERSION")
    print("="*55)

    print("\n[1] Loading data...")
    m_old, d_old = load_old_data()
    m_26,  d_26  = load_2026_data()

    print("\n[2] Merging datasets...")
    matches, deliveries = merge_all(m_old, d_old, m_26, d_26)

    print("\n[3] EDA charts...")
    run_eda(matches)

    print("\n[4] Building features (fast, vectorized)...")
    m, le_team, le_venue, win_rate_map, season_wr, venue_wr = build_features_fast(matches)

    print("\n[5] Training models...")
    clf_pre, sc_pre, clf_full, sc_full = train_models(m)

    print("\n[6] Sample prediction...")
    predict_match(
        m, clf_pre, sc_pre, le_team, le_venue,
        win_rate_map, season_wr, venue_wr,
        team1        = 'Mumbai Indians',
        team2        = 'Chennai Super Kings',
        venue        = 'Wankhede Stadium, Mumbai',
        toss_winner  = 'Mumbai Indians',
        toss_decision= 'bat',
        is_day_night = True
    )

    print("\n[7] Playoff matrix...")
    TOP4 = [
        'Punjab Kings',
        'Royal Challengers Bangalore',
        'Sunrisers Hyderabad',
        'Rajasthan Royals',
    ]
    playoff_matrix(
        m, clf_pre, sc_pre, le_team, le_venue,
        win_rate_map, season_wr, venue_wr,
        top4=TOP4,
        venue='Narendra Modi Stadium, Ahmedabad'
    )

    print("\nDone! All models saved to:", SAVE_DIR)

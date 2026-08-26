import { useEffect, useState } from 'react';
import { fetchAllAnalysis } from '../api/analysisApi';
import { fetchWeatherRange } from '../api/weatherApi';
import { MOOD_TAGS, REASON_TAGS } from '../constants/emotionTags';
import {
  WEEKDAY_LABELS,
  SEASON_LABELS,
  weekdayOf,
  seasonOf,
  computeTagFrequencyByGroup,
  findStandoutInsight,
} from '../utils/insightUtils';

const MIN_RECORDS = 5;

const MOOD_COLORS = ['var(--sun-red)', '#767961', '#c6c9ad', 'var(--lime-deep)'];

function MoodBreakdownCard({ icon, title, groupLabels, byGroup, emptyNote }) {
  const groups = Object.keys(byGroup);
  if (groups.length === 0) {
    return (
      <div className="blob-card" style={{ marginTop: 20 }}>
        <span className="blob-card-heading">
          <span className="material-symbol">{icon}</span>
          {title}
        </span>
        <p className="text-soft">{emptyNote}</p>
      </div>
    );
  }

  const labels = groupLabels ?? groups;

  return (
    <div className="blob-card" style={{ marginTop: 20 }}>
      <span className="blob-card-heading">
        <span className="material-symbol">{icon}</span>
        {title}
      </span>
      <div className="insight-weekday-list">
        {labels.map((label) => {
          const group = byGroup[label];
          if (!group) return null;
          return (
            <div key={label} className="insight-weekday-block">
              <span className="insight-weekday-name">
                {label} · 기록 {group.total}개
              </span>
              <div className="style-bar-list">
                {MOOD_TAGS.map((tag, ti) => (
                  <div key={tag} className="style-bar-row">
                    <div className="style-bar-top">
                      <span className="style-bar-label">{tag}</span>
                      <div className="style-bar-track">
                        <div
                          className="style-bar-fill"
                          style={{ '--target-width': `${group.percents[tag]}%`, background: MOOD_COLORS[ti] }}
                        />
                      </div>
                      <span className="style-bar-percent">{group.percents[tag]}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalysisInsight({ onBack }) {
  const [analyses, setAnalyses] = useState(undefined);
  const [weatherByDate, setWeatherByDate] = useState(undefined);

  useEffect(() => {
    fetchAllAnalysis()
      .then(setAnalyses)
      .catch(() => setAnalyses([]));
  }, []);

  useEffect(() => {
    if (!analyses || analyses.length === 0) {
      setWeatherByDate({});
      return;
    }
    const dates = analyses.map((a) => a.recordDate).sort();
    fetchWeatherRange(dates[0], dates[dates.length - 1])
      .then(setWeatherByDate)
      .catch(() => setWeatherByDate({}));
  }, [analyses]);

  const usable = (analyses ?? []).filter((a) => a.selectedTags && a.selectedTags.trim());

  const moodByWeekday = computeTagFrequencyByGroup(
    usable.map((a) => ({ recordDate: a.recordDate, tagsValue: a.selectedTags })),
    MOOD_TAGS,
    (r) => weekdayOf(r.recordDate),
  );
  const moodBySeason = computeTagFrequencyByGroup(
    usable.map((a) => ({ recordDate: a.recordDate, tagsValue: a.selectedTags })),
    MOOD_TAGS,
    (r) => seasonOf(r.recordDate),
  );
  const usableWithWeather = weatherByDate
    ? usable.filter((a) => weatherByDate[a.recordDate])
    : [];
  const moodByWeather = computeTagFrequencyByGroup(
    usableWithWeather.map((a) => ({ recordDate: a.recordDate, tagsValue: a.selectedTags })),
    MOOD_TAGS,
    (r) => weatherByDate[r.recordDate],
  );

  const reasonByWeekday = computeTagFrequencyByGroup(
    (analyses ?? [])
      .filter((a) => a.reasonTags && a.reasonTags.trim())
      .map((a) => ({ recordDate: a.recordDate, tagsValue: a.reasonTags })),
    REASON_TAGS,
  );

  const weekdayHeadline = findStandoutInsight(moodByWeekday, '오늘 최악', WEEKDAY_LABELS);
  const seasonHeadline = findStandoutInsight(moodBySeason, '오늘 최악');
  const weatherHeadline =
    usableWithWeather.length >= MIN_RECORDS ? findStandoutInsight(moodByWeather, '오늘 최악') : null;

  const reasonTotals = REASON_TAGS.map((tag) => ({
    tag,
    count: Object.values(reasonByWeekday).reduce((sum, g) => sum + g.counts[tag], 0),
  })).filter((r) => r.count > 0);

  const headlines = [weekdayHeadline, seasonHeadline, weatherHeadline].filter(Boolean);

  return (
    <div>
      <div className="top-bar">
        <span style={{ width: 36 }} />
        <span className="analysis-top-bar-title">나의 옷장</span>
        <span style={{ width: 36 }} />
      </div>

      <div className="page">
        <div className="month-header">
          <button className="month-nav-btn" onClick={onBack}>
            <span className="material-symbol">arrow_back</span>
          </button>
          <span className="month-label">감정×스타일 리포트</span>
          <span style={{ width: 40 }} />
        </div>

        {analyses === undefined && <div className="page-center">불러오는 중...</div>}

        {analyses && usable.length < MIN_RECORDS && (
          <div className="page-center">
            <p className="text-soft">
              더 기록이 쌓이면 분석해드릴게요! (현재 {usable.length}개 · {MIN_RECORDS}개부터 분석 가능)
            </p>
          </div>
        )}

        {analyses && usable.length >= MIN_RECORDS && (
          <>
            {headlines.map((h, i) => (
              <div
                key={i}
                className="blob-card fact-bomb-trigger"
                style={{ marginBottom: i === headlines.length - 1 ? 0 : 12 }}
              >
                <span className="blob-card-heading" style={{ color: 'inherit' }}>
                  <span className="material-symbol">insights</span>
                  발견한 패턴
                </span>
                <p style={{ margin: 0, fontSize: 16 }}>
                  <strong>{h.label}</strong>엔 유독 '오늘 최악' 비율이 높아요 ({h.percent}%)
                </p>
              </div>
            ))}

            <MoodBreakdownCard
              icon="calendar_view_week"
              title="요일별 기분 분포"
              groupLabels={WEEKDAY_LABELS}
              byGroup={moodByWeekday}
            />

            <MoodBreakdownCard
              icon="eco"
              title="계절별 기분 분포"
              groupLabels={SEASON_LABELS}
              byGroup={moodBySeason}
            />

            {weatherByDate !== undefined && (
              <MoodBreakdownCard
                icon="partly_cloudy_day"
                title="날씨별 기분 분포"
                groupLabels={undefined}
                byGroup={moodByWeather}
                emptyNote="이 기간 날씨 데이터를 아직 못 찾았어요."
              />
            )}

            <div className="blob-card" style={{ marginTop: 20 }}>
              <span className="blob-card-heading">
                <span className="material-symbol">sell</span>
                자주 나온 이유 태그
              </span>
              {reasonTotals.length > 0 ? (
                <div className="report-chip-row">
                  {reasonTotals.map(({ tag, count }) => (
                    <span key={tag} className="item-tag-chip muted">
                      {tag} {count}회
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-soft">아직 이유 태그를 남긴 기록이 없어요.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'calendar', label: '캘린더', icon: 'calendar_month' },
  { key: 'insight', label: '분석', icon: 'monitoring' },
  { key: 'magazine', label: '매거진', icon: 'auto_stories' },
  { key: 'community', label: '커뮤니티', icon: 'groups' },
  { key: 'profile', label: '프로필', icon: 'person' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`bottom-nav-item ${active === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="material-symbol">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

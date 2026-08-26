export default function ComingSoon({ title, icon }) {
  return (
    <div className="page-center">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          <span className="material-symbol">{icon}</span>
        </div>
        <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{title} 준비중이에요</h2>
        <p className="text-soft">곧 만나볼 수 있어요 🌱</p>
      </div>
    </div>
  );
}

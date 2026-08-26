import { useEffect, useState } from 'react';
import { fetchOutfits } from '../api/outfitApi';
import AnalysisGallery from './AnalysisGallery';
import AnalysisDetail from './AnalysisDetail';
import AnalysisInsight from './AnalysisInsight';
import StylistPage from './StylistPage';

export default function AnalysisPage({ token }) {
  const [outfits, setOutfits] = useState([]);
  const [view, setView] = useState('gallery');
  const [selectedDate, setSelectedDate] = useState(null);

  function loadOutfits() {
    fetchOutfits()
      .then(setOutfits)
      .catch((e) => console.error(e));
  }

  useEffect(() => {
    loadOutfits();
  }, []);

  function openDetail(dateKey) {
    setSelectedDate(dateKey);
    setView('detail');
  }

  function backToGallery() {
    setSelectedDate(null);
    setView('gallery');
  }

  if (view === 'insight') {
    return <AnalysisInsight onBack={backToGallery} />;
  }

  if (view === 'stylist') {
    return <StylistPage token={token} onBack={backToGallery} />;
  }

  if (view === 'detail' && selectedDate) {
    return <AnalysisDetail dateKey={selectedDate} onBack={backToGallery} />;
  }

  return (
    <AnalysisGallery
      outfits={outfits}
      onSelect={openDetail}
      onOpenInsight={() => setView('insight')}
      onOpenStylist={() => setView('stylist')}
      onOutfitsChanged={loadOutfits}
    />
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Mock data for the prototype
const mockScans = [
  {
    id: '1',
    date: '8/5/2025',
    batch: '23',
    thumbnail: '/ui-playground-pk-img/1600.jpg',
    selected: true,
    cards: [
      { id: '1', name: "Cynthia's Ambition", set: "Crown Zenith", number: "9/144", image: "/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg" },
      { id: '2', name: "Garchomp EX", set: "Twilight Masquerade", number: "9/144", image: "/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg" },
      { id: '3', name: "Garchomp V", set: "Twilight Masquerade", number: "9/144", image: "/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg" },
      { id: '4', name: "Garchomp and Giratina", set: "Twilight Masquerade", number: "9/144", image: "/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg" },
      { id: '5', name: "Snorlax", set: "Twilight Masquerade", number: "9/144", image: "/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg" }
    ]
  },
  {
    id: '2',
    date: '8/5/2025',
    batch: '23',
    thumbnail: '/ui-playground-pk-img/1600.jpg',
    selected: false,
    cards: []
  },
  {
    id: '3',
    date: '8/5/2025',
    batch: '23',
    thumbnail: '/ui-playground-pk-img/1600.jpg',
    selected: false,
    cards: []
  },
  {
    id: '4',
    date: '8/5/2025',
    batch: '23',
    thumbnail: '/ui-playground-pk-img/1600.jpg',
    selected: false,
    cards: []
  }
];

export default function ArclitePrototypePage() {
  const [selectedScan, setSelectedScan] = useState(mockScans[0]);

  return (
    <div className="arclite-prototype">
      {/* Top Header Bar */}
      <header className="arclite-header">
        <div className="arclite-header__left">
          <div className="arclite-logo">
            <span className="arclite-logo__text">Arclite</span>
          </div>
          <button className="arclite-header__nav-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
        
        <div className="arclite-header__center">
          <button className="arclite-header__search-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Search
          </button>
        </div>
        
        <div className="arclite-header__right">
          <Button variant="primary" className="arclite-header__upload-button">
            UPLOAD SCAN
          </Button>
        </div>
      </header>

      <div className="arclite-main">
        {/* Left Sidebar */}
        <aside className="arclite-sidebar">
          <nav className="arclite-nav">
            <Link href="#" className="arclite-nav__item arclite-nav__item--active">
              Collection
            </Link>
            <Link href="#" className="arclite-nav__item">
              Binders
            </Link>
            <Link href="#" className="arclite-nav__item">
              Scan History
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="arclite-content">
          <div className="arclite-content__left">
            <div className="arclite-scans">
              <h2 className="arclite-scans__title">Scans</h2>
              <div className="arclite-scans__list">
                {mockScans.map((scan) => (
                  <div
                    key={scan.id}
                    className={`arclite-scan-item ${scan.selected ? 'arclite-scan-item--selected' : ''}`}
                    onClick={() => setSelectedScan(scan)}
                  >
                    <div className="arclite-scan-item__thumbnail">
                      <img src={scan.thumbnail} alt="Scan thumbnail" />
                    </div>
                    <div className="arclite-scan-item__info">
                      <div className="arclite-scan-item__title">
                        Scan {scan.date} Batch {scan.batch}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="arclite-content__right">
            <div className="arclite-cards">
              <h2 className="arclite-cards__title">Individual Cards</h2>
              <div className="arclite-cards__list">
                {selectedScan.cards.map((card) => (
                  <div key={card.id} className="arclite-card-item">
                    <div className="arclite-card-item__image">
                      <img src={card.image} alt={card.name} />
                    </div>
                    <div className="arclite-card-item__info">
                      <div className="arclite-card-item__name">{card.name}</div>
                      <div className="arclite-card-item__set">{card.set}</div>
                      <div className="arclite-card-item__number">{card.number}</div>
                    </div>
                    <div className="arclite-card-item__actions">
                      <button className="arclite-card-item__change-button">
                        Change
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .arclite-prototype {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
          color: #ffffff;
        }

        /* Header Styles */
        .arclite-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sds-size-space-400) var(--sds-size-space-600);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .arclite-header__left {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-300);
        }

        .arclite-logo__text {
          font-size: var(--font-size-500);
          font-weight: 700;
          color: #4ade80;
        }

        .arclite-header__nav-button {
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: var(--sds-size-space-200);
          border-radius: var(--sds-size-radius-100);
          transition: background-color 0.2s;
        }

        .arclite-header__nav-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .arclite-header__center {
          display: flex;
          align-items: center;
        }

        .arclite-header__search-button {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-200);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: var(--sds-size-space-200) var(--sds-size-space-400);
          border-radius: var(--sds-size-radius-200);
          cursor: pointer;
          transition: all 0.2s;
        }

        .arclite-header__search-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .arclite-header__upload-button {
          background: #4ade80;
          color: #0f2027;
          border: none;
          padding: var(--sds-size-space-200) var(--sds-size-space-400);
          border-radius: var(--sds-size-radius-200);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .arclite-header__upload-button:hover {
          background: #22c55e;
          transform: translateY(-1px);
        }

        /* Main Layout */
        .arclite-main {
          display: flex;
          height: calc(100vh - 80px);
        }

        /* Sidebar Styles */
        .arclite-sidebar {
          width: 200px;
          background: rgba(255, 255, 255, 0.03);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: var(--sds-size-space-400);
        }

        .arclite-nav {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-200);
        }

        .arclite-nav__item {
          display: block;
          padding: var(--sds-size-space-300) var(--sds-size-space-400);
          color: #ffffff;
          text-decoration: none;
          border-radius: var(--sds-size-radius-200);
          transition: all 0.2s;
          font-weight: 500;
        }

        .arclite-nav__item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .arclite-nav__item--active {
          background: #4ade80;
          color: #0f2027;
          font-weight: 600;
        }

        /* Content Area */
        .arclite-content {
          flex: 1;
          display: flex;
          gap: var(--sds-size-space-400);
          padding: var(--sds-size-space-400);
        }

        .arclite-content__left {
          flex: 1;
          max-width: 400px;
        }

        .arclite-content__right {
          flex: 2;
        }

        /* Scans Section */
        .arclite-scans__title {
          margin: 0 0 var(--sds-size-space-400) 0;
          font-size: var(--font-size-400);
          font-weight: 600;
          color: #ffffff;
        }

        .arclite-scans__list {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-300);
        }

        .arclite-scan-item {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-300);
          padding: var(--sds-size-space-300);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--sds-size-radius-200);
          cursor: pointer;
          transition: all 0.2s;
        }

        .arclite-scan-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .arclite-scan-item--selected {
          background: rgba(74, 222, 128, 0.2);
          border-color: #4ade80;
        }

        .arclite-scan-item__thumbnail {
          width: 60px;
          height: 60px;
          border-radius: var(--sds-size-radius-100);
          overflow: hidden;
          flex-shrink: 0;
        }

        .arclite-scan-item__thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .arclite-scan-item__title {
          font-weight: 500;
          color: #ffffff;
          font-size: var(--font-size-100);
        }

        /* Cards Section */
        .arclite-cards__title {
          margin: 0 0 var(--sds-size-space-400) 0;
          font-size: var(--font-size-400);
          font-weight: 600;
          color: #ffffff;
        }

        .arclite-cards__list {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-300);
        }

        .arclite-card-item {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-400);
          padding: var(--sds-size-space-400);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--sds-size-radius-200);
          transition: all 0.2s;
        }

        .arclite-card-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .arclite-card-item__image {
          width: 80px;
          height: 112px;
          border-radius: var(--sds-size-radius-100);
          overflow: hidden;
          flex-shrink: 0;
        }

        .arclite-card-item__image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .arclite-card-item__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-100);
        }

        .arclite-card-item__name {
          font-weight: 600;
          color: #ffffff;
          font-size: var(--font-size-200);
        }

        .arclite-card-item__set {
          color: #a1a1aa;
          font-size: var(--font-size-75);
        }

        .arclite-card-item__number {
          color: #a1a1aa;
          font-size: var(--font-size-75);
        }

        .arclite-card-item__change-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: var(--sds-size-space-200) var(--sds-size-space-300);
          border-radius: var(--sds-size-radius-100);
          cursor: pointer;
          transition: all 0.2s;
          font-size: var(--font-size-75);
        }

        .arclite-card-item__change-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .arclite-main {
            flex-direction: column;
          }

          .arclite-sidebar {
            width: 100%;
            height: auto;
          }

          .arclite-content {
            flex-direction: column;
          }

          .arclite-content__left {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
} 
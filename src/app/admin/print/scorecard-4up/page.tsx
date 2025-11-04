"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

function ScorecardPrint4UpContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState({
    evaluatorName: '',
    programCode: '',
    programName: '',
    section: '',
    chestNumbers: [] as string[],
    candidates: [] as Array<{ chestNumber: string, name: string, team: string }>
  });

  useEffect(() => {
    // Get data from URL parameters
    const evaluatorName = searchParams.get('evaluator') || '';
    const programCode = searchParams.get('code') || '';
    const programName = searchParams.get('name') || '';
    const section = searchParams.get('section') || '';
    const chestNumbers = searchParams.get('participants')?.split(',') || [];
    const candidateDataStr = searchParams.get('candidateData') || '[]';

    let candidates = [];
    try {
      candidates = JSON.parse(candidateDataStr);
    } catch (e) {
      console.error('Error parsing candidate data:', e);
      candidates = [];
    }

    setData({
      evaluatorName,
      programCode,
      programName,
      section,
      chestNumbers,
      candidates
    });

    // Auto-print when page loads
    setTimeout(() => {
      window.print();
    }, 500);
  }, [searchParams]);

  // Create 4 scorecard components
  const renderScorecard = (cardIndex: number) => (
    <div key={cardIndex} className="scorecard">
      {/* HEADER */}
      <header className="header">
        <div className="header-title">
          <h1>WATTAQA ARTS FEST 2025</h1>
          <p>SCORE CARD</p>
        </div>
        <div className="logo-section">
          <div className="logo">
            <img src="/images/festival-logo.png" alt="Festival Logo" style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '2px' }} />
          </div>
          <p><strong>wattaqa</strong><br />Arts fest 2025</p>
        </div>
      </header>

      {/* INFO SECTION */}
      <section className="info-section">
        <div className="info-row evaluator">
          <div className="label">NAME OF EVALUATOR</div>
          <div className="input">{data.evaluatorName || ''}</div>
        </div>
        <div className="info-row program">
          <div className="label">NAME OF PROGRAM</div>
          <div className="program-columns">
            <div className="program-col program-left">{data.programName || ''}</div>
            <div className="program-col program-right">{data.section ? data.section.toUpperCase() : ''}</div>
          </div>
        </div>
      </section>

      {/* TABLE SECTION */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>SL NO</th>
              <th>Chess no</th>
              <th>TEAM CODE</th>
              <th>NAME</th>
              <th>CODE LETTER</th>
            </tr>
          </thead>
          <tbody>
            {data.candidates.length > 0 ? (
              data.candidates.map((candidate, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{candidate.chestNumber}</td>
                  <td>{candidate.team ? candidate.team.charAt(0).toUpperCase() : ''}</td>
                  <td>{candidate.name}</td>
                  <td></td>
                </tr>
              ))
            ) : (
              // Show minimum 5 empty rows if no participants
              Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))
            )}
            {/* Add extra empty rows if needed to maintain minimum table height */}
            {data.candidates.length > 0 && data.candidates.length < 5 &&
              Array.from({ length: 5 - data.candidates.length }, (_, index) => (
                <tr key={`extra-${index}`}>
                  <td>{data.candidates.length + index + 1}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WATTAQA ARTS FEST 2025 - SCORE CARD</title>
        <style>{`
          /* ---------- RESET ---------- */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Poppins", sans-serif;
          }

          /* ---------- PAGE ---------- */
          body {
            background: #fff;
            display: flex;
            justify-content: center;
            padding: 20px;
          }

          /* ---------- MAIN CONTAINER FOR 4 CARDS ---------- */
          .print-container {
            width: 100%;
            max-width: 210mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 4mm;
            height: 297mm;
            padding: 6mm;
          }

          /* ---------- MAIN CARD ---------- */
          .scorecard {
            width: 100%;
            max-width: 99mm;
            border: 1px solid #000;
            background: #fff;
            display: flex;
            flex-direction: column;
            height: 142.5mm;
          }

          /* ---------- HEADER ---------- */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #000;
            color: #fff;
            padding: 8px 10px;
          }

          .header-title {
            text-align: left;
          }

          .header-title h1 {
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .header-title p {
            font-size: 0.5rem;
            font-weight: 600;
            margin-top: 2px;
          }

          .logo-section {
            display: flex;
            align-items: center;
            gap: 5px;
            background: #fff;
            color: #000;
            padding: 3px 7px;
            border: 1px solid #000;
            border-radius: 2px;
          }

          .logo {
            width: 18px;
            height: 18px;
            background: #000;
            border-radius: 2px;
          }

          .logo-section p {
            font-size: 0.4rem;
            line-height: 1.1;
          }

          /* ---------- INFO SECTION ---------- */
          .info-section {
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
          }

          .info-row {
            display: flex;
            align-items: stretch;
            border-top: 1px solid #000;
            min-height: 23px;
          }

          .info-row:first-child {
            border-top: none;
          }

          .label {
            flex: 0 0 35%;
            font-weight: 700;
            padding: 5px;
            border-right: 1px solid #000;
            font-size: 0.45rem;
            display: flex;
            align-items: center;
          }

          .input {
            flex: 1;
            padding: 5px;
            font-size: 0.45rem;
          }

          /* ---------- PROGRAM ROW ---------- */
          .program {
            background: #eef6e8;
          }

          .program-columns {
            flex: 1;
            display: flex;
            width: 100%;
          }

          .program-col {
            border-left: 1px solid #000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 600;
            text-align: center;
            font-size: 0.45rem;
          }

          .program-left {
            flex: 55%;
          }

          .program-right {
            flex: 45%;
          }

          /* ---------- TABLE ---------- */
          .table-wrapper {
            width: 100%;
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            flex: 1;
          }

          th, td {
            border: 1px solid #000;
            text-align: center;
            padding: 4px;
            font-size: 0.45rem;
          }

          thead th {
            background: #000;
            color: #fff;
            font-weight: 700;
            padding: 5px 2px;
          }

          tbody td {
            height: 21px;
            min-height: 21px;
          }

          /* ---------- COLUMN WIDTHS ---------- */
          table th:nth-child(1),
          table td:nth-child(1),
          table th:nth-child(3),
          table td:nth-child(3) {
            width: 10%;
          }

          table th:nth-child(2),
          table td:nth-child(2) {
            width: 15%;
          }

          table th:nth-child(4),
          table td:nth-child(4) {
            width: 50%;
          }

          table th:nth-child(5),
          table td:nth-child(5) {
            width: 15%;
          }

          /* ---------- PRINT (A4) ---------- */
          @media print {
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }

            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              width: 210mm !important;
              height: 297mm !important;
            }

            .print-container {
              width: 210mm !important;
              height: 297mm !important;
              max-width: 210mm !important;
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              grid-template-rows: 1fr 1fr !important;
              gap: 4mm !important;
              padding: 6mm !important;
              page-break-after: always !important;
              box-sizing: border-box !important;
            }

            .scorecard {
              width: 99mm !important;
              height: 142.5mm !important;
              max-width: 99mm !important;
              border: 1px solid #000 !important;
              background: #fff !important;
              display: flex !important;
              flex-direction: column !important;
              box-sizing: border-box !important;
            }

            .header {
              background: #000 !important;
              color: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              padding: 8px 10px !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
            }

            .header-title {
              text-align: left !important;
            }

            .header-title h1 {
              font-size: 0.65rem !important;
              font-weight: 700 !important;
              letter-spacing: 0.5px !important;
              color: #fff !important;
            }

            .header-title p {
              font-size: 0.5rem !important;
              font-weight: 600 !important;
              margin-top: 2px !important;
              color: #fff !important;
            }

            .logo-section {
              display: flex !important;
              align-items: center !important;
              gap: 5px !important;
              background: #fff !important;
              color: #000 !important;
              padding: 3px 7px !important;
              border: 1px solid #000 !important;
              border-radius: 2px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .logo {
              width: 18px !important;
              height: 18px !important;
              background: #fff !important;
              border-radius: 2px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important;
            }

            .logo img {
              width: 18px !important;
              height: 18px !important;
              object-fit: cover !important;
              border-radius: 2px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .logo-section p {
              font-size: 0.4rem !important;
              line-height: 1.1 !important;
              color: #000 !important;
            }

            .info-section {
              border-left: 1px solid #000 !important;
              border-right: 1px solid #000 !important;
              border-bottom: 1px solid #000 !important;
            }

            .info-row {
              display: flex !important;
              align-items: stretch !important;
              border-top: 1px solid #000 !important;
              min-height: 23px !important;
            }

            .info-row:first-child {
              border-top: none !important;
            }

            .label {
              flex: 0 0 35% !important;
              font-weight: 700 !important;
              padding: 5px !important;
              border-right: 1px solid #000 !important;
              font-size: 0.45rem !important;
              display: flex !important;
              align-items: center !important;
            }

            .input {
              flex: 1 !important;
              padding: 5px !important;
              font-size: 0.45rem !important;
            }

            .program {
              background: #eef6e8 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .program-columns {
              flex: 1 !important;
              display: flex !important;
              width: 100% !important;
            }

            .program-col {
              border-left: 1px solid #000 !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              font-weight: 600 !important;
              text-align: center !important;
              font-size: 0.45rem !important;
            }

            .program-left {
              flex: 55% !important;
            }

            .program-right {
              flex: 45% !important;
            }

            .table-wrapper {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              width: 100% !important;
            }

            table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              flex: 1 !important;
            }

            th, td {
              border: 1px solid #000 !important;
              text-align: center !important;
              padding: 4px !important;
              font-size: 0.45rem !important;
            }

            thead th {
              background: #000 !important;
              color: #fff !important;
              font-weight: 700 !important;
              padding: 5px 2px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            tbody td {
              height: 21px !important;
              min-height: 21px !important;
            }

            table th:nth-child(1),
            table td:nth-child(1),
            table th:nth-child(3),
            table td:nth-child(3) {
              width: 10% !important;
            }

            table th:nth-child(2),
            table td:nth-child(2) {
              width: 15% !important;
            }

            table th:nth-child(4),
            table td:nth-child(4) {
              width: 50% !important;
            }

            table th:nth-child(5),
            table td:nth-child(5) {
              width: 15% !important;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="print-container">
          {Array.from({ length: 4 }, (_, index) => renderScorecard(index))}
        </div>
      </body>
    </html>
  );
}

export default function ScorecardPrint4UpPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ScorecardPrint4UpContent />
    </Suspense>
  );
}
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function JudgmentPrint4UpPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState({
        evaluatorName: '',
        programCode: '',
        programName: '',
        section: '',
        chestNumbers: [] as string[],
        candidates: [] as Array<{chestNumber: string, name: string, team: string}>
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
                        <img src="/images/festival-logo.png" alt="Festival Logo" style={{width: '18px', height: '18px', objectFit: 'cover', borderRadius: '2px'}} />
                    </div>
                    <p><strong>wattaqa</strong><br />Arts fest 2025</p>
                </div>
            </header>

            {/* INFO SECTION */}
            <section className="info-section">
                <div className="info-row">
                    <div className="label">NAME OF EVALUATOR</div>
                    <div className="input">{data.evaluatorName || ''}</div>
                </div>
                <div className="info-row program-row">
                    <div className="label">NAME OF PROGRAM</div>
                    <div className="input program-name">{data.programName || ''}</div>
                    <div className="input program-level">{data.section ? data.section.toUpperCase() : ''}</div>
                </div>
            </section>

            {/* TABLE */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>SL NO</th>
                            <th>Chess no</th>
                            <th>Code letter</th>
                            <th>Score</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.candidates.length > 0 ? (
                            data.candidates.map((candidate, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{candidate.chestNumber}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            ))
                        ) : (
                            // Show minimum 6 empty rows if no participants
                            Array.from({ length: 6 }, (_, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            ))
                        )}
                        {/* Add extra empty rows if needed to maintain minimum table height */}
                        {data.candidates.length > 0 && data.candidates.length < 6 &&
                            Array.from({ length: 6 - data.candidates.length }, (_, index) => (
                                <tr key={`extra-${index}`}>
                                    <td>{data.candidates.length + index + 1}</td>
                                    <td></td>
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
            padding: 7px 10px;
          }

          .header-title {
            text-align: left;
          }

          .header-title h1 {
            font-size: 0.55rem;
            font-weight: 700;
          }

          .header-title p {
            font-size: 0.48rem;
            font-weight: 600;
            margin-top: 1px;
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
            background: #fff;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
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
            min-height: 22px;
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
            display: flex;
            align-items: center;
          }

          /* Second row (program) with two inputs */
          .program-row .program-name,
          .program-row .program-level {
            flex: 0 0 32.5%;
            border-left: 1px solid #000;
            text-align: center;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
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
            text-align: center;
            flex: 1;
          }

          th, td {
            border: 1px solid #000;
            font-size: 0.4rem;
            padding: 4px 2px;
            vertical-align: middle;
            text-align: center;
          }

          /* ---------- TABLE HEADER ---------- */
          thead th {
            background: #000;
            color: #fff;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 5px 2px;
          }

          /* ---------- COLUMN WIDTHS ---------- */
          table th:nth-child(1),
          table td:nth-child(1) { 
            width: 10%; 
          }
          
          table th:nth-child(2),
          table td:nth-child(2) { 
            width: 18%; 
          }
          
          table th:nth-child(3),
          table td:nth-child(3) { 
            width: 16%; 
          }
          
          table th:nth-child(4),
          table td:nth-child(4) { 
            width: 16%; 
          }
          
          table th:nth-child(5),
          table td:nth-child(5) { 
            width: 16%; 
          }
          
          table th:nth-child(6),
          table td:nth-child(6) { 
            width: 24%; 
          }

          /* ---------- ROW HEIGHT ---------- */
          tbody td {
            height: 22px;
            min-height: 22px;
          }

          /* ---------- PRINT ---------- */
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
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              background: #000 !important;
              color: #fff !important;
              padding: 7px 10px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .header-title {
              text-align: left !important;
            }

            .header-title h1 {
              font-size: 0.55rem !important;
              font-weight: 700 !important;
              color: #fff !important;
            }

            .header-title p {
              font-size: 0.48rem !important;
              font-weight: 600 !important;
              margin-top: 1px !important;
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
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
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
              min-height: 22px !important;
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
              display: flex !important;
              align-items: center !important;
            }

            .program-row .program-name,
            .program-row .program-level {
              flex: 0 0 32.5% !important;
              border-left: 1px solid #000 !important;
              text-align: center !important;
              font-weight: 500 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 5px !important;
            }

            .table-wrapper {
              width: 100% !important;
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
            }

            table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              text-align: center !important;
              flex: 1 !important;
            }

            th, td {
              border: 1px solid #000 !important;
              font-size: 0.4rem !important;
              padding: 4px 2px !important;
              vertical-align: middle !important;
              text-align: center !important;
            }

            thead th {
              background: #000 !important;
              color: #fff !important;
              font-weight: 800 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.3px !important;
              padding: 5px 2px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            tbody td {
              height: 22px !important;
              min-height: 22px !important;
            }

            table th:nth-child(1),
            table td:nth-child(1) { 
              width: 10% !important; 
            }
            
            table th:nth-child(2),
            table td:nth-child(2) { 
              width: 18% !important; 
            }
            
            table th:nth-child(3),
            table td:nth-child(3) { 
              width: 16% !important; 
            }
            
            table th:nth-child(4),
            table td:nth-child(4) { 
              width: 16% !important; 
            }
            
            table th:nth-child(5),
            table td:nth-child(5) { 
              width: 16% !important; 
            }
            
            table th:nth-child(6),
            table td:nth-child(6) { 
              width: 24% !important; 
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
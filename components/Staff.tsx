import React from 'react';
import { RenderData } from '../types';
import { getNoteStepsFromC4 } from '../constants';

interface StaffProps {
  data: RenderData;
  className?: string;
  scale?: number;
}

export const Staff: React.FC<StaffProps> = ({ data, className, scale = 1 }) => {
  const width = 300;
  const height = 280; // Increased height for low notes
  const staffYStart = 100; // Top line (Line 1)
  const lineSpacing = 20;
  const staffLines = [0, 1, 2, 3, 4].map(i => staffYStart + i * lineSpacing); 
  // Lines at y: 100, 120, 140, 160, 180

  const clef = data.clef || 'treble';

  const renderNote = (noteData: NonNullable<RenderData['note']>) => {
    const pitch = noteData.pitch.match(/^([A-G])(\d)$/);
    if (!pitch) return null;

    const noteName = pitch[1];
    const octave = parseInt(pitch[2], 10);
    
    const stepsFromC4 = getNoteStepsFromC4(noteName, octave);
    
    // Calculate Y position based on Clef
    let noteY = 0;
    if (clef === 'treble') {
        noteY = 180 - (stepsFromC4 - 2) * 10;
    } else {
        noteY = 180 - (stepsFromC4 + 10) * 10;
    }

    // Stem direction logic
    const centerStep = clef === 'treble' ? 6 : -6;
    const stemDirection = stepsFromC4 >= centerStep ? 'down' : 'up';
    
    const stemHeight = 65;
    const noteColor = "black";
    
    // Stem coordinates
    const stemX = stemDirection === 'up' ? 164 : 136;
    const stemStartY = noteY + (stemDirection === 'up' ? -5 : 5);
    const stemEndY = noteY + (stemDirection === 'up' ? -stemHeight : stemHeight);

    // Ledger Lines
    const ledgerLines = [];
    const staffTop = 100;
    const staffBottom = 180;

    if (noteY < staffTop) {
        for (let y = staffTop - 20; y >= noteY; y -= 20) {
            ledgerLines.push(y);
        }
    }
    if (noteY > staffBottom) {
        for (let y = staffBottom + 20; y <= noteY; y += 20) {
            ledgerLines.push(y);
        }
    }
    
    return (
      <g>
        {/* Ledger Lines */}
        {ledgerLines.map((y, i) => (
           <line key={i} x1="130" y1={y} x2="170" y2={y} stroke="black" strokeWidth="2" />
        ))}

        {/* Note Head */}
        <ellipse 
          cx="150" 
          cy={noteY} 
          rx="16" 
          ry="11" 
          transform={`rotate(-15 150 ${noteY})`}
          fill={noteData.duration === 'whole' || noteData.duration === 'half' ? 'none' : noteColor}
          stroke={noteColor}
          strokeWidth="3"
        />

        {/* Stem */}
        {noteData.duration !== 'whole' && (
          <line 
            x1={stemX} 
            y1={stemStartY} 
            x2={stemX} 
            y2={stemEndY} 
            stroke={noteColor} 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        )}

        {/* Flags - Updated to be BULGIER (Deeper curve) */}
        {noteData.duration !== 'whole' && noteData.duration !== 'half' && noteData.duration !== 'quarter' && (
            <g fill="none" stroke={noteColor} strokeWidth="4" strokeLinecap="round">
                {stemDirection === 'up' && (
                    <>
                        {/* 8th Note Flag (Stem Up) - Control point X increased to 34 for more bulge */}
                         <path d={`M ${stemX} ${stemEndY} Q ${stemX + 34} ${stemEndY + 25} ${stemX} ${stemEndY + 50}`} />

                        {/* 16th Note Flag */}
                        {(noteData.duration === 'sixteenth' || noteData.duration === 'thirty-second') && (
                             <path d={`M ${stemX} ${stemEndY + 15} Q ${stemX + 34} ${stemEndY + 40} ${stemX} ${stemEndY + 65}`} />
                        )}

                        {/* 32nd Note Flag */}
                        {noteData.duration === 'thirty-second' && (
                             <path d={`M ${stemX} ${stemEndY + 30} Q ${stemX + 34} ${stemEndY + 55} ${stemX} ${stemEndY + 80}`} />
                        )}
                    </>
                )}
                {stemDirection === 'down' && (
                    <>
                        {/* 8th Note Flag (Stem Down) */}
                         <path d={`M ${stemX} ${stemEndY} Q ${stemX + 34} ${stemEndY - 25} ${stemX} ${stemEndY - 50}`} />

                        {/* 16th Note Flag */}
                        {(noteData.duration === 'sixteenth' || noteData.duration === 'thirty-second') && (
                             <path d={`M ${stemX} ${stemEndY - 15} Q ${stemX + 34} ${stemEndY - 40} ${stemX} ${stemEndY - 65}`} />
                        )}

                        {/* 32nd Note Flag */}
                         {noteData.duration === 'thirty-second' && (
                             <path d={`M ${stemX} ${stemEndY - 30} Q ${stemX + 34} ${stemEndY - 55} ${stemX} ${stemEndY - 80}`} />
                        )}
                    </>
                )}
            </g>
        )}
      </g>
    );
  };

  const renderClef = () => {
      if (clef === 'treble') {
          return <text x="30" y="165" fontSize="90" fontFamily="serif">𝄞</text>;
      } else {
          return <text x="30" y="145" fontSize="80" fontFamily="serif">𝄢</text>;
      }
  };

  const renderSymbol = (symbolData: NonNullable<RenderData['symbol']>) => {
    // Center of canvas is roughly 150, 140 (middle of staff area)
    if (symbolData.type === 'text') {
        return (
            <text x="150" y="150" textAnchor="middle" fontSize="60" fontWeight="bold" fontStyle="italic" fontFamily="serif">
                {symbolData.value}
            </text>
        );
    }
    
    // Shape symbols
    switch (symbolData.value) {
        case 'sharp':
            return <text x="150" y="160" textAnchor="middle" fontSize="100">♯</text>;
        case 'flat':
            return <text x="150" y="160" textAnchor="middle" fontSize="100">♭</text>;
        case 'natural':
            return <text x="150" y="160" textAnchor="middle" fontSize="100">♮</text>;
        case 'fermata':
            return (
                <g transform="translate(120, 110)">
                    <path d="M 0 30 Q 30 0 60 30" stroke="black" strokeWidth="4" fill="transparent" />
                    <circle cx="30" cy="20" r="4" fill="black" />
                </g>
            );
        case 'treble_clef':
             return <text x="150" y="190" textAnchor="middle" fontSize="150">𝄞</text>;
        case 'bass_clef':
             return <text x="150" y="170" textAnchor="middle" fontSize="120">𝄢</text>;
        case 'repeat_start':
            return (
                 <g transform="translate(130, 90)">
                    <rect x="0" y="0" width="5" height="100" fill="black" />
                    <rect x="10" y="0" width="2" height="100" fill="black" />
                    <circle cx="20" cy="40" r="4" fill="black" />
                    <circle cx="20" cy="60" r="4" fill="black" />
                 </g>
            );
        case 'tie':
             return <path d="M 100 130 Q 150 170 200 130" stroke="black" strokeWidth="3" fill="none" />;
        
        // --- RESTS ---
        case 'whole_rest':
            return <rect x="140" y="120" width="20" height="10" fill="black" />;
            
        case 'half_rest':
            return <rect x="140" y="130" width="20" height="10" fill="black" />;
            
        case 'quarter_rest':
            return <text x="150" y="170" textAnchor="middle" fontSize="120" fontFamily="serif">𝄽</text>;
            
        case 'eighth_rest':
            return <text x="150" y="160" textAnchor="middle" fontSize="100" fontFamily="serif">𝄾</text>;

        default:
            return <text x="150" y="160" textAnchor="middle">?</text>;
    }
  };

  const isSymbolWithStaff = data.symbol && ['whole_rest', 'half_rest', 'quarter_rest', 'eighth_rest'].includes(data.symbol.value);

  return (
    <div className={`flex justify-center items-center bg-white rounded-xl shadow-inner border-2 border-slate-200 p-4 ${className}`} style={{ transformOrigin: 'top left', transform: `scale(${scale})` }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Render Lines */}
        {(data.note || isSymbolWithStaff) && (
            <>
                {staffLines.map((y, i) => (
                <line key={i} x1="20" y1={y} x2={width - 20} y2={y} stroke="#333" strokeWidth="2" />
                ))}
            </>
        )}
        
        {/* Render Clef for Note questions */}
        {data.note && renderClef()}

        {/* Content */}
        {data.note && renderNote(data.note)}
        {data.symbol && renderSymbol(data.symbol)}
      </svg>
    </div>
  );
};
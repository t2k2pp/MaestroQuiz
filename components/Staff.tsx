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
        // Treble: E4 (Bottom Line) is Step 2.
        // E4 Y = 180.
        // Y = 180 - (steps - 2) * 10
        noteY = 180 - (stepsFromC4 - 2) * 10;
    } else {
        // Bass: G2 (Bottom Line) is Step -10.
        // G2 Y = 180.
        // Y = 180 - (steps - (-10)) * 10 => 180 - (steps + 10) * 10
        noteY = 180 - (stepsFromC4 + 10) * 10;
    }

    // Stem direction logic
    // Treble Center Line: B4 (Step 6).
    // Bass Center Line: D3 (Step -6).
    const centerStep = clef === 'treble' ? 6 : -6;
    const stemDirection = stepsFromC4 >= centerStep ? 'down' : 'up';
    
    const stemHeight = 65;
    const noteColor = "black";
    
    // Stem coordinates
    // Stem Up: Right of head
    // Stem Down: Left of head
    const stemX = stemDirection === 'up' ? 164 : 136;
    const stemStartY = noteY + (stemDirection === 'up' ? -5 : 5);
    const stemEndY = noteY + (stemDirection === 'up' ? -stemHeight : stemHeight);

    // Ledger Lines
    const ledgerLines = [];
    // Calculate staff bounds in Y
    const staffTop = 100;
    const staffBottom = 180;

    // Note above staff? (Y < 100) - Draw lines at 80, 60...
    if (noteY < staffTop) {
        for (let y = staffTop - 20; y >= noteY; y -= 20) {
            ledgerLines.push(y);
        }
    }
    // Note below staff? (Y > 180) - Draw lines at 200, 220...
    if (noteY > staffBottom) {
        for (let y = staffBottom + 20; y <= noteY; y += 20) {
            ledgerLines.push(y);
        }
    }

    // C4 line for specific context (Middle C)
    // In Treble: C4 is 190 (one line below).
    // In Bass: C4 is 90 (one line above).
    
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
            strokeWidth="2" 
          />
        )}

        {/* Flags - Always on the RIGHT side of the stem */}
        {noteData.duration !== 'whole' && noteData.duration !== 'half' && noteData.duration !== 'quarter' && (
            <g fill={noteColor}>
                {stemDirection === 'up' && (
                    <>
                        {/* 8th Note Flag (Stem Up) - Curving Down */}
                         <path d={`M ${stemX} ${stemEndY} C ${stemX} ${stemEndY} ${stemX + 18} ${stemEndY + 10} ${stemX + 18} ${stemEndY + 35} C ${stemX + 18} ${stemEndY + 45} ${stemX + 5} ${stemEndY + 35} ${stemX} ${stemEndY + 50} Z`} />

                        {/* 16th Note Flag */}
                        {(noteData.duration === 'sixteenth' || noteData.duration === 'thirty-second') && (
                             <path d={`M ${stemX} ${stemEndY + 15} C ${stemX} ${stemEndY + 15} ${stemX + 18} ${stemEndY + 25} ${stemX + 18} ${stemEndY + 50} C ${stemX + 18} ${stemEndY + 60} ${stemX + 5} ${stemEndY + 50} ${stemX} ${stemEndY + 65} Z`} />
                        )}

                        {/* 32nd Note Flag */}
                        {noteData.duration === 'thirty-second' && (
                             <path d={`M ${stemX} ${stemEndY + 30} C ${stemX} ${stemEndY + 30} ${stemX + 18} ${stemEndY + 40} ${stemX + 18} ${stemEndY + 65} C ${stemX + 18} ${stemEndY + 75} ${stemX + 5} ${stemEndY + 65} ${stemX} ${stemEndY + 80} Z`} />
                        )}
                    </>
                )}
                {stemDirection === 'down' && (
                    <>
                        {/* 8th Note Flag (Stem Down) - Curving Up, attached to Right side */}
                         <path d={`M ${stemX} ${stemEndY} C ${stemX} ${stemEndY} ${stemX + 18} ${stemEndY - 10} ${stemX + 18} ${stemEndY - 35} C ${stemX + 18} ${stemEndY - 45} ${stemX + 5} ${stemEndY - 35} ${stemX} ${stemEndY - 50} Z`} />

                        {/* 16th Note Flag */}
                        {(noteData.duration === 'sixteenth' || noteData.duration === 'thirty-second') && (
                             <path d={`M ${stemX} ${stemEndY - 15} C ${stemX} ${stemEndY - 15} ${stemX + 18} ${stemEndY - 25} ${stemX + 18} ${stemEndY - 50} C ${stemX + 18} ${stemEndY - 60} ${stemX + 5} ${stemEndY - 50} ${stemX} ${stemEndY - 65} Z`} />
                        )}

                        {/* 32nd Note Flag */}
                         {noteData.duration === 'thirty-second' && (
                             <path d={`M ${stemX} ${stemEndY - 30} C ${stemX} ${stemEndY - 30} ${stemX + 18} ${stemEndY - 40} ${stemX + 18} ${stemEndY - 65} C ${stemX + 18} ${stemEndY - 75} ${stemX + 5} ${stemEndY - 65} ${stemX} ${stemEndY - 80} Z`} />
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
            // Rectangle hanging from the 2nd line (y=120)
            return <rect x="140" y="120" width="20" height="10" fill="black" />;
            
        case 'half_rest':
            // Rectangle sitting on the 3rd line (y=140)
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
    <div className={`flex justify-center items-center bg-white rounded-xl shadow-inner border-2 border-slate-200 p-4 ${className}`} style={{ transform: `scale(${scale})` }}>
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
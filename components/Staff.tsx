import React from 'react';
import { RenderData, NoteDuration } from '../types';
import { getNoteStepsFromC4 } from '../constants';

interface StaffProps {
  data: RenderData;
  className?: string;
}

export const Staff: React.FC<StaffProps> = ({ data, className }) => {
  const width = 300;
  const height = 250;
  const staffYStart = 90; // Top line (Line 1)
  const lineSpacing = 20;
  const staffLines = [0, 1, 2, 3, 4].map(i => staffYStart + i * lineSpacing); 
  // Lines at y: 90, 110, 130, 150, 170

  const renderNote = (noteData: NonNullable<RenderData['note']>) => {
    const pitch = noteData.pitch.match(/^([A-G])(\d)$/);
    if (!pitch) return null;

    const noteName = pitch[1];
    const octave = parseInt(pitch[2], 10);
    
    // Calculate Y position
    const stepsFromC4 = getNoteStepsFromC4(noteName, octave);
    // E4 is 2 steps from C4. E4 Y = 170.
    const noteY = 170 - (stepsFromC4 - 2) * 10;

    // Stem direction: Notes on or above the middle line (B4, step 6) usually stem down.
    const stemDirection = stepsFromC4 >= 6 ? 'down' : 'up';
    const stemHeight = 70;
    const noteColor = "black";
    
    // Stem coordinates
    // Stem Up: Stem is on the RIGHT of the notehead (x ~ 150 + 10)
    // Stem Down: Stem is on the LEFT of the notehead (x ~ 150 - 10)
    const stemX = stemDirection === 'up' ? 164 : 136;
    const stemStartY = noteY + (stemDirection === 'up' ? -5 : 5);
    const stemEndY = noteY + (stemDirection === 'up' ? -stemHeight : stemHeight);

    // Ledger Lines
    const ledgerLines = [];
    if (noteY >= 190) { // C4 is 190
        for (let y = 190; y <= noteY; y += 20) {
            ledgerLines.push(y);
        }
    }
    if (noteY <= 70) { // A5 is 70
        for (let y = 70; y >= noteY; y -= 20) {
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
            strokeWidth="2" 
          />
        )}

        {/* Flags */}
        {/* We use explicit paths for cleaner shapes instead of rotation */}
        {noteData.duration !== 'whole' && noteData.duration !== 'half' && noteData.duration !== 'quarter' && (
            <g fill={noteColor}>
                {stemDirection === 'up' && (
                    <>
                        {/* 8th Note Flag (Up) */}
                        <path d={`M ${stemX} ${stemEndY} Q ${stemX + 18} ${stemEndY + 12} ${stemX + 18} ${stemEndY + 40} Q ${stemX + 8} ${stemEndY + 28} ${stemX} ${stemEndY + 45} Z`} />
                        
                        {/* 16th Note Flag (Up) - Add second flag below */}
                        {(noteData.duration === 'sixteenth' || noteData.duration === 'thirty-second') && (
                             <path d={`M ${stemX} ${stemEndY + 15} Q ${stemX + 18} ${stemEndY + 27} ${stemX + 18} ${stemEndY + 55} Q ${stemX + 8} ${stemEndY + 43} ${stemX} ${stemEndY + 60} Z`} />
                        )}

                        {/* 32nd Note Flag (Up) */}
                        {noteData.duration === 'thirty-second' && (
                             <path d={`M ${stemX} ${stemEndY + 30} Q ${stemX + 18} ${stemEndY + 42} ${stemX + 18} ${stemEndY + 70} Q ${stemX + 8} ${stemEndY + 58} ${stemX} ${stemEndY + 75} Z`} />
                        )}
                    </>
                )}
                {stemDirection === 'down' && (
                    <>
                         {/* 8th Note Flag (Down) - Curves UP from the bottom tip */}
                        <path d={`M ${stemX} ${stemEndY} Q ${stemX + 18} ${stemEndY - 12} ${stemX + 18} ${stemEndY - 40} Q ${stemX + 8} ${stemEndY - 28} ${stemX} ${stemEndY - 45} Z`} />

                        {/* 16th Note Flag (Down) */}
                        {(noteData.duration === 'sixteenth' || noteData.duration === 'thirty-second') && (
                             <path d={`M ${stemX} ${stemEndY - 15} Q ${stemX + 18} ${stemEndY - 27} ${stemX + 18} ${stemEndY - 55} Q ${stemX + 8} ${stemEndY - 43} ${stemX} ${stemEndY - 60} Z`} />
                        )}

                        {/* 32nd Note Flag (Down) */}
                         {noteData.duration === 'thirty-second' && (
                             <path d={`M ${stemX} ${stemEndY - 30} Q ${stemX + 18} ${stemEndY - 42} ${stemX + 18} ${stemEndY - 70} Q ${stemX + 8} ${stemEndY - 58} ${stemX} ${stemEndY - 75} Z`} />
                        )}
                    </>
                )}
            </g>
        )}
      </g>
    );
  };

  const renderSymbol = (symbolData: NonNullable<RenderData['symbol']>) => {
    // Center of canvas is roughly 150, 125
    if (symbolData.type === 'text') {
        return (
            <text x="150" y="140" textAnchor="middle" fontSize="60" fontWeight="bold" fontStyle="italic" fontFamily="serif">
                {symbolData.value}
            </text>
        );
    }
    
    // Shape symbols
    switch (symbolData.value) {
        case 'sharp':
            return <text x="150" y="150" textAnchor="middle" fontSize="100">♯</text>;
        case 'flat':
            return <text x="150" y="150" textAnchor="middle" fontSize="100">♭</text>;
        case 'natural':
            return <text x="150" y="150" textAnchor="middle" fontSize="100">♮</text>;
        case 'fermata':
            return (
                <g transform="translate(120, 100)">
                    <path d="M 0 30 Q 30 0 60 30" stroke="black" strokeWidth="4" fill="transparent" />
                    <circle cx="30" cy="20" r="4" fill="black" />
                </g>
            );
        case 'treble_clef':
             return <text x="150" y="180" textAnchor="middle" fontSize="150">𝄞</text>;
        case 'bass_clef':
             return <text x="150" y="160" textAnchor="middle" fontSize="120">𝄢</text>;
        case 'repeat_start':
            return (
                 <g transform="translate(130, 80)">
                    <rect x="0" y="0" width="5" height="100" fill="black" />
                    <rect x="10" y="0" width="2" height="100" fill="black" />
                    <circle cx="20" cy="40" r="4" fill="black" />
                    <circle cx="20" cy="60" r="4" fill="black" />
                 </g>
            );
        case 'tie':
             return <path d="M 100 120 Q 150 160 200 120" stroke="black" strokeWidth="3" fill="none" />;
        
        // --- RESTS ---
        case 'whole_rest':
            // Rectangle hanging from the 2nd line from top (y=110)
            // Dimensions: approx 20x10
            return <rect x="140" y="110" width="20" height="10" fill="black" />;
            
        case 'half_rest':
            // Rectangle sitting on the 3rd line from top (y=130)
            return <rect x="140" y="120" width="20" height="10" fill="black" />;
            
        case 'quarter_rest':
            // 𝄽 symbol or path
            return <text x="150" y="160" textAnchor="middle" fontSize="120" fontFamily="serif">𝄽</text>;
            
        case 'eighth_rest':
            // 𝄾 symbol
            return <text x="150" y="150" textAnchor="middle" fontSize="100" fontFamily="serif">𝄾</text>;

        default:
            return <text x="150" y="150" textAnchor="middle">?</text>;
    }
  };

  return (
    <div className={`flex justify-center items-center bg-white rounded-xl shadow-inner border-2 border-slate-200 p-4 ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Render Lines for Notes AND Rests that need context (Whole/Half) */}
        {(data.note || (data.symbol && ['whole_rest', 'half_rest', 'treble_clef', 'bass_clef', 'quarter_rest', 'eighth_rest'].includes(data.symbol.value))) && (
            <>
                {staffLines.map((y, i) => (
                <line key={i} x1="20" y1={y} x2={width - 20} y2={y} stroke="#333" strokeWidth="2" />
                ))}
            </>
        )}
        
        {/* Add Treble Clef for context if it's a note question */}
        {data.note && <text x="30" y="155" fontSize="90" fontFamily="serif">𝄞</text>}

        {/* Content */}
        {data.note && renderNote(data.note)}
        {data.symbol && renderSymbol(data.symbol)}
      </svg>
    </div>
  );
};
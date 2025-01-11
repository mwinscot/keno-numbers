'use client';

import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface GameAnalysis {
  range: string;
  hotNumbers: Array<{number: number, frequency: number}>;
  coldNumbers: Array<{number: number, frequency: number}>;
  averageMultiplier: number;
  averageBullsEye: number;
  drawCount: number;
}

interface KenoGame {
  Date: string;
  Time: string;
  Draw: string;
  'Winning Numbers': string;
  BullsEye: string;
  Multiplier: string;
  Bonus8: string;
}

const KenoAnalyzer = () => {
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState<GameAnalysis[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseGameNumbers = (numbersStr: string): number[] => {
    return numbersStr.split(' ')
      .map(num => parseInt(num.trim()))
      .filter(num => !isNaN(num));
  };

  const analyzeGames = (games: KenoGame[]) => {
    const ranges = [
      { label: 'All Games', count: games.length },
      { label: 'Last 10 Games', count: 10 },
      { label: 'Last 20 Games', count: 20 },
      { label: 'Last 50 Games', count: 50 },
      { label: 'Last 100 Games', count: 100 }
    ];

    const newAnalyses = ranges
      .filter(range => range.count <= games.length)
      .map(range => {
        const gameSet = games.slice(0, range.count);
        const numberFrequency: { [key: number]: number } = {};
        let totalMultiplier = 0;
        let totalBullsEye = 0;

        gameSet.forEach(game => {
          const numbers = parseGameNumbers(game['Winning Numbers']);
          numbers.forEach(num => {
            numberFrequency[num] = (numberFrequency[num] || 0) + 1;
          });
          totalMultiplier += parseInt(game.Multiplier.substring(1));
          totalBullsEye += parseInt(game.BullsEye);
        });

        const sortedNumbers = Object.entries(numberFrequency)
          .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
          .sort((a, b) => b.frequency - a.frequency);

        return {
          range: range.label,
          hotNumbers: sortedNumbers.slice(0, 10),
          coldNumbers: sortedNumbers.slice(-10).reverse(),
          averageMultiplier: totalMultiplier / gameSet.length,
          averageBullsEye: totalBullsEye / gameSet.length,
          drawCount: range.count
        };
    });

    setAnalyses(newAnalyses);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      // Parse each line into a game object
      
      const games = lines.map(line => {
        const parts = line.split(/\s+/);
        const game: Partial<KenoGame> = {};
        
        // Parse date and time
        game.Date = parts[0];
        game.Time = parts[1] + ' ' + parts[2];
        game.Draw = parts[3];
        
        // Parse winning numbers
        const numbersStart = parts.indexOf(parts.find(p => /^\d+$/.test(p)) || '');
        const numbers: string[] = [];
        for (let i = numbersStart; i < parts.length - 3; i++) {
          if (/^\d+$/.test(parts[i])) {
            numbers.push(parts[i]);
          }
        }
        game['Winning Numbers'] = numbers.join(' ');
        
        // Parse remaining fields
        const remaining = parts.slice(-3);
        game.BullsEye = remaining[0];
        game.Multiplier = remaining[1];
        game.Bonus8 = remaining[2];
        
        return game as KenoGame;
      });

      analyzeGames(games);
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError('Error reading file: ' + err.message);
      } else {
        setError('Error reading file');
      }
    }
  };

  const renderAnalysis = (analysis: GameAnalysis) => (
    <div key={analysis.range} className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">{analysis.range} ({analysis.drawCount} draws)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3">Hot Numbers (Most Frequent)</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.hotNumbers.map(({number, frequency}) => (
              <span key={number} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {number} ({frequency}x)
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Cold Numbers (Least Frequent)</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.coldNumbers.map(({number, frequency}) => (
              <span key={number} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {number} ({frequency}x)
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h4 className="font-semibold mb-2">Average Multiplier</h4>
          <p className="text-2xl font-bold text-green-600">
            {analysis.averageMultiplier.toFixed(2)}x
          </p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h4 className="font-semibold mb-2">Average BullsEye</h4>
          <p className="text-2xl font-bold text-purple-600">
            {analysis.averageBullsEye.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-center mb-6">Oregon Keno Analyzer</h2>
          
          <div>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-600">Upload Keno Results File</p>
              <p className="text-xs text-gray-500 mt-1">Accepts .txt or .csv files</p>
              <input
                type="file"
                onChange={handleUpload}
                className="hidden"
                ref={fileInputRef}
                accept=".txt,.csv"
              />
            </div>

            {error && (
              <div className="mt-4 text-red-500 text-center">
                {error}
              </div>
            )}
          </div>
        </div>

        {analyses.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
            {analyses.map(analysis => renderAnalysis(analysis))}
          </div>
        )}
      </div>
    </div>
  );
};

export { KenoAnalyzer as default };
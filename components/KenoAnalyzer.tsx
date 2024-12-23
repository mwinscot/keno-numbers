import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

interface AnalysisResults {
  leastFrequent: [string, number][];
  mostFrequent: [string, number][];
  totalDraws: number;
  allDraws: string[][];
}

export default function KenoAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState('');

  const analyzePDF = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }

      const frequency: { [key: number]: number } = {};
      for (let i = 1; i <= 80; i++) {
        frequency[i] = 0;
      }

      // Split the text into lines based on multiple spaces or newlines
      const lines = fullText.split(/\s{2,}|\n/);
      console.log("Total lines in PDF:", lines.length);
      console.log("Full text content:", fullText);

      let drawCount = 0;
      const allDraws: string[][] = [];

      lines.forEach((line, lineIndex) => {
        // Extract all numbers from the line
        const allNumbers = line.match(/\d+/g);
        if (allNumbers) {
          console.log(`Line ${lineIndex + 1}: Found numbers -`, allNumbers);

          // Convert to integers and filter valid keno numbers
          const numbers = allNumbers
            .map(n => parseInt(n))
            .filter(n => n >= 1 && n <= 80);

          console.log(`Line ${lineIndex + 1}: Valid keno numbers -`, numbers);

          // Look for sequence of exactly 20 valid numbers
          for (let i = 0; i <= numbers.length - 20; i++) {
            const sequence = numbers.slice(i, i + 20);
            if (sequence.length === 20 && sequence.every(n => n >= 1 && n <= 80)) {
              console.log(`Line ${lineIndex + 1}: Found valid sequence -`, sequence);
              sequence.forEach(num => frequency[num]++);
              allDraws.push(sequence.map(n => n.toString()));
              drawCount++;
              break; // Found valid sequence, move to next line
            }
          }
        }
      });

      console.log("Total draws found:", drawCount);

      const leastFrequent = Object.entries(frequency)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 4)
        .map(([num, count]) => [num, count] as [string, number]);

      const mostFrequent = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([num, count]) => [num, count] as [string, number]);

      setResults({ 
        leastFrequent, 
        mostFrequent, 
        totalDraws: drawCount,
        allDraws: allDraws.reverse() // Most recent first
      });
    } catch (err) {
      console.error('Error:', err);
      throw new Error('Error processing PDF');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      await analyzePDF(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-4 text-black">Keno Analyzer</h1>
        
        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-gray-400">
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <span className="text-sm text-gray-600 text-black">Upload PDF</span>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="hidden"
              accept="application/pdf"
            />
          </div>
        </label>

        <div className="text-center mt-2">
          <a href="https://www.oregonlottery.org/keno/winning-numbers/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-black">
            View Oregon Lottery Keno Winning Numbers
          </a>
        </div>

        {loading && (
          <div className="mt-4 text-center text-gray-600 text-black">Processing...</div>
        )}

        {error && (
          <div className="mt-4 text-center text-red-500 text-black">{error}</div>
        )}

        {results && (
          <div className="mt-4 space-y-4">
            <div>
              <h2 className="font-semibold mb-2 text-black">Most Frequent Numbers:</h2>
              <div className="grid grid-cols-2 gap-2">
                {results.mostFrequent.map(([number, count]) => (
                  <div key={number} className="bg-green-100 p-2 rounded text-center text-black">
                    <div className="font-bold">{number}</div>
                    <div className="text-sm text-gray-600 text-black">{count} times ({Math.round((count / results.totalDraws) * 100)}%)</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 text-center mt-1 text-black">
                Based on {results.totalDraws} draws
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold mb-2 text-black">Least Frequent Numbers:</h2>
              <div className="grid grid-cols-2 gap-2">
                {results.leastFrequent.map(([number, count]) => (
                  <div key={number} className="bg-red-100 p-2 rounded text-center text-black">
                    <div className="font-bold">{number}</div>
                    <div className="text-sm text-gray-600 text-black">{count} times ({Math.round((count / results.totalDraws) * 100)}%)</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 text-center mt-1 text-black">
                Based on {results.totalDraws} draws
              </div>
            </div>

            <div className="mt-4">
              <h2 className="font-semibold mb-2 text-black">Recent Draws:</h2>
              <div className="max-h-60 overflow-y-auto">
                {results.allDraws.map((draw, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded mb-2 text-sm text-black">
                    {draw.join(' ')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
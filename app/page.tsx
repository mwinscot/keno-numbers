'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function Home() {
  const [results, setResults] = useState<{leastFrequent: [string, number][], totalDraws: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzePDF = async (text: string) => {
    const frequency: { [key: number]: number } = {};
    for (let i = 1; i <= 80; i++) {
      frequency[i] = 0;
    }

    const lines = text.split('\n');
    let drawCount = 0;

    lines.forEach(line => {
      const match = line.match(/Draw\s+(\d+(?:\s+\d+)*)\s+BullsEye/);
      if (match) {
        const numbers = match[1].split(/\s+/).map(num => parseInt(num));
        numbers.forEach(num => {
          if (num >= 1 && num <= 80) {
            frequency[num]++;
          }
        });
        drawCount++;
      }
    });

    const sortedFrequency = Object.entries(frequency)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 4);

    return {
      leastFrequent: sortedFrequency,
      totalDraws: drawCount
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');

      const text = await file.text();
      const analysis = await analyzePDF(text);
      setResults(analysis);
    } catch (err) {
      setError('Error processing file. Please make sure it\'s a valid text or PDF file.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Keno Number Analyzer</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <label className="cursor-pointer text-sm text-gray-600">
                  Upload Keno Results
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {loading && (
                <div className="text-center text-gray-600">
                  Processing...
                </div>
              )}

              {error && (
                <div className="text-center text-red-500">
                  {error}
                </div>
              )}

              {results && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Least Frequent Numbers:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {results.leastFrequent.map(([number, count]) => (
                      <div key={number} className="bg-gray-100 p-2 rounded">
                        <span className="font-bold">#{number}</span>: {count} times
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Based on {results.totalDraws} draws
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
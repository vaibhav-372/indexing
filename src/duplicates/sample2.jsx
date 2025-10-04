import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Game() {
  const [row, setRow] = useState(8);

  const [currentRow, setCurrentRow] = useState(0)

  const [data, setData] = useState({
    box1Level1: { col1: '', col2: '' },
    box2Level1: { col1: '', col2: '' },
    box3Level1: { col1: '', col2: '' },
  });

  // State for left buttons for each table
  const [box1Left, setBox1Left] = useState(Array(row).fill(''));
  const [box2Left, setBox2Left] = useState(Array(row).fill(''));
  const [box3Left, setBox3Left] = useState(Array(row).fill(''));

  useEffect(() => {
    axios.get('http://localhost:5000/data')
      .then((res) => {
        if (res.data) {
          setData({
            box1Level1: { col1: res.data?.box1?.level1?.col1 || '', col2: res.data?.box1?.level1?.col2 || '' },
            box2Level1: { col1: res.data?.box2?.level1?.col1 || '', col2: res.data?.box2?.level1?.col2 || '' },
            box3Level1: { col1: res.data?.box3?.level1?.col1 || '', col2: res.data?.box3?.level1?.col2 || '' },
          });
        }
      })
      .catch((err) => console.error('Error fetching data:', err));
  }, []);

  const handleLeftClick = (box, rowIndex, value) => {
    if (box === 1) {
      const updated = [...box1Left];
      updated[rowIndex] = updated[rowIndex] === value ? '' : value;
      setBox1Left(updated);
    } else if (box === 2) {
      const updated = [...box2Left];
      updated[rowIndex] = updated[rowIndex] === value ? '' : value;
      setBox2Left(updated);
    } else if (box === 3) {
      const updated = [...box3Left];
      updated[rowIndex] = updated[rowIndex] === value ? '' : value;
      setBox3Left(updated);
    }
  };

  const handleRightClick = (box, rowIndex, value) => {
    let leftState;

    if (box === 1) leftState = box1Left;
    if (box === 2) leftState = box2Left;
    if (box === 3) leftState = box3Left;

    if (leftState[rowIndex]) {
      if(leftState[rowIndex] == value){
        
      }
    }
    else {
      alert("Please select an option on the left side first!");
      return;
    }

    // Continue with right-side action here (API call, state update, etc.)
    // console.log(`Right button clicked: Box ${box}, Row ${rowIndex + 1}, Value: ${value}`);
  };


  const renderTable = (boxNum, title, btn1, btn2, levelData, boxLeftState) => {
    return (
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200 w-full">
        <div className="bg-[#2EE8B3] text-white text-center py-3 text-lg font-semibold tracking-wide">
          {title}
        </div>
        <div className="p-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                <th className="py-2 px-3 text-left rounded-l-lg">Steps</th>
                <th className="py-2 px-3 text-left">Actions</th>
                <th className="py-2 px-3 text-left">Col 1</th>
                <th className="py-2 px-3 text-left">Col 2</th>
                <th className="py-2 px-3 text-left rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: row }, (_, i) => {
                const isLocked = !!(levelData.col1 && i === 0 || levelData.col2 && i === 0);

                return (
                  <tr key={i} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2 px-3 font-medium text-gray-800">{i + 1}</td>

                    {/* left buttons */}
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleLeftClick(boxNum, i, btn1)}
                        disabled={isLocked}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${isLocked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : boxLeftState[i] === btn1
                            ? 'bg-gray-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                      >
                        {btn1}
                      </button>
                      <button
                        onClick={() => handleLeftClick(boxNum, i, btn2)}
                        disabled={isLocked}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${isLocked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : boxLeftState[i] === btn2
                            ? 'bg-gray-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                      >
                        {btn2}
                      </button>
                    </td>

                    {/* Col values */}
                    <td className="py-2 px-3 text-gray-700">
                      {i === 0 ? levelData.col1[currentRow] : ''}
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      {i === 0 ? levelData.col2[currentRow] : ''}
                    </td>

                    {/* right buttons */}
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleRightClick(boxNum, i, btn1)}
                        disabled={isLocked}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${isLocked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                      >
                        {btn1}
                      </button>
                      <button
                        onClick={() => handleRightClick(boxNum, i, btn2)}
                        disabled={isLocked}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${isLocked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                      >
                        {btn2}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {renderTable(1, "Box 1", "A", "B", data.box1Level1, box1Left)}
        {renderTable(2, "Box 2", "C", "D", data.box2Level1, box2Left)}
        {renderTable(3, "Box 3", "E", "F", data.box3Level1, box3Left)}
      </div>
    </div>
  );
}

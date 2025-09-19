import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Game() {
  const [row, setRow] = useState(8);
  const [currentRow, setCurrentRow] = useState(0);
  const [data, setData] = useState({
    box1Level1: { col1: [], col2: [] },
    box2Level1: { col1: [], col2: [] },
    box3Level1: { col1: [], col2: [] },
  });

  // State for left buttons for each table
  const [box1Left, setBox1Left] = useState(Array(row).fill(''));
  const [box2Left, setBox2Left] = useState(Array(row).fill(''));
  const [box3Left, setBox3Left] = useState(Array(row).fill(''));

  // State for right button selections
  const [box1Right, setBox1Right] = useState(Array(row).fill(''));
  const [box2Right, setBox2Right] = useState(Array(row).fill(''));
  const [box3Right, setBox3Right] = useState(Array(row).fill(''));

  // State to track completed rows
  const [completedRows, setCompletedRows] = useState(Array(row).fill(false));

  useEffect(() => {
    axios.get('http://localhost:5000/data')
      .then((res) => {
        if (res.data) {
          setData({
            box1Level1: { 
              col1: res.data?.box1?.level1?.col1 || [], 
              col2: res.data?.box1?.level1?.col2 || [] 
            },
            box2Level1: { 
              col1: res.data?.box2?.level1?.col1 || [], 
              col2: res.data?.box2?.level1?.col2 || [] 
            },
            box3Level1: { 
              col1: res.data?.box3?.level1?.col1 || [], 
              col2: res.data?.box3?.level1?.col2 || [] 
            },
          });
        }
      })
      .catch((err) => console.error('Error fetching data:', err));
  }, []);

  const handleLeftClick = (box, rowIndex, value) => {
    // Don't allow changes to completed rows
    if (completedRows[rowIndex]) return;

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
    // Don't allow changes to completed rows
    if (completedRows[rowIndex]) return;

    let leftState, setRightState;
    
    if (box === 1) {
      leftState = box1Left;
      setRightState = setBox1Right;
    } else if (box === 2) {
      leftState = box2Left;
      setRightState = setBox2Right;
    } else if (box === 3) {
      leftState = box3Left;
      setRightState = setBox3Right;
    }

    // Check if left button is selected
    if (!leftState[rowIndex]) {
      alert("Please select an option on the left side first!");
      return;
    }

    // Update right button selection
    const updatedRight = [...(box === 1 ? box1Right : box === 2 ? box2Right : box3Right)];
    updatedRight[rowIndex] = value;
    setRightState(updatedRight);

    // Check if selections match
    if (leftState[rowIndex] === value) {
      // Move to next row
      const newCompleted = [...completedRows];
      newCompleted[rowIndex] = true;
      setCompletedRows(newCompleted);
      
      if (currentRow < row - 1) {
        setCurrentRow(currentRow + 1);
      }
    } else {
      // Selections don't match - stay on same row
      alert("Selections don't match! Try again.");
    }
  };

  const renderTable = (boxNum, title, btn1, btn2, levelData, boxLeftState, boxRightState) => {
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
                // Check if data exists for this row
                const hasData = levelData.col1.length > i && levelData.col2.length > i;
                // Check if this row is completed
                const isCompleted = completedRows[i];
                // Check if this is the current active row
                const isCurrentRow = i === currentRow;
                // Check if buttons should be disabled
                const leftDisabled = isCompleted;
                const rightDisabled = isCompleted || !isCurrentRow || !boxLeftState[i];

                return (
                  <tr key={i} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2 px-3 font-medium text-gray-800">{i + 1}</td>

                    {/* left buttons */}
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleLeftClick(boxNum, i, btn1)}
                        disabled={leftDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          leftDisabled
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
                        disabled={leftDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          leftDisabled
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
                      {hasData && (isCompleted || isCurrentRow) ? levelData.col1[i] : ''}
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      {hasData && (isCompleted || isCurrentRow) ? levelData.col2[i] : ''}
                    </td>

                    {/* right buttons */}
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleRightClick(boxNum, i, btn1)}
                        disabled={rightDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          rightDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : boxRightState[i] === btn1
                              ? 'bg-gray-700 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {btn1}
                      </button>
                      <button
                        onClick={() => handleRightClick(boxNum, i, btn2)}
                        disabled={rightDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          rightDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : boxRightState[i] === btn2
                              ? 'bg-gray-700 text-white'
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
        {renderTable(1, "Box 1", "A", "B", data.box1Level1, box1Left, box1Right)}
        {renderTable(2, "Box 2", "C", "D", data.box2Level1, box2Left, box2Right)}
        {renderTable(3, "Box 3", "E", "F", data.box3Level1, box3Left, box3Right)}
      </div>
    </div>
  );
}
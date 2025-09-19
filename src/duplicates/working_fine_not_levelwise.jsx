import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Game() {
  const [row] = useState(8);
  const [count, setCount] = useState(0)

  // Levels for each table
  const [boxLevels, setBoxLevels] = useState({ box1: 1, box2: 1, box3: 1 });

  // Data for each box & level
  const [data, setData] = useState({
    box1: { col1: [], col2: [] },
    box2: { col1: [], col2: [] },
    box3: { col1: [], col2: [] },
  });

  // State for each box (current row, left/right selections, completed rows)
  const [boxStates, setBoxStates] = useState({
    box1: {
      currentRow: 0,
      dataIndex: 0,
      rowData: Array(row).fill(null),
      left: Array(row).fill(''),
      right: Array(row).fill(''),
      completedRows: Array(row).fill(false)
    },
    box2: {
      currentRow: 0,
      dataIndex: 0,
      rowData: Array(row).fill(null),
      left: Array(row).fill(''),
      right: Array(row).fill(''),
      completedRows: Array(row).fill(false)
    },
    box3: {
      currentRow: 0,
      dataIndex: 0,
      rowData: Array(row).fill(null),
      left: Array(row).fill(''),
      right: Array(row).fill(''),
      completedRows: Array(row).fill(false)
    }
  });

  useEffect(() => {
    console.log(`updated box ${count} currentRow :`, boxStates.box1.currentRow)
    console.log(`updated box ${count} left :`, boxStates.box1.left)
    console.log(`updated box ${count} right :`, boxStates.box1.right)
    console.log(`updated box ${count} completedRows :`, boxStates.box1.completedRows)
  }, [boxStates])


  // Fetch data for specific table & level
  const fetchData = (boxKey, level) => {
    axios
      .get(`http://localhost:5000/data`)
      .then((res) => {
        if (res.data && res.data[boxKey]?.[`level${level}`]) {
          const levelData = res.data[boxKey][`level${level}`];
          setData((prev) => ({
            ...prev,
            [boxKey]: {
              col1: levelData.col1 || [],
              col2: levelData.col2 || [],
            },
          }));

          // Initialize rowData with first item
          // In fetchData, remove the rowData initialization:
          // In fetchData, initialize first row's data:
          setBoxStates(prev => ({
            ...prev,
            [boxKey]: {
              ...prev[boxKey],
              rowData: Array(row).fill(null).map((_, i) =>
                i === 0 ? {
                  col1: levelData.col1[0] || '',
                  col2: levelData.col2[0] || ''
                } : null
              )
            }
          }));
        }
      })
      .catch((err) => console.error(`Error fetching data for ${boxKey}:`, err));
  };

  // Initial load
  useEffect(() => {
    fetchData('box1', boxLevels.box1);
    fetchData('box2', boxLevels.box2);
    fetchData('box3', boxLevels.box3);
  }, []);


  // Level change handler
  const handleLevelChange = (boxKey, level) => {
    setBoxLevels((prev) => ({ ...prev, [boxKey]: level }));
    fetchData(boxKey, level);
  };

  const handleLeftClick = (boxKey, rowIndex, value) => {
    setBoxStates(prev => {
      const boxState = prev[boxKey];
      if (boxState.completedRows[rowIndex]) return prev;

      const updatedLeft = [...boxState.left];
      updatedLeft[rowIndex] = updatedLeft[rowIndex] === value ? '' : value;

      return {
        ...prev,
        [boxKey]: {
          ...boxState,
          left: updatedLeft
        }
      };
    });
    setCount(count + 1)
  };


  const handleRightClick = (boxKey, rowIndex, value, levelData) => {
    setBoxStates(prev => {
      const boxState = prev[boxKey];
      if (boxState.completedRows[rowIndex]) return prev;

      if (!boxState.left[rowIndex]) {
        alert('Please select an option on the left side first!');
        return prev;
      }

      const updatedRight = [...boxState.right];
      updatedRight[rowIndex] = value;

      // Check if left and right match
      const isMatch = boxState.left[rowIndex] === value;

      let nextRow = (boxState.currentRow + 1) % row;
      const updatedCompleted = [...boxState.completedRows];
      updatedCompleted[rowIndex] = true;

      // Update row data
      const updatedRowData = [...boxState.rowData];
      if (updatedRowData[rowIndex] === null) {
        updatedRowData[rowIndex] = {
          col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || '',
          col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ''
        };
      }

      const currentDataIndex = boxState.dataIndex % levelData.col1.length;

      if (!isMatch) {
        const nextDataIndex = (currentDataIndex + 1) % levelData.col1.length;
        updatedRowData[nextRow] = {
          col1: levelData.col1[nextDataIndex] || '',
          col2: levelData.col2[nextDataIndex] || ''
        };
      }

      return {
        ...prev,
        [boxKey]: {
          ...boxState,
          right: updatedRight,
          completedRows: updatedCompleted,
          currentRow: nextRow,
          dataIndex: isMatch ? boxState.dataIndex : boxState.dataIndex + 1,
          rowData: updatedRowData
        }
      };
    });
    setCount(count + 1);
  };

  const renderTable = (boxKey, title, btn1, btn2, levelData) => {
    const boxState = boxStates[boxKey];
    const boxNum = parseInt(boxKey.replace('box', ''));

    return (
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200 w-full">
        <div className="flex justify-between items-center bg-[#2EE8B3] text-white py-3 px-4">
          <span className="text-lg font-semibold tracking-wide">{title}</span>
          <select
            value={boxLevels[boxKey]}
            onChange={(e) => handleLevelChange(boxKey, Number(e.target.value))}
            className="bg-white text-black rounded px-2 py-1"
          >
            {[1, 2, 3, 4].map((lvl) => (
              <option key={lvl} value={lvl}>
                Level {lvl}
              </option>
            ))}
          </select>
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
                const isCompleted = boxState.completedRows[i];
                const isCurrentRow = i === boxState.currentRow;
                const leftDisabled = isCompleted;
                const rightDisabled = isCompleted || !isCurrentRow || !boxState.left[i];

                // Show data if:
                // 1. It exists in rowData, OR
                // 2. It's the current row (first row initially)
                const shouldShowData = boxState.rowData[i] !== null || i === boxState.currentRow;

                // Get data from either:
                // 1. Stored row data, OR
                // 2. Current level data if first row
                const rowData = boxState.rowData[i] || {
                  col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || '',
                  col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ''
                };

                return (
                  <tr key={i} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2 px-3 font-medium text-gray-800">{i + 1}</td>
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleLeftClick(boxKey, i, btn1)}
                        disabled={leftDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${leftDisabled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : boxState.left[i] === btn1
                            ? 'bg-gray-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                      >
                        {btn1}
                      </button>
                      <button
                        onClick={() => handleLeftClick(boxKey, i, btn2)}
                        disabled={leftDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${leftDisabled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : boxState.left[i] === btn2
                            ? 'bg-gray-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                      >
                        {btn2}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-gray-700">{shouldShowData ? rowData.col1 : ''}</td>
                    <td className="py-2 px-3 text-gray-700">{shouldShowData ? rowData.col2 : ''}</td>

                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleRightClick(boxKey, i, btn1, levelData)}
                        disabled={rightDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${rightDisabled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : boxState.right[i] === btn1
                            ? 'bg-gray-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                      >
                        {btn1}
                      </button>
                      <button
                        onClick={() => handleRightClick(boxKey, i, btn2, levelData)}
                        disabled={rightDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${rightDisabled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : boxState.right[i] === btn2
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
        {renderTable('box1', 'Box 1', 'A', 'B', data.box1)}
        {renderTable('box2', 'Box 2', 'C', 'D', data.box2)}
        {renderTable('box3', 'Box 3', 'E', 'F', data.box3)}
      </div>
    </div>
  );
}
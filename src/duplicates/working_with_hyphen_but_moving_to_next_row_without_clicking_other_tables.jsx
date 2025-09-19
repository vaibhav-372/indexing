// working_with_hyphen_but_moving_to_next_row_without_clicking_other_tables


import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Game() {
  const [row, setRow] = useState(8);
  const [count, setCount] = useState(0);

  // Levels for each table
  const [boxLevels, setBoxLevels] = useState({ box1: 1, box2: 1, box3: 1 });

  // Data for each box & level
  const [data, setData] = useState({
    box1: { col1: [], col2: [] },
    box2: { col1: [], col2: [] },
    box3: { col1: [], col2: [] },
  });

  // State for each box
  const [boxStates, setBoxStates] = useState({
    box1: makeBoxState(row),
    box2: makeBoxState(row),
    box3: makeBoxState(row),
  });

  // Helper function to create box state
  function makeBoxState(row) {
    return {
      currentRow: 0,
      dataIndex: 0,
      rowData: Array(row).fill(null),
      left: Array(row).fill(''),
      right: Array(row).fill(''),
      completedRows: Array(row).fill(false),
    };
  }

  useEffect(() => {
    console.log('Box states updated:', boxStates);
  }, [boxStates]);

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

          setBoxStates((prev) => {
            const boxState = prev[boxKey];
            const updatedRowData = [...boxState.rowData];

            // Initialize first row
            if (updatedRowData[0] === null) {
              updatedRowData[0] = {
                col1: levelData.col1[0] || '',
                col2: levelData.col2[0] || ''
              };
            }

            return {
              ...prev,
              [boxKey]: {
                ...boxState,
                rowData: updatedRowData,
                dataIndex: 0,
              },
            };
          });
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

      const updatedLeft = [...boxState.left];

      // Toggle the value - if already selected, deselect it
      updatedLeft[rowIndex] = updatedLeft[rowIndex] === value ? '' : value;

      return {
        ...prev,
        [boxKey]: {
          ...boxState,
          left: updatedLeft
        }
      };
    });
    setCount(count + 1);
  };

  const handleRightClick = (boxKey, rowIndex, value, levelData) => {
    setBoxStates(prev => {
      const updatedStates = { ...prev };

      // ✅ Update current box
      const boxState = { ...updatedStates[boxKey] };

      if (boxState.completedRows[rowIndex]) return prev;
      if (!boxState.left[rowIndex]) {
        alert("Please select a left option first!");
        return prev;
      }

      const updatedRight = [...boxState.right];
      updatedRight[rowIndex] = value;

      const updatedCompleted = [...boxState.completedRows];
      updatedCompleted[rowIndex] = true;

      const updatedRowData = [...boxState.rowData];
      if (!updatedRowData[rowIndex]) {
        updatedRowData[rowIndex] = {
          col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || "",
          col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ""
        };
      }

      let nextDataIndex = boxState.dataIndex;
      if (boxState.left[rowIndex] !== value) {
        nextDataIndex += 1;
      }

      updatedStates[boxKey] = {
        ...boxState,
        right: updatedRight,
        completedRows: updatedCompleted,
        rowData: updatedRowData,
        currentRow: rowIndex + 1,
        dataIndex: nextDataIndex,
      };

      // 🔥 If we just finished the last row, expand rows by 8
      if (rowIndex + 1 === boxState.rowData.length) {
        const extra = 1;
        Object.keys(updatedStates).forEach(key => {
          const otherState = updatedStates[key];
          updatedStates[key] = {
            ...otherState,
            rowData: [...otherState.rowData, ...Array(extra).fill(null)],
            left: [...otherState.left, ...Array(extra).fill('')],
            right: [...otherState.right, ...Array(extra).fill('')],
            completedRows: [...otherState.completedRows, ...Array(extra).fill(false)],
          };
        });
      }

      // ✅ Keep all boxes aligned
      Object.keys(updatedStates).forEach(otherKey => {
        if (otherKey !== boxKey) {
          const otherState = { ...updatedStates[otherKey] };

          // If this row is not completed, mark "-" and move forward
          if (!otherState.completedRows[rowIndex]) {
            const newRowData = [...otherState.rowData];
            newRowData[rowIndex] = { col1: "-", col2: "-" };

            const newCompleted = [...otherState.completedRows];
            newCompleted[rowIndex] = true;

            updatedStates[otherKey] = {
              ...otherState,
              rowData: newRowData,
              completedRows: newCompleted,
              currentRow: rowIndex + 1,
            };
          } else {
            // already played this row → just move index forward
            updatedStates[otherKey].currentRow = rowIndex + 1;
          }
        }
      });

      return updatedStates;
    });
  };

  const renderTable = (boxKey, title, btn1, btn2, levelData) => {
    const boxState = boxStates[boxKey];
    const maxRows = Math.max(
      boxStates.box1.rowData.length,
      boxStates.box2.rowData.length,
      boxStates.box3.rowData.length
    );

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
              {Array.from({ length: maxRows }, (_, i) => {
                const isCompletedInThisBox = i < boxState.completedRows.length ? boxState.completedRows[i] : false;
                const isCurrentRowInThisBox = i === boxState.currentRow;

                // Check if this row is completed in any other box
                const isCompletedInOtherBox = Object.keys(boxStates)
                  .filter(key => key !== boxKey)
                  .some(otherBoxKey =>
                    i < boxStates[otherBoxKey].completedRows.length ?
                      boxStates[otherBoxKey].completedRows[i] : false
                  );

                // Right buttons are disabled if:
                // 1. Completed in this box, OR
                // 2. Not the current row in this box, OR
                // 3. No left selection made
                const rightDisabled = isCompletedInThisBox ||
                  !isCurrentRowInThisBox ||
                  (i < boxState.left.length && !boxState.left[i]);

                // Get data for this row
                let rowData;
                if (i < boxState.rowData.length && boxState.rowData[i] !== null) {
                  // Use existing row data
                  rowData = boxState.rowData[i];
                } else if (isCompletedInOtherBox && !isCompletedInThisBox) {
                  // Show hyphen if completed in other boxes but not this one
                } else if (i === boxState.currentRow) {
                  rowData = { col1: '-', col2: '-' };
                  // Show current data for current row
                  rowData = {
                    col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || '',
                    col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ''
                  };
                } else {
                  // Empty data for future rows
                  rowData = { col1: '', col2: '' };
                }

                const leftValue = i < boxState.left.length ? boxState.left[i] : '';
                const rightValue = i < boxState.right.length ? boxState.right[i] : '';

                return (
                  <tr key={i} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2 px-3 font-medium text-gray-800">{i + 1}</td>
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleLeftClick(boxKey, i, btn1)}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${leftValue === btn1
                          ? 'bg-gray-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                      >
                        {btn1}
                      </button>

                      <button
                        onClick={() => handleLeftClick(boxKey, i, btn2)}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${leftValue === btn2
                          ? 'bg-gray-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                      >
                        {btn2}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-gray-700">{rowData.col1}</td>
                    <td className="py-2 px-3 text-gray-700">{rowData.col2}</td>

                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleRightClick(boxKey, i, btn1, levelData)}
                        disabled={rightDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${rightDisabled
                          ? rightValue === btn1
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : rightValue === btn1
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
                          ? rightValue === btn2
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : rightValue === btn2
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


// if 1box buttons are clicked, then all boxes are affecting


// f I click in one box → the same row index of other boxes should also become clickable.
// (So row 1 of box1, box2, and box3 are all active together.)

// If I complete both sides (left + right) in the SAME box
// → then other boxes should still remain available for input (don’t auto-skip them).

// If I move forward in one box but other boxes didn’t get any input in that row
// → then for those unclicked boxes:

// Show a - in col1/col2 for that row.

// Auto-advance them to the next row (keeping everything aligned).

// So basically:

// All boxes stay row-synced.

// If a box is skipped in a row → it auto-fills with -.

// If not skipped → it keeps whatever the player clicked.
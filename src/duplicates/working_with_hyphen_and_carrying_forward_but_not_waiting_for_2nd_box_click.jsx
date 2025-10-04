// working_with_hyphen_and_carrying_forward_but_not_waiting_for_2nd_box_click

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Game() {
  const [row, setRow] = useState(8);
  const [boxLevels, setBoxLevels] = useState({ box1: 1, box2: 1, box3: 1 });
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

  // Track if any box has been clicked in the current row
  const [rowStarted, setRowStarted] = useState(false);

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
    // console.log('Box states updated:', boxStates);
    
    // Check if any box has started the current row
    const currentRow = Math.min(
      boxStates.box1.currentRow,
      boxStates.box2.currentRow,
      boxStates.box3.currentRow
    );
    
    const anyBoxStarted = ['box1', 'box2', 'box3'].some(boxKey => {
      const boxState = boxStates[boxKey];
      return boxState.currentRow > currentRow || 
             (boxState.left[currentRow] !== '' || boxState.right[currentRow] !== '');
    });
    
    setRowStarted(anyBoxStarted);
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
  };

  const handleRightClick = (boxKey, rowIndex, value, levelData) => {
    setBoxStates(prev => {
      const updatedStates = { ...prev };
      const boxState = { ...updatedStates[boxKey] };
      
      // Get the minimum current row across all boxes
      const minCurrentRow = Math.min(
        updatedStates.box1.currentRow,
        updatedStates.box2.currentRow,
        updatedStates.box3.currentRow
      );
      
      // Only allow right clicks on the current row for this box
      if (rowIndex !== boxState.currentRow) return prev;

      // Check if this is the second click in the same row for this box
      const isSecondClick = boxState.completedRows[rowIndex];

      if (!isSecondClick) {
        // First click in this row
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

        // Move this box to the next row
        updatedStates[boxKey] = {
          ...boxState,
          right: updatedRight,
          completedRows: updatedCompleted,
          rowData: updatedRowData,
          currentRow: rowIndex + 1,
          dataIndex: nextDataIndex,
        };
        
        // If this box is ahead of others, add hyphens to other boxes for this row
        if (rowIndex === minCurrentRow) {
          Object.keys(updatedStates).forEach(otherKey => {
            if (otherKey !== boxKey) {
              const otherState = updatedStates[otherKey];
              
              // Only add hyphens if the other box hasn't completed this row
              if (!otherState.completedRows[rowIndex] && 
                  otherState.currentRow === rowIndex) {
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
              }
            }
          });
        }
      } else {
        // Second click in the same row - this means we're skipping this box for this row
        // Add hyphens to this box for the current row
        const newRowData = [...boxState.rowData];
        newRowData[rowIndex] = { col1: "-", col2: "-" };

        const newCompleted = [...boxState.completedRows];
        newCompleted[rowIndex] = true;

        updatedStates[boxKey] = {
          ...boxState,
          rowData: newRowData,
          completedRows: newCompleted,
          currentRow: rowIndex + 1,
        };
      }

      // Expand rows dynamically if needed
      const maxRowLength = Math.max(
        updatedStates.box1.rowData.length,
        updatedStates.box2.rowData.length,
        updatedStates.box3.rowData.length
      );
      
      if (rowIndex + 1 >= maxRowLength) {
        Object.keys(updatedStates).forEach(key => {
          const s = updatedStates[key];
          
          updatedStates[key] = {
            ...s,
            rowData: [...s.rowData, null],
            left: [...s.left, ''],
            right: [...s.right, ''],
            completedRows: [...s.completedRows, false],
          };
        });
      }

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
    
    // Get the minimum current row across all boxes
    const minCurrentRow = Math.min(
      boxStates.box1.currentRow,
      boxStates.box2.currentRow,
      boxStates.box3.currentRow
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
                const isCurrentRowForThisBox = i === boxState.currentRow;
                
                // Right buttons are disabled if:
                // 1. Completed in this box, OR
                // 2. Not the current row for this box
                const rightDisabled = isCompletedInThisBox || !isCurrentRowForThisBox;

                // Get data for this row
                let rowData;
                if (i < boxState.rowData.length && boxState.rowData[i] !== null) {
                  // Use existing row data
                  rowData = boxState.rowData[i];
                } else if (i === boxState.currentRow && levelData?.col1 && levelData?.col2) {
                  // Show current row data from levelData safely
                  rowData = {
                    col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || "",
                    col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ""
                  };
                } else {
                  // Empty for future rows
                  rowData = { col1: "", col2: "" };
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
      <div className="mt-4 text-center text-gray-600">
        Minimum Current Row: {Math.min(
          boxStates.box1.currentRow,
          boxStates.box2.currentRow,
          boxStates.box3.currentRow
        ) + 1}
      </div>
    </div>
  );
}
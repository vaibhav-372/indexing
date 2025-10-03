// Importing React hooks and axios for HTTP requests
import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Main component
export default function Game() {
  // Number of rows initially (8 rows for each box table)
  const [row, setRow] = useState(8);

  // Level states for each box (all start at level 1)
  const [boxLevels, setBoxLevels] = useState({ box1: 1, box2: 1, box3: 1 });

  // Extra states to track row transitions (not used fully yet)
  const [oldRow, setOldRow] = useState({ box1: false, box2: false, box3: false });
  const [newRow, setNewRow] = useState({ box1: false, box2: false, box3: false });

  // Data fetched from the backend for each box (col1, col2 values)
  const [data, setData] = useState({
    box1: { col1: [], col2: [] },
    box2: { col1: [], col2: [] },
    box3: { col1: [], col2: [] },
  });

  // Main state for each box, initialized using makeBoxState()
  const [boxStates, setBoxStates] = useState({
    box1: makeBoxState(row),
    box2: makeBoxState(row),
    box3: makeBoxState(row),
  });

  // Prevent rapid double clicks per box (debounce/idempotent)
  const [lastClickAt, setLastClickAt] = useState({ box1: 0, box2: 0, box3: 0 });

  // Track last same-box click to enable hyphen rule across boxes
  const [lastSameBoxClick, setLastSameBoxClick] = useState({ boxKey: '', rowIndex: -1 });

  // Helper function to create the initial structure of a box
  function makeBoxState(row) {
    return {
      currentRow: 0,                  // index of the active row
      dataIndex: 0,                   // pointer into fetched col1/col2 arrays
      rowData: Array(row).fill(null), // holds displayed data for each row
      left: Array(row).fill(''),      // left button selections per row
      right: Array(row).fill(''),     // right button selections per row
      completedRows: Array(row).fill(false), // flags whether row is completed
      // no sequence snapshot; values commit only on click
    };
  }

  // // Function to compute total for a specific row across all boxes
  // const computeRowCol2Total = (rowIdx) => {
  //   const boxes = ['box1', 'box2', 'box3'];
  //   return boxes.reduce((sum, key) => {
  //     const bState = boxStates[key];
      
  //     // Check if this row exists in the box's rowData and has data
  //     if (rowIdx < bState.rowData.length && bState.rowData[rowIdx] !== null) {
  //       const rowData = bState.rowData[rowIdx];
  //       const val = rowData?.col2;
        
  //       // Ignore hyphens, empty values, and non-numbers
  //       if (val === '-' || val === undefined || val === null || val === '') return sum;
        
  //       const n = Number(val);
  //       return sum + (Number.isFinite(n) ? n : 0);
  //     }
      
  //     return sum;
  //   }, 0);
  // };

  // Enhanced function to compute total for a specific row across all boxes
const computeRowCol2Total = (rowIdx) => {
  const boxes = ['box1', 'box2', 'box3'];
  return boxes.reduce((sum, key) => {
    const bState = boxStates[key];
    const boxData = data[key];
    
    let col2Value = null;
    
    // Case 1: Row has committed data
    if (rowIdx < bState.rowData.length && bState.rowData[rowIdx] !== null) {
      const rowData = bState.rowData[rowIdx];
      col2Value = rowData?.col2;
    }
    // Case 2: This is the current active row - show preview from data
    else if (rowIdx === bState.currentRow && boxData?.col2?.length > 0) {
      const nextIndex = bState.dataIndex % boxData.col2.length;
      col2Value = boxData.col2[nextIndex] || "";
    }
    
    // Process the value
    if (col2Value && col2Value !== '-' && col2Value !== '') {
      const n = Number(col2Value);
      return sum + (Number.isFinite(n) ? n : 0);
    }
    
    return sum;
  }, 0);
};

  // Function to fetch data for a given box and level
  const fetchData = (boxKey, level) => {
    axios
      .get(`https://index-backend.vercel.app/data`) // request to backend API
      .then((res) => {
        // Check if response has data for this box and level
        if (res.data && res.data[boxKey]?.[`level${level}`]) {
          const levelData = res.data[boxKey][`level${level}`];

          // Update main data state
          setData((prev) => ({
            ...prev,
            [boxKey]: {
              col1: levelData.col1 || [],
              col2: levelData.col2 || [],
            },
          }));

          // Update boxStates with initial row values
          setBoxStates((prev) => {
            const boxState = prev[boxKey];
            const updatedRowData = [...boxState.rowData];

            // Initialize first row with first col1/col2 values
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

  // Load initial data for all boxes on mount
  useEffect(() => {
    fetchData('box1', boxLevels.box1);
    fetchData('box2', boxLevels.box2);
    fetchData('box3', boxLevels.box3);
  }, []);

  // When user changes level from dropdown
  const handleLevelChange = (boxKey, level) => {
    setBoxLevels((prev) => ({ ...prev, [boxKey]: level }));
    fetchData(boxKey, level);
  };

  // Handle left button click (A/B or C/D etc.)
  const handleLeftClick = (boxKey, rowIndex, value) => {
    setBoxStates(prev => {
      const boxState = prev[boxKey];
      const updatedLeft = [...boxState.left];

      // Toggle selection: deselect if same value is clicked again
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
    // Debounce: ignore very fast repeated clicks per box
    const now = Date.now();
    if (now - lastClickAt[boxKey] < 250) return;
    setLastClickAt(prev => ({ ...prev, [boxKey]: now }));

    setBoxStates(prev => {
      const updatedStates = { ...prev };
      const boxState = { ...updatedStates[boxKey] };

      // Prevent re-clicking a completed row
      if (boxState.completedRows[rowIndex]) return prev;

      // Allow filling previous rows until hyphened/completed; if clicking future rows, block
      if (rowIndex > boxState.currentRow) return prev;

      // Require a left selection first
      if (!boxState.left[rowIndex]) {
        alert("Please select a left option first!");
        return prev;
      }

      // If this row is locked by hyphen, do nothing
      const isHyphenRow = boxState.rowData[rowIndex]?.col1 === '-' && boxState.rowData[rowIndex]?.col2 === '-';
      if (isHyphenRow) return prev;

      // Apply the click exactly once for this row
      const updatedRight = [...boxState.right];
      updatedRight[rowIndex] = value;

      const updatedCompleted = [...boxState.completedRows];
      updatedCompleted[rowIndex] = true;

      const updatedRowData = [...boxState.rowData];
      updatedRowData[rowIndex] = {
        col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || "",
        col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ""
      };

      // Sequence/dataIndex advances at most once per row based on rule
      let nextDataIndex = boxState.dataIndex;
      if (boxState.left[rowIndex] !== value) {
        nextDataIndex = boxState.dataIndex + 1;
      }

      // Advance pointer only if clicking at the leading current row; leave as-is for past rows
      const nextCurrentRow = rowIndex === boxState.currentRow ? rowIndex + 1 : boxState.currentRow;

      updatedStates[boxKey] = {
        ...boxState,
        right: updatedRight,
        completedRows: updatedCompleted,
        rowData: updatedRowData,
        currentRow: nextCurrentRow,
        dataIndex: nextDataIndex,
      };

      // After every right click, check remaining boxes individually
      // Check if they clicked in current row - 1, if not, add hyphen to that row
      const previousRow = rowIndex - 1;

      if (previousRow >= 0) {
        Object.keys(updatedStates).forEach(otherKey => {
          if (otherKey === boxKey) return;
          const otherState = { ...updatedStates[otherKey] };

          // Check if this box has clicked in the previous row
          const hasClickedInPreviousRow = otherState.right[previousRow] && otherState.right[previousRow] !== '';
          const isHyphenInPreviousRow = otherState.rowData[previousRow]?.col1 === '-' && otherState.rowData[previousRow]?.col2 === '-';

          // If not clicked in previous row and not already hyphened, add hyphen
          if (!hasClickedInPreviousRow && !isHyphenInPreviousRow && previousRow < otherState.rowData.length) {
            const newRowData = [...otherState.rowData];
            newRowData[previousRow] = { col1: '-', col2: '-' };

            const newCompleted = [...otherState.completedRows];
            newCompleted[previousRow] = true;

            const newCurrentRow = otherState.currentRow === previousRow ? previousRow + 1 : otherState.currentRow;

            // Advance dataIndex for hyphened rows to maintain proper data sequence
            const newDataIndex = otherState.dataIndex;

            updatedStates[otherKey] = {
              ...otherState,
              rowData: newRowData,
              completedRows: newCompleted,
              currentRow: newCurrentRow,
              dataIndex: newDataIndex,
            };
          }
        });
      }

      // Update lastSameBoxClick for next evaluation
      setLastSameBoxClick({ boxKey, rowIndex });

      // Ensure all three boxes keep rows in sync length-wise
      const maxRowLength = Math.max(
        updatedStates.box1.rowData.length,
        updatedStates.box2.rowData.length,
        updatedStates.box3.rowData.length
      );
      if (nextCurrentRow >= maxRowLength) {
        Object.keys(updatedStates).forEach(key => {
          const s = updatedStates[key];
          updatedStates[key] = {
            ...s,
            rowData: [...s.rowData, null],
            left: [...s.left, ""],
            right: [...s.right, ""],
            completedRows: [...s.completedRows, false],
          };
        });
      }

      return updatedStates;
    });
  };

  // Sync button handler with hyphen addition for skipped boxes
  const handleSyncButton = () => {
    setBoxStates(prev => {
      const updatedStates = { ...prev };
      
      // Find the maximum current row across all boxes
      const maxCurrentRow = Math.max(
        updatedStates.box1.currentRow,
        updatedStates.box2.currentRow,
        updatedStates.box3.currentRow
      );
      
      // For each box, move to the max row and add hyphens for skipped rows
      Object.keys(updatedStates).forEach(boxKey => {
        const boxState = updatedStates[boxKey];
        const currentRow = boxState.currentRow;
        
        if (currentRow < maxCurrentRow) {
          // Create copies of arrays to modify
          const newRowData = [...boxState.rowData];
          const newCompletedRows = [...boxState.completedRows];
          const newLeft = [...boxState.left];
          const newRight = [...boxState.right];
          
          // Add hyphens for all skipped rows between currentRow and maxCurrentRow
          for (let rowIndex = currentRow; rowIndex < maxCurrentRow; rowIndex++) {
            // Ensure the array has this index
            if (rowIndex >= newRowData.length) {
              newRowData.push(null);
              newCompletedRows.push(false);
              newLeft.push('');
              newRight.push('');
            }
            
            // Only add hyphen if this row is not already completed and doesn't have data
            if (!newCompletedRows[rowIndex] && 
                (newRowData[rowIndex] === null || 
                 (newRowData[rowIndex]?.col1 !== '-' && newRowData[rowIndex]?.col2 !== '-'))) {
              newRowData[rowIndex] = { col1: '-', col2: '-' };
              newCompletedRows[rowIndex] = true;
            }
          }
          
          // Update the box state
          updatedStates[boxKey] = {
            ...boxState,
            rowData: newRowData,
            completedRows: newCompletedRows,
            left: newLeft,
            right: newRight,
            currentRow: maxCurrentRow,
          };
        }
      });
      
      return updatedStates;
    });
  };

  // Renders a single box table
  const renderTable = (boxKey, title, btn1, btn2, levelData) => {
    const boxState = boxStates[boxKey];

    // Ensure all tables expand equally
    const maxRows = Math.max(
      boxStates.box1.rowData.length,
      boxStates.box2.rowData.length,
      boxStates.box3.rowData.length
    );

    return (
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200 w-full">
        {/* Table header with title + level dropdown */}
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

        {/* Table body */}
        <div className="p-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                <th className="py-2 px-3 text-left rounded-l-lg w-16">Steps</th>
                <th className="py-2 px-3 text-left w-40">Actions</th>
                <th className="py-2 px-3 text-left w-28">Col 1</th>
                <th className="py-2 px-3 text-left rounded-r-lg w-28">Col 2</th>
                <th className="py-2 px-3 text-left rounded-r-lg w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Render rows dynamically */}
              {Array.from({ length: maxRows }, (_, i) => i)   // array of indexes
                .reverse()                                    // reverse order (bottom → top)
                .map((i) => {
                  const isCompletedInThisBox =
                    i < boxState.completedRows.length
                      ? boxState.completedRows[i]
                      : false;

                  // Hyphen-lock detection for this row in this box
                  const isHyphenRowForThisBox =
                    i < boxState.rowData.length &&
                    boxState.rowData[i] !== null &&
                    boxState.rowData[i]?.col1 === '-' &&
                    boxState.rowData[i]?.col2 === '-';

                  // Allow clicks on current or previous rows (<= currentRow) if not completed and not hyphened
                  const rightDisabled =
                    isCompletedInThisBox || isHyphenRowForThisBox || i > boxState.currentRow;

                  // Get row data for rendering
                  let rowData;
                  if (i < boxState.rowData.length && boxState.rowData[i] !== null) {
                    rowData = boxState.rowData[i];
                  } else if (i === boxState.currentRow && levelData?.col1 && levelData?.col2) {
                    // Preview next values for the current row using this box's own dataIndex
                    rowData = {
                      col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || "",
                      col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ""
                    };
                  } else {
                    rowData = { col1: "", col2: "" };
                  }

                  const leftValue = i < boxState.left.length ? boxState.left[i] : '';
                  const rightValue = i < boxState.right.length ? boxState.right[i] : '';

                  return (
                    <tr key={i} className=" transition-colors">
                      {/* Step number */}
                      <td className="py-2 px-3 font-medium text-balck">{i + 1}</td>

                      {/* Left choice buttons */}
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

                      {/* Display row data */}
                      <td className="py-2 px-3 text-black">{rowData.col1}</td>
                      <td className="py-2 px-3 text-black">{rowData.col2}</td>

                      {/* Right choice buttons */}
                      <td className="py-2 px-3 space-x-2 flex">
                        <button
                          onClick={() => handleRightClick(boxKey, i, btn1, levelData)}
                          disabled={rightDisabled}
                          className={`px-3 py-1 rounded-lg shadow-sm transition ${rightDisabled
                            ? rightValue === btn1
                              ? 'bg-red-500 text-white'
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
                              ? 'bg-red-500 text-white'
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

  // Final JSX return — renders all 3 box tables side by side
  return (
    <div className="max-w-7xl mx-auto px-2 py-4">
      {/* Flex layout: 3 boxes expand, total stays slim */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-3">
          {renderTable('box1', 'Box 1', 'A', 'B', data.box1)}
        </div>
        <div className="flex-1 space-y-3">
          {renderTable('box2', 'Box 2', 'C', 'D', data.box2)}
        </div>
        <div className="flex-1 space-y-3">
          {renderTable('box3', 'Box 3', 'E', 'F', data.box3)}
        </div>

        {/* Totals table (slim, aligned properly) */}
        <div className="bg-white shadow-lg rounded-2xl border border-gray-200 w-32 flex-shrink-0">
          {/* Header */}
          <div className="bg-[#2EE8B3] text-white py-3 px-4 rounded-t-2xl flex items-center justify-between">
            <span className="text-lg font-semibold tracking-wide">Total</span>
            {/* Sync button */}
            <button
              onClick={handleSyncButton}
              className="px-2 py-1 rounded-md shadow-sm transition duration-200 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium cursor-pointer"
              title="Sync all boxes to highest row"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Table body */}
          <div className="p-4">
            <table className="table-fixed border-collapse w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                  <th className="py-4 px-2 rounded-lg text-center">Row Total</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  {
                    length: Math.max(
                      boxStates.box1.rowData.length,
                      boxStates.box2.rowData.length,
                      boxStates.box3.rowData.length
                    ),
                  },
                  (_, i) => i
                )
                  .reverse()
                  .map((i) => {
                    const rowTotal = computeRowCol2Total(i);
                    return (
                      <tr key={i}>
                        <td className="py-3 px-2 text-black text-center font-medium">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
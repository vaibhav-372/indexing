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

  const getDisplayedRowDataFor = (boxKey, rowIdx) => {
    const bState = boxStates[boxKey];
    if (rowIdx < bState.rowData.length && bState.rowData[rowIdx] !== null) {
      return bState.rowData[rowIdx] || { col1: '', col2: '' };
    }
    return { col1: '', col2: '' };
  };

  const computeRowCol2Total = (rowIdx) => {
    const boxes = ['box1', 'box2', 'box3'];
    return boxes.reduce((sum, key) => {
      const rd = getDisplayedRowDataFor(key, rowIdx);
      const val = rd?.col2;
      if (val === '-' || val === undefined || val === null || val === '') return sum;
      const n = Number(val);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  };

  // Function to fetch data for a given box and level
  const fetchData = (boxKey, level) => {
    axios
      .get(`http://localhost:5000/data`) // request to backend API
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

      // Consecutive same-box hyphen rule across boxes (Case-1/2/3)
      // If last click was on the same box and immediately previous row, hyphen unfilled cells
      if (
        lastSameBoxClick.boxKey === boxKey &&
        lastSameBoxClick.rowIndex === rowIndex - 1 &&
        rowIndex > 0
      ) {
        const prevRow = rowIndex - 1;
        // For every other box, if its prevRow is not completed, hyphen and advance pointer if needed
        Object.keys(updatedStates).forEach(otherKey => {
          if (otherKey === boxKey) return;
          const otherState = { ...updatedStates[otherKey] };
          const otherRight = otherState.right[prevRow] ?? '';
          const otherIsHyphen = otherState.rowData[prevRow]?.col1 === '-' && otherState.rowData[prevRow]?.col2 === '-';

          // Only hyphen if that box's cell in prevRow is not already filled and not hyphened
          if (otherRight === '' && !otherIsHyphen) {
            const newRowData = [...otherState.rowData];
            newRowData[prevRow] = { col1: '-', col2: '-' };

            const newCompleted = [...otherState.completedRows];
            newCompleted[prevRow] = true;

            const newCurrentRow = otherState.currentRow === prevRow ? prevRow + 1 : otherState.currentRow;

            updatedStates[otherKey] = {
              ...otherState,
              rowData: newRowData,
              completedRows: newCompleted,
              currentRow: newCurrentRow,
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



  //   const handleRightClick = (boxKey, rowIndex, value, levelData) => {
  //   setBoxStates(prev => {
  //     const updatedStates = { ...prev };
  //     const boxState = { ...updatedStates[boxKey] };

  //     // Prevent clicks outside the current row
  //     if (rowIndex !== boxState.currentRow) return prev;

  //     // Track click states
  //     const alreadyClicked = newRow[boxKey]; // this box clicked in this row before?

  //     // ---- FIRST CLICK IN THIS ROW ----
  //     if (!alreadyClicked) {
  //       if (!boxState.left[rowIndex]) {
  //         alert("Please select a left option first!");
  //         return prev;
  //       }

  //       // Mark right value + complete row for this box
  //       const updatedRight = [...boxState.right];
  //       updatedRight[rowIndex] = value;

  //       const updatedCompleted = [...boxState.completedRows];
  //       updatedCompleted[rowIndex] = true;

  //       const updatedRowData = [...boxState.rowData];
  //       if (!updatedRowData[rowIndex]) {
  //         updatedRowData[rowIndex] = {
  //           col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || "",
  //           col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ""
  //         };
  //       }

  //       let nextDataIndex = boxState.dataIndex;
  //       if (boxState.left[rowIndex] !== value) {
  //         nextDataIndex += 1;
  //       }

  //       updatedStates[boxKey] = {
  //         ...boxState,
  //         right: updatedRight,
  //         completedRows: updatedCompleted,
  //         rowData: updatedRowData,
  //         currentRow: rowIndex + 1,
  //         dataIndex: nextDataIndex,
  //       };

  //       // update tracking states
  //       setOldRow(prevOld => ({ ...prevOld, [boxKey]: false }));
  //       setNewRow(prevNew => ({ ...prevNew, [boxKey]: true }));

  //     } else {
  //       // ---- SECOND CLICK ON SAME BOX ----
  //       // fill hyphens for every other box in this row
  //       Object.keys(updatedStates).forEach(otherKey => {
  //         const otherState = updatedStates[otherKey];
  //         if (otherKey !== boxKey && otherState.currentRow === rowIndex) {
  //           const newRowData = [...otherState.rowData];
  //           newRowData[rowIndex] = { col1: "-", col2: "-" };

  //           const newCompleted = [...otherState.completedRows];
  //           newCompleted[rowIndex] = true;

  //           updatedStates[otherKey] = {
  //             ...otherState,
  //             rowData: newRowData,
  //             completedRows: newCompleted,
  //             currentRow: rowIndex + 1,
  //           };
  //         }
  //       });

  //       // move this clicked box also to the next row
  //       updatedStates[boxKey] = {
  //         ...boxState,
  //         currentRow: rowIndex + 1,
  //       };

  //       // reset tracking since row is finished
  //       setOldRow({ box1: false, box2: false, box3: false });
  //       setNewRow({ box1: false, box2: false, box3: false });
  //     }

  //     // ensure rows expand equally
  //     const maxRowLength = Math.max(
  //       updatedStates.box1.rowData.length,
  //       updatedStates.box2.rowData.length,
  //       updatedStates.box3.rowData.length
  //     );
  //     if (rowIndex + 1 >= maxRowLength) {
  //       Object.keys(updatedStates).forEach(key => {
  //         const s = updatedStates[key];
  //         updatedStates[key] = {
  //           ...s,
  //           rowData: [...s.rowData, null],
  //           left: [...s.left, ""],
  //           right: [...s.right, ""],
  //           completedRows: [...s.completedRows, false],
  //         };
  //       });
  //     }

  //     return updatedStates;
  //   });
  // };

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
      <div className="bg-gray-700 shadow-lg rounded-2xl overflow-hidden border border-gray-200 w-full">
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
                <th className="py-2 px-3 text-left w-28">Col 2</th>
                <th className="py-2 px-3 text-left rounded-r-lg w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Render rows dynamically */}
              {Array.from({ length: maxRows }, (_, i) => {
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

                // Compute total of col2 across all boxes for this row (hyphen or non-number => 0)
                const getCol2Number = (state, idx) => {
                  const rd = idx < state.rowData.length ? state.rowData[idx] : null;
                  const v = rd && rd.col2 !== undefined && rd.col2 !== null ? rd.col2 : '';
                  if (v === '-' || v === '') return 0;
                  const n = Number(v);
                  return Number.isFinite(n) ? n : 0;
                };
                const rowTotal =
                  getCol2Number(boxStates.box1, i) +
                  getCol2Number(boxStates.box2, i) +
                  getCol2Number(boxStates.box3, i);

                return (
                  <tr key={i} className=" transition-colors">
                    {/* Step number */}
                    <td className="py-2 px-3 font-medium text-white">{i + 1}</td>

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
                    <td className="py-2 px-3 text-white">{rowData.col1}</td>
                    <td className="py-2 px-3 text-white">{rowData.col2}</td>

                    {/* Right choice buttons */}
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
        <div className="bg-gray-700 shadow-lg rounded-2xl border border-gray-200 w-28 flex-shrink-0">
          {/* Header */}
          <div className="bg-[#2EE8B3] text-white py-3 px-3 rounded-t-2xl text-center">
            <span className="text-lg font-semibold tracking-wide">Total</span>
          </div>

          {/* Table body */}
          <div className="p-4">
            <table className="table-fixed border-collapse w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                  <th className="py-4 px-2 rounded-lg text-center">Total</th>
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
                  (_, i) => {
                    const rowTotal = computeRowCol2Total(i);
                    return (
                      <tr key={i}>
                        <td className="py-3 px-2 text-white text-center">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

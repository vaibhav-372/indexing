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

  // Helper function to create the initial structure of a box
  function makeBoxState(row) {
    return {
      currentRow: 0,                  // index of the active row
      dataIndex: 0,                   // pointer into fetched col1/col2 arrays
      rowData: Array(row).fill(null), // holds displayed data for each row
      left: Array(row).fill(''),      // left button selections per row
      right: Array(row).fill(''),     // right button selections per row
      completedRows: Array(row).fill(false), // flags whether row is completed
    };
  }


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

  // Handle right button click (validate + move to next row)
  const handleRightClick = (boxKey, rowIndex, value, levelData) => {
    setBoxStates(prev => {
      const updatedStates = { ...prev };
      const boxState = { ...updatedStates[boxKey] };

      // Get the lowest active row across all boxes
      const minCurrentRow = Math.min(
        updatedStates.box1.currentRow,
        updatedStates.box2.currentRow,
        updatedStates.box3.currentRow
      );

      // console.log('minimum current row', minCurrentRow)

      // Prevent clicking outside the current row
      if (rowIndex !== boxState.currentRow) return prev;

      // Check if this row already completed in this box
      const isSecondClick = boxState.completedRows[rowIndex];

      if (!isSecondClick) {
        // First click in this row
        if (!boxState.left[rowIndex]) {
          alert("Please select a left option first!");
          return prev;
        }

        // Mark right value and set row completed
        const updatedRight = [...boxState.right];
        updatedRight[rowIndex] = value;

        const updatedCompleted = [...boxState.completedRows];
        updatedCompleted[rowIndex] = true;

        // Save actual row data from levelData
        const updatedRowData = [...boxState.rowData];
        if (!updatedRowData[rowIndex]) {
          updatedRowData[rowIndex] = {
            col1: levelData.col1[boxState.dataIndex % levelData.col1.length] || "",
            col2: levelData.col2[boxState.dataIndex % levelData.col2.length] || ""
          };
        }

        // If left and right don’t match → move to next data index
        let nextDataIndex = boxState.dataIndex;
        if (boxState.left[rowIndex] !== value) {
          nextDataIndex += 1;
        }

        // Advance this box to next row
        updatedStates[boxKey] = {
          ...boxState,
          right: updatedRight,
          completedRows: updatedCompleted,
          rowData: updatedRowData,
          currentRow: rowIndex + 1,
          dataIndex: nextDataIndex,
        };

        // If this box moved ahead, mark hyphens for other boxes in same row
        if (rowIndex === minCurrentRow) {
          Object.keys(updatedStates).forEach(otherKey => {
            if (otherKey !== boxKey) {
              const otherState = updatedStates[otherKey];

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
        // Second click: skip row, put hyphens in this box
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

      // If row expanded, append empty slots to all boxes
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

  // Renders a single box table
  const renderTable = (boxKey, title, btn1, btn2, levelData) => {
    const boxState = boxStates[boxKey];

    // Ensure all tables expand equally
    const maxRows = Math.max(
      boxStates.box1.rowData.length,
      boxStates.box2.rowData.length,
      boxStates.box3.rowData.length
    );

    // Minimum row across boxes (for turn-based logic)
    const minCurrentRow = Math.min(
      boxStates.box1.currentRow,
      boxStates.box2.currentRow,
      boxStates.box3.currentRow
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
                <th className="py-2 px-3 text-left rounded-l-lg">Steps</th>
                <th className="py-2 px-3 text-left">Actions</th>
                <th className="py-2 px-3 text-left">Col 1</th>
                <th className="py-2 px-3 text-left">Col 2</th>
                <th className="py-2 px-3 text-left rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Render rows dynamically */}
              {Array.from({ length: maxRows }, (_, i) => {
                const isCompletedInThisBox =
                  i < boxState.completedRows.length
                    ? boxState.completedRows[i]
                    : false;
                const isCurrentRowForThisBox = i === boxState.currentRow;

                // Disable right buttons if already done or not current row
                const rightDisabled = isCompletedInThisBox || !isCurrentRowForThisBox;

                // Get row data for rendering
                let rowData;
                if (i < boxState.rowData.length && boxState.rowData[i] !== null) {
                  rowData = boxState.rowData[i];
                } else if (i === boxState.currentRow && levelData?.col1 && levelData?.col2) {
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
                  <tr key={i} className="hover:bg-gray-100 transition-colors">
                    {/* Step number */}
                    <td className="py-2 px-3 font-medium text-gray-800">{i + 1}</td>

                    {/* Left choice buttons */}
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleLeftClick(boxKey, i, btn1)}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          leftValue === btn1
                            ? 'bg-gray-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {btn1}
                      </button>

                      <button
                        onClick={() => handleLeftClick(boxKey, i, btn2)}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          leftValue === btn2
                            ? 'bg-gray-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {btn2}
                      </button>
                    </td>

                    {/* Display row data */}
                    <td className="py-2 px-3 text-gray-700">{rowData.col1}</td>
                    <td className="py-2 px-3 text-gray-700">{rowData.col2}</td>

                    {/* Right choice buttons */}
                    <td className="py-2 px-3 space-x-2 flex">
                      <button
                        onClick={() => handleRightClick(boxKey, i, btn1, levelData)}
                        disabled={rightDisabled}
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          rightDisabled
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
                        className={`px-3 py-1 rounded-lg shadow-sm transition ${
                          rightDisabled
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
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {renderTable('box1', 'Box 1', 'A', 'B', data.box1)}
        {renderTable('box2', 'Box 2', 'C', 'D', data.box2)}
        {renderTable('box3', 'Box 3', 'E', 'F', data.box3)}
      </div>
      <div className="mt-4 text-center text-gray-600">
        {/* Show which row is minimum among all boxes */}
        Minimum Current Row: {Math.min(
          boxStates.box1.currentRow,
          boxStates.box2.currentRow,
          boxStates.box3.currentRow
        ) + 1}
      </div>
    </div>
  );
}

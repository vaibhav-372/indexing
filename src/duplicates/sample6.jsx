const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const DataSchema = new mongoose.Schema({
  box1: Object,
  box2: Object,
  box3: Object,
});

const TableData = mongoose.model('tabledata', DataSchema);

// GET data
app.get('/data', async (req, res) => {
  try {
    const data = await TableData.findOne({}, { _id: 0 });
    if (!data) return res.status(404).json({ message: 'No data found' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// POST/PUT data (full or partial update)
app.post('/data', async (req, res) => {
  try {
    const updateData = req.body;

    const updatedDoc = await TableData.findOneAndUpdate(
      {}, // match first document
      { $set: updateData }, // update only provided fields
      { new: true, upsert: true } // return updated doc & create if not exists
    );

    res.json({
      message: 'Data saved successfully',
      data: updatedDoc
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));








import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Game() {
  const [row, setRow] = useState(8);
  const [count, setCount] = useState(0);
  const [globalCurrentRow, setGlobalCurrentRow] = useState(0);
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
      const boxState = { ...updatedStates[boxKey] };

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

        updatedStates[boxKey] = {
          ...boxState,
          right: updatedRight,
          completedRows: updatedCompleted,
          rowData: updatedRowData,
          currentRow: rowIndex + 1,
          dataIndex: nextDataIndex,
        };
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
          currentRow: Math.max(boxState.currentRow, rowIndex + 1),
        };
      }

      // Expand rows dynamically if needed
      if (rowIndex + 1 === updatedStates[boxKey].rowData.length) {
        const extra = 1;
        Object.keys(updatedStates).forEach(key => {
          const s = updatedStates[key];

          // Carry forward the last data index to new rows
          const lastDataIndex = s.dataIndex;

          updatedStates[key] = {
            ...s,
            rowData: [...s.rowData, null],
            left: [...s.left, ''],
            right: [...s.right, ''],
            completedRows: [...s.completedRows, false],
            dataIndex: lastDataIndex,
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
                // const isCurrentRowInThisBox = i === boxState.currentRow;
                const maxCurrentRow = Math.max(
                  boxStates.box1.currentRow,
                  boxStates.box2.currentRow,
                  boxStates.box3.currentRow
                );
                const isCurrentRowInThisBox = i === maxCurrentRow;


                // Check if this row is completed in any other box
                const isCompletedInOtherBox = Object.keys(boxStates)
                  .filter(key => key !== boxKey)
                  .some(otherBoxKey =>
                    i < boxStates[otherBoxKey].completedRows.length ?
                      boxStates[otherBoxKey].completedRows[i] : false
                  );

                // Right buttons are disabled if:
                // 1. Completed in this box, OR
                // 2. Not the current row (based on max current row), OR
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
                  // Another box forced hyphen, so mark hyphen
                  rowData = { col1: "-", col2: "-" };
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
    </div>
  );
}


// Each row has two buttons:

// Left button (L)

// Right button (R)

// The game rules for enabling/disabling buttons are:

// Left buttons (L):

// Always clickable at any time, regardless of the current row.

// If I click multiple left buttons in advance (future rows), those clicks should be remembered and not reset.

// Right buttons (R):

// Only enabled for the current row (the row that is currently active).

// All right buttons in past rows and future rows must remain completely disabled.

// Even if I clicked left in those past/future rows, their right button should stay disabled until that row becomes the current row.

// Row Completion Rule:

// A row is considered "completed" only after both its left and right buttons are clicked.

// The game should not allow skipping rows.

// That means: Row 2’s right button is enabled only after Row 1 is completed (both L and R clicked).

// Similarly, Row 3’s right button is enabled only after Row 2 is completed, and so on.

// Memory Rule:

// If I click left buttons in future rows (say Row 3 L, Row 4 L) before reaching them, those clicks must be remembered when I finally reach those rows.

// Do not reset or remove those pre-clicks.

// Summary:

// Left buttons → always free to click anytime (pre-clicks allowed).

// Right buttons → strictly tied to the current row only.

// Completion order → strictly sequential (row by row).

// Pre-clicked lefts → remembered and applied when their row becomes active.



// this is the exact logic
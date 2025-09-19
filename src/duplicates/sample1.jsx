import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Game() {
  const [row, setRow] = useState(8);
  const [currentRow, seturrentRow] = useState();
  
  const [level, setLevel] = useState("level1")

  const [box1Left1, setBox1Left1] = useState("");
  const [box1Left2, setBox1Left2] = useState("");
  const [box1Left3, setBox1Left3] = useState("");
  const [box1Left4, setBox1Left4] = useState("");
  const [box1Left5, setBox1Left5] = useState("");
  const [box1Left6, setBox1Left6] = useState("");
  const [box1Left7, setBox1Left7] = useState("");
  const [box1Left8, setBox1Left8] = useState("");

  const [box2Left1, setBox2Left1] = useState("");
  const [box2Left2, setBox2Left2] = useState("");
  const [box2Left3, setBox2Left3] = useState("");
  const [box2Left4, setBox2Left4] = useState("");
  const [box2Left5, setBox2Left5] = useState("");
  const [box2Left6, setBox2Left6] = useState("");
  const [box2Left7, setBox2Left7] = useState("");
  const [box2Left8, setBox2Left8] = useState("");

  const [box3Left1, setBox3Left1] = useState("");
  const [box3Left2, setBox3Left2] = useState("");
  const [box3Left3, setBox3Left3] = useState("");
  const [box3Left4, setBox3Left4] = useState("");
  const [box3Left5, setBox3Left5] = useState("");
  const [box3Left6, setBox3Left6] = useState("");
  const [box3Left7, setBox3Left7] = useState("");
  const [box3Left8, setBox3Left8] = useState("");

  const [box1LeftPresent, setBox1LeftPresent] = useState("");
  const [box2LeftPresent, setBox2LeftPresent] = useState("");
  const [box3LeftPresent, setBox3LeftPresent] = useState("");

  const [box1RightPresent, setBox1RightPresent] = useState("");
  const [box2RightPresent, setBox2RightPresent] = useState("");
  const [box3RightPresent, setBox3RightPresent] = useState("");

  const [data, setData] = useState({
    box1Level1: { col1: '', col2: '' },
    box1Level2: { col1: '', col2: '' },
    box1Level3: { col1: '', col2: '' },
    box1Level4: { col1: '', col2: '' },
    box2Level1: { col1: '', col2: '' },
    box2Level2: { col1: '', col2: '' },
    box2Level3: { col1: '', col2: '' },
    box2Level4: { col1: '', col2: '' },
    box3Level1: { col1: '', col2: '' },
    box3Level2: { col1: '', col2: '' },
    box3Level3: { col1: '', col2: '' },
    box3Level4: { col1: '', col2: '' },
  });

  useEffect(() => {
    axios.get('http://localhost:5000/data')
      .then((res) => {
        if (res.data) {
          setData({
            box1Level1: { col1: res.data?.box1?.level1?.col1 || '', col2: res.data?.box1?.level1?.col2 || '' },
            box1Level2: { col1: res.data?.box1?.level2?.col1 || '', col2: res.data?.box1?.level2?.col2 || '' },
            box1Level3: { col1: res.data?.box1?.level3?.col1 || '', col2: res.data?.box1?.level3?.col2 || '' },
            box1Level4: { col1: res.data?.box1?.level4?.col1 || '', col2: res.data?.box1?.level4?.col2 || '' },
            box2Level1: { col1: res.data?.box2?.level1?.col1 || '', col2: res.data?.box2?.level1?.col2 || '' },
            box2Level2: { col1: res.data?.box2?.level2?.col1 || '', col2: res.data?.box2?.level2?.col2 || '' },
            box2Level3: { col1: res.data?.box2?.level3?.col1 || '', col2: res.data?.box2?.level3?.col2 || '' },
            box2Level4: { col1: res.data?.box2?.level4?.col1 || '', col2: res.data?.box2?.level4?.col2 || '' },
            box3Level1: { col1: res.data?.box3?.level1?.col1 || '', col2: res.data?.box3?.level1?.col2 || '' },
            box3Level2: { col1: res.data?.box3?.level2?.col1 || '', col2: res.data?.box3?.level2?.col2 || '' },
            box3Level3: { col1: res.data?.box3?.level3?.col1 || '', col2: res.data?.box3?.level3?.col2 || '' },
            box3Level4: { col1: res.data?.box3?.level4?.col1 || '', col2: res.data?.box3?.level4?.col2 || '' },
          });
        }
      })
      .catch((err) => console.error('Error fetching data:', err));
  }, []);

  const renderTable = (title, btn1, btn2, levelData) => {
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
              {Array.from({ length: row }, (_, i) => (
                <tr key={i} className="hover:bg-gray-100 transition-colors">
                  <td className="py-2 px-3 font-medium text-gray-800">{i + 1}</td>

                  {/* left buttons */}
                  <td className="py-2 px-3 space-x-2 flex">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow-sm transition">
                      {btn1}
                    </button>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow-sm transition">
                      {btn2}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {i === 0 ? levelData.col1[0] : ''}
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {i === 0 ? levelData.col2[0] : ''}
                  </td>

                  {/* right buttons */}
                  <td className="py-2 px-3 space-x-2 flex">
                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow-sm transition">
                      {btn1}
                    </button>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow-sm transition">
                      {btn2}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {renderTable("Box 1", "A", "B", data.box1Level1)}
        {renderTable("Box 2", "C", "D", data.box2Level1)}
        {renderTable("Box 3", "E", "F", data.box3Level1)}
      </div>
    </div>
  );
}

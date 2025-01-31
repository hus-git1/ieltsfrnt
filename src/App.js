import React, { useState, useEffect } from "react";
import "./App.css";

const sections = [
  "Introduction",
  "Introduction","Introduction",
  "Introduction","Introduction",
  "Introduction","Introduction",
  "Introduction","Introduction",
  "Introduction",
  "Cue Card",
  "Follow-Up Questions"
];

function App() {
  const [currentSection, setCurrentSection] = useState(0);
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [history, setHistory] = useState(""); // New variable to store all text
  const [report, setReport] = useState(""); // New variable to store all text

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const speechRecognition = new window.webkitSpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = false;
      speechRecognition.lang = "en-US";

      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;

        const newEntry = `
          Section: ${sections[currentSection]}
          Question: ${question}
          Response: ${transcript}\n\n
        `;

        // Update responses and history
        setResponses((prev) => [
          ...prev,
          { section: sections[currentSection], question: question, response: transcript }
        ]);
        setHistory((prev) => prev + newEntry);

        if (currentSection < sections.length ) {
          setCurrentSection((prev) => prev + 1);
        } else {
          alert("Test completed. Generating report...");
          generateFinalString();
        }
      };

      speechRecognition.onerror = (error) => {
        console.error("Speech recognition error:", error);
      };

      setRecognition(speechRecognition);
    } else {
      alert("Speech Recognition API not supported in this browser");
    }
  }, [currentSection, question]);

  const fetchQuestion = async () => {
    try {
      const response = await fetch("https://prism-backend-lyart.vercel.app/api/groq/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sections[currentSection], history: history }), // Send history too
      });
      // console.log(history);
      const data = await response.json();
      setQuestion(data.question);
    } catch (error) {
      console.error("Failed to fetch question:", error);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [currentSection]);

  const startListening = () => {
    recognition.abort();
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  const generateFinalString = () => {
    const finalString = `
      IELTS Speaking Test Report:

      Sections, Questions, and Responses:
      ${responses.map(
        (response) =>
          `Section: ${response.section}\nQuestion: ${response.question}\nResponse: ${response.response}\n\n`
      ).join("")}
    `;

    console.log(finalString); // Log it to the console
    alert("Report Generated! Check the console for details.");
    generatereport(finalString);
  };

  const generatereport = async (finalString) => {
    try {
      const response = await fetch("https://prism-backend-lyart.vercel.app/api/groq/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final: finalString}), // Send history too
      });
      // console.log(history);
      const rep = await response.json();
      setReport(rep);
    } catch (error) {
      console.error("Failed to fetch question:", error);
    }
  };

  return (
    <div className="app">
      <h1>IELTS Speaking Test</h1>
      <div className="section">
        <h2>Section: {sections[currentSection]}</h2>
        <p>Question: {question}</p>
      </div>
      <div className="controls">
        {isListening ? (
          <button onClick={stopListening}>Stop</button>
        ) : (
          <button onClick={startListening}>Start Answering</button>
        )}
      </div>
      <div className="responses">
        <h2>Your Responses:</h2>
        <ul>
          {responses.map((response, index) => (
            <li key={index}>
              <strong>{response.section}:</strong> 
              <br />
              <strong>Question:</strong> {response.question}
              <br />
              <strong>Response:</strong> {response.response}
            </li>
          ))}
        </ul>
      </div>
      {currentSection === sections.length && (
        <button onClick={generateFinalString}>Generate Report</button>
      )}
      {/* {report && <p>Report: {report.report}</p>} */}
{report && 
  <p dangerouslySetInnerHTML={{ __html: report.report.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
}

    </div>
  );
}

export default App;

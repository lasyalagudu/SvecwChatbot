import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { Sun, Moon, Mic, Copy, Check } from "lucide-react";

function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use a ref to store the recognition instance
  const recognitionRef = useRef(null);

  const text = "Welcome to XENORA...";

  // Use useCallback to memoize the handleQuerySubmit function
  const handleQuerySubmit = useCallback(
    async (transcriptText) => {
      const queryText = transcriptText || query;

      if (!queryText.trim()) {
        setError("Please enter a query.");
        return;
      }

      setError("");
      const userMessage = { text: queryText, sender: "user" };
      setQuery("");
      setLoading(true);

      setMessages((prevMessages) => [
        { sender: "bot", loading: true },
        userMessage,
        ...prevMessages,
      ]);

      try {
        const res = await axios.post("http://localhost:5000/chat", {
          query: queryText,
        });

        const cleanedResponse = res.data.response
          .replace(/\\/g, "") // Remove bold ()
          .replace(/\\/g, ""); // Remove backticks ()

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.loading ? { text: cleanedResponse, sender: "bot" } : msg
          )
        );
      } catch (error) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.loading
              ? { text: "Error fetching response.", sender: "bot" }
              : msg
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [query]
  ); // Include query as a dependency

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        // Need to wrap this in a setTimeout to ensure state updates before submission
        setTimeout(() => handleQuerySubmit(transcript), 100);
      };

      recognitionRef.current.onerror = (event) => {
        setError("Speech recognition error: " + event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [handleQuerySubmit]); // Add handleQuerySubmit as a dependency

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMessages([{ text: "Hey! Hi, how can I assist you?", sender: "bot" }]);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Update the startListening function in your App component
  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      // Check if we're already listening
      if (isListening) {
        recognitionRef.current.stop();
        // The onend event will set isListening to false
      } else {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Speech recognition error:", error);
      setError("Could not start speech recognition. Try again.");
      setIsListening(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Loading animation component
  const LoadingDots = () => {
    return (
      <div className="flex space-x-1 mt-1 ml-1">
        <div className="loading-dot"></div>
        <div className="loading-dot" style={{ animationDelay: "0.2s" }}></div>
        <div className="loading-dot" style={{ animationDelay: "0.4s" }}></div>
      </div>
    );
  };

  return (
    <div
      className={`${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      } min-h-screen flex flex-col items-center justify-center p-4`}
    >
      {/* Toggle Theme Button */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className={`absolute top-4 right-4 p-2 rounded-full shadow-md transition ${
          theme === "light" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {theme === "light" ? (
          <Moon className="w-6 h-6 text-white" />
        ) : (
          <Sun className="w-6 h-6 text-black" />
        )}
      </button>

      <h1 className="text-3xl font-bold text-[#8806CE] mb-6">{displayText}</h1>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
      )}

      <div
        className={`shadow-xl rounded-lg p-6 w-full max-w-screen-lg flex flex-col space-y-4 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Chat Messages Box */}
        <div
          className={`h-96 overflow-y-auto p-4 border rounded-lg flex flex-col-reverse ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-gray-50 border-gray-300"
          }`}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-center mb-2 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg w-fit max-w-1/2 ${
                  theme === "dark"
                    ? msg.sender === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-600 text-white"
                    : msg.sender === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.loading ? <LoadingDots /> : msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input and Buttons */}
        <div className="flex space-x-2 w-full">
          <div className="flex-1 flex items-center relative border rounded-lg shadow-md overflow-hidden">
            <input
              type="text"
              className={`flex-1 p-3 border-none outline-none text-lg ${
                theme === "dark" ? "bg-gray-700 text-white" : "bg-white"
              }`}
              placeholder="Ask a question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleQuerySubmit();
                }
              }}
            />
            {query.trim() !== "" && (
              <div
                className={`px-2 ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
              >
                <button
                  onClick={() => copyToClipboard(query)}
                  className={`p-1 rounded ${
                    theme === "dark"
                      ? "text-gray-300 hover:bg-gray-600"
                      : "text-gray-500 hover:bg-gray-200"
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>
          <button
            className="bg-purple-500 text-white px-5 py-3 rounded-lg shadow-lg"
            onClick={() => handleQuerySubmit()}
            disabled={loading}
          >
            Send
          </button>
          <button
            className={`p-3 rounded-lg shadow-lg ${
              isListening ? "bg-red-500 listening-pulse" : "bg-green-500"
            } text-white relative`}
            onClick={startListening}
          >
            <Mic className="w-6 h-6" />
            {isListening && (
              <span className="absolute inset-0 rounded-lg listening-ring"></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
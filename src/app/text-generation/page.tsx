"use client";

import {
  faFaceGrinStars,
  faPaperPlane,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Link from "next/link";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function TextGeneration() {
  const [chats, setChats] = useState([] as { role: string; content: string }[]);
  const [message, setMessage] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
  );

  useEffect(() => {
    if (message.length > 0) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [message]);

  useEffect(() => {
    if (chats.length > 0) {
      const last = chats[chats.length - 1];
      if (last.role === "user" && !isProcessing) {
        fetchCompletion(last.content);
      }
    }
  }, [chats]);

  const fetchCompletion = async (prompt: string) => {
    setIsProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      setChats((prevChats) => [
        ...prevChats,
        {
          role: "assistant",
          content: text,
        },
      ]);

      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        setMessage((prevMessage) => `${prevMessage}\n`);
      } else {
        handleClick();
      }
      event.preventDefault();
    }
  };

  const handleClick = () => {
    setChats((prevChats) => [...prevChats, { role: "user", content: message }]);
    setMessage("");
  };

  const handleClear = () => {
    setChats([]);
  };

  const renderChat = () => {
    if (chats.length > 0) {
      return chats.map((chat, index) => {
        return (
          <div
            key={index}
            className={`flex gap-4 ${
              chat.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-4 rounded-lg max-w-[50vw] ${
                chat.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-700"
              }`}
            >
              <Markdown
                children={chat.content}
                components={{
                  code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <SyntaxHighlighter
                        {...rest}
                        PreTag="div"
                        children={String(children).replace(/\n$/, "")}
                        language={match[1]}
                        style={vscDarkPlus}
                      />
                    ) : (
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              />
            </div>
          </div>
        );
      });
    }

    return (
      <div className="flex flex-col gap-2 justify-center items-center h-full">
        <FontAwesomeIcon
          icon={faFaceGrinStars}
          className="h-8 w-8 text-slate-300"
        />
        <div className="text-slate-300">Start by typing a prompt below</div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-7xl p-4 bg-slate-800">
      <div className="fixed top-0 left-0 right-0 flex justify-between bg-slate-900 p-4">
        <div className="flex gap-4">
          <Link href="/">
            <FontAwesomeIcon icon={faArrowLeft} className="text-slate-300" />
          </Link>
          <div className="text-slate-300">Text Generation</div>
        </div>
        <div>
          <FontAwesomeIcon
            onClick={handleClear}
            icon={faTrash}
            className={`text-red-400 cursor-pointer ${
              chats.length > 0 ? "" : "hidden"
            }`}
          />
        </div>
      </div>
      <div className="h-screen overflow-auto flex flex-col gap-2 py-16">
        {renderChat()}
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 flex items-center gap-4">
        <textarea
          className="textarea resize-none w-full border-0 bg-slate-900"
          placeholder="Input Prompt..."
          style={{ height: "1rem" }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={message}
          disabled={isProcessing}
        ></textarea>
        <button
          className="btn btn-rounded bg-slate-900"
          disabled={isButtonDisabled || isProcessing}
          onClick={handleClick}
        >
          <FontAwesomeIcon
            icon={isProcessing ? faSpinner : faPaperPlane}
            spinPulse={isProcessing}
            className="h-5 w-5"
          />
        </button>
      </div>
    </div>
  );
}

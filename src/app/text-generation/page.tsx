"use client";

import {
  faFaceGrinStars,
  faPaperPlane,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft,
  faCircleXmark,
  faPaperclip,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIError,
} from "@google/generative-ai";
import Link from "next/link";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function TextGeneration() {
  const [nEnter, setNEnter] = useState(0);
  const [chats, setChats] = useState([] as { role: string; content: string }[]);
  const [message, setMessage] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [selectedFile, setSelectedFile] = useState([] as Array<File>);
  const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
  );

  useEffect(() => {
    if (message.length > 0) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
      setNEnter(0);
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
      const result = await model.generateContentStream([
        ...chats.map((chat) => chat.content),
      ]);

      for await (const chunk of result.stream) {
        const chungked = chunk.text();
        setStreamedText((prevText) => prevText + chungked);
      }
      setStreamedText("");

      const text = await result.response.then((res) => res.text());
      setChats((prevChats) => [
        ...prevChats,
        {
          role: "assistant",
          content: text,
        },
      ]);

      setIsProcessing(false);
      setSelectedFile([]);
    } catch (error) {
      console.error(error);
      setStreamedText("");
      setIsProcessing(false);
      if (error instanceof GoogleGenerativeAIError) {
        setChats((prevChats) => [
          ...prevChats,
          {
            role: "error",
            content: `Error: ${error.message}`,
          },
        ]);
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    setNEnter(Math.ceil(event.target.scrollHeight / 48) - 1);
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

  const handleFile = () => {
    const inputFile = document.createElement("input");
    inputFile.type = "file";
    inputFile.accept =
      "image/png, image/jpeg, image/webp, image/heic, image/heif";
    inputFile.multiple = true;
    inputFile.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setSelectedFile((prevFiles) => [...prevFiles, file]);
        }
      }
      inputFile.remove();
    };
    inputFile.click();
  };

  const handleRemoveAttachment = (index: number) => () => {
    setSelectedFile((prevFiles) => {
      const files = [...prevFiles];
      files.splice(index, 1);
      return files;
    });
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

  const renderStreamedChat = () => {
    if (streamedText.length > 0) {
      return (
        <div className="flex gap-4 justify-start">
          <div className="p-4 rounded-lg max-w-[50vw] bg-slate-700">
            <Markdown
              children={streamedText}
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
    }

    return null;
  };

  const renderAttachment = () => {
    if (selectedFile.length > 0) {
      return (
        <div className="fixed bottom-20 left-0 right-0 p-4">
          <div className="relative overflow-auto">
            <div className="flex flex-nowrap gap-2">
              {selectedFile.map((file, index) => {
                const url = URL.createObjectURL(file);

                return (
                  <div
                    key={`attachment-${index}`}
                    className="w-16 h-16 relative flex-none"
                  >
                    <img
                      src={url}
                      alt={file.name}
                      className="object-cover w-full h-full rounded-md"
                    />
                    <FontAwesomeIcon
                      icon={faCircleXmark}
                      className="absolute top-1 right-1 text-red-500 hover:text-red-600 text-xs hover:text-sm cursor-pointer shadow-md"
                      onClick={handleRemoveAttachment(index)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return null;
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
        {renderStreamedChat()}
      </div>
      {renderAttachment()}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex items-end gap-4 bg-slate-900">
        <button
          className="btn btn-rounded"
          disabled={isProcessing}
          onClick={handleFile}
        >
          <FontAwesomeIcon icon={faPaperclip} className="h-5 w-5" />
        </button>
        <textarea
          className="textarea resize-none w-full border-0 focus:outline-none"
          placeholder="Input Prompt..."
          style={{ height: `${3 + nEnter}rem`, maxHeight: "10rem" }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={message}
          disabled={isProcessing}
        ></textarea>
        <button
          className="btn btn-rounded"
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

"use client";
import React, { useState, useRef, useEffect } from "react";

import { Alert } from "@/components/alert";

import { useUser } from "@/lib/UserContext";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
// import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

type ChatMessage = {
  chat_id: string;
  title: string;
  language: string;
  content: string;
  id: string;
  sender_id: string;
  sent_at: string;
  updated_at: string;
};

const popularLanguages = [
  "javascript",
  "python",
  "java",
  "html",
  "css",
  "typescript",
  // Add more languages as needed
];

const deleteChat_AlertMessage = "Are you sure you want to delete this message?";

function Chat({ supabase }: { supabase: any }) {
  const [title, setTitle] = useState<string>("");
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("javascript");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const bottomRef = useRef<null | HTMLDivElement>(null);
  const [chatId, setChatId] = useState<string>(
    "4113f429-c4ad-42aa-b43f-0a2bcafaeaa5"
  );

  const userContextValue = useUser();
  const user = userContextValue ? userContextValue.user : null;
  const userId = user?.id;

  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const data = await getData();
      if (data) setAvatarsBySenderIds(data);
    }
    fetchData();
  }, []);

  const getData = async () => {
    const { data, error } = await supabase
      .from("real_time_for_pass_code")
      .select()
      .eq("chat_id", chatId);
    if (data) {
      setMessages(data);
    }
    return data;
  };

  const setAvatarsBySenderIds = async (messages: ChatMessage[]) => {
    const senderIds = Array.from(
      new Set(messages.map((item) => item.sender_id))
    );
    let avatarsObj: Record<string, string> = {};
    for (let id of senderIds) {
      const { data } = await supabase
        .from("profiles")
        .select("avatar")
        .eq("user_id", id);
      if (data && data.length > 0) {
        avatarsObj[id] = data[0].avatar;
      }
    }
    setAvatars(avatarsObj);
  };

  const handleSend = async (e: any) => {
    e.preventDefault();

    if (currentMessage.trim() !== "" && userId) {
      const { data, error } = await supabase
        .from("real_time_for_pass_code")
        .insert({
          sender_id: userId,
          content: currentMessage.trim(),
          chat_id: chatId,
          title: title,
          language: language,
        })
        .single()
        .select("*");

      if (error) {
        console.log(error);
      } else {
        // console.log(data);
        setCurrentMessage("");
        setTitle("");
      }
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel(`passCode-schema-db-changes-for-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "real_time_for_pass_code",
        },
        (payload: any) => setMessages((messages) => [...messages, payload.new])
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Scroll to bottom whenever the messages array changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDeleteMessage = async (id: string) => {
    const { data, error } = await supabase
      .from("real_time_for_pass_code")
      .delete()
      .eq("id", id);
    if (!error) {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== id)
      );
    }
  };

  const ControlBar = ({ item }: { item: ChatMessage }) => {
    return (
      <div id="control-bar" className="flex pt-1 pb-1 mb-1 gap-4 items-center">
        <div className="">
          <button
            className="text-gray-100 hover:text-gray-200 bg-gray-500 hover:bg-gray-400 rounded-lg px-2 py-1 text-xs w-[60px]"
            onClick={() => {
              navigator.clipboard.writeText(item.content);
              setCopiedItemId(item.id);
              setTimeout(() => setCopiedItemId(null), 1000); // Reset after a delay
            }}
          >
            {copiedItemId === item.id ? "Copied!" : "Copy"}
          </button>
        </div>
        {/* title */}
        <div className="flex w-full justify-center hover:cursor-pointer hover:text-gray-200">
          <div
            onClick={() => {
              navigator.clipboard
                .writeText(item.title)
                .then(() => {
                  console.log("Text copied to clipboard:", item.title);
                  setCopiedTitle("Title copied!");
                  setTimeout(() => {
                    setCopiedTitle(null);
                  }, 1000); // Reset after a second
                })
                .catch((error) => {
                  console.error("Failed to copy text to clipboard:", error);
                });
            }}
          >
            {copiedTitle === "Title copied!" ? "Title copied!" : item.title}
          </div>
        </div>
        {/* title end */}
        <div>
          <div className="text-gray-100 bg-gray-500  rounded-lg px-2 py-1 text-xs">
            {item.language}
          </div>
        </div>
        {/* {userId === item.sender_id && <div className=""></div>} */}
      </div>
    );
  };

  return (
    <div>
      <div className="border border-gray-300 rounded-lg w-full  p-4 ">
        <div className="overflow-y-auto max-h-[650px] mb-4 border rounded lg border-gray-200 pb-4 px-4">
          {/* messages map start*/}
          {messages.map((item) => (
            <div
              key={item.id}
              className={`w-full mb-2 mt-4 flex items-start ${
                userId === item.sender_id ? "justify-end" : "justify-start"
              }`}
              onMouseEnter={() => setHoveredMessageId(item.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div
                style={{ maxWidth: "100%" }}
                className="flex gap-1 items-end relative"
              >
                {userId !== item.sender_id && (
                  <div className="w-6 h-6 bg-cover bg-center rounded-full overflow-hidden flex-shrink-0">
                    <img src={avatars[item.sender_id] || ""} />
                  </div>
                )}
                <div>
                  <div className="text-[11px] text-gray-300 pr-3 pl-3 text-right">
                    {new Date(item.sent_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </div>
                  <div
                    className={`${
                      userId === item.sender_id
                        ? "bg-gray-600 text-white"
                        : "bg-gray-300 text-black"
                    } rounded-2xl px-3 py-2 break-words text-sm relative`}
                  >
                    <div
                      id="control-bar"
                      className="flex pt-1 pb-1 mb-1 gap-4 items-center"
                    >
                      <div className="">
                        <button
                          className="text-gray-100 hover:text-gray-200 bg-gray-500 hover:bg-gray-400 rounded-lg px-2 py-1 text-xs w-[60px]"
                          onClick={() => {
                            navigator.clipboard.writeText(item.content);
                            setCopiedItemId(item.id);
                            setTimeout(() => setCopiedItemId(null), 1000); // Reset after a delay
                          }}
                        >
                          {copiedItemId === item.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      {/* title */}
                      <div className="flex w-full justify-center hover:cursor-pointer hover:text-gray-200">
                        <div
                          onClick={() => {
                            navigator.clipboard
                              .writeText(item.title)
                              .then(() => {
                                console.log(
                                  "Text copied to clipboard:",
                                  item.title
                                );
                                setCopiedTitle("Title copied!");
                                setTimeout(() => {
                                  setCopiedTitle(null);
                                }, 1000); // Reset after a second
                              })
                              .catch((error) => {
                                console.error(
                                  "Failed to copy text to clipboard:",
                                  error
                                );
                              });
                          }}
                        >
                          {copiedTitle === "Title copied!"
                            ? "Title copied!"
                            : item.title}
                        </div>
                      </div>
                      {/* title end */}
                      <div>
                        <div className="text-gray-100 bg-gray-500  rounded-lg px-2 py-1 text-xs">
                          {item.language}
                        </div>
                      </div>
                      {/* {userId === item.sender_id && <div className=""></div>} */}
                    </div>

                    {userId === item.sender_id &&
                      hoveredMessageId === item.id && (
                        <Alert
                          action={handleDeleteMessage}
                          item={item.id}
                          message={deleteChat_AlertMessage}
                          title="Delete Message"
                        />
                      )}
                    {/* content */}
                    <pre className=" whitespace-pre-wrap ">
                      <SyntaxHighlighter
                        lineProps={{
                          style: {
                            wordBreak: "break-all",
                            whiteSpace: "pre-wrap",
                            lineBreak: "anywhere",
                          },
                        }}
                        wrapLines={true}
                        language={item.language}
                        style={vscDarkPlus}
                        // Enable code wrapping
                        customStyle={{
                          borderRadius: "8px",
                          padding: "10px",
                          whiteSpace: "pre-wrap", // Preserve line breaks
                        }}
                        className="rounded-lg"
                      >
                        {item.content}
                      </SyntaxHighlighter>
                    </pre>

                    {/* content */}
                    <ControlBar item={item} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* messages map end */}
          {/* This is an invisible div, acting as a marker to scroll to */}
          <div ref={bottomRef} />
        </div>
        <form action="" onSubmit={handleSend}>
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <input
                id="title"
                type="text"
                className="border rounded p-2 outline-gray-400 sm:w-1/2 w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title"
              />

              <select
                className="border rounded p-2 outline-gray-400 pr-4"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {popularLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className="border rounded p-2 outline-gray-400 w-full h-40"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type a message..."
            />

            <button
              type="submit"
              // onClick={handleSend}
              className="px-4 py-2 rounded border border-black bg-black text-white"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat;

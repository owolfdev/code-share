"use client";
import React, { useState, useRef, useEffect } from "react";
import { Alert } from "@/components/alert";
import { useUser } from "@/lib/UserContext";
import { divide, set, throttle } from "lodash";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { ControlBar, ChatContent, ChatView } from "./chatView"; // Assuming the files are in the same directory

export type ChatMessage = {
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
  "message",
  "javascript",
  "html",
  "css",
  "typescript",
  "php",
  "python",
  "java",
  "go",
  "ruby",
  "rust",
  "c",
  "c++",
  "c#",
  // Add more languages as needed
];

function CodeChat({ supabase }: { supabase: any }) {
  const [title, setTitle] = useState<string>("");
  const [copiedTitles, setCopiedTitles] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState<string>("javascript");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const [chatId, setChatId] = useState<string>(
    "4113f429-c4ad-42aa-b43f-0a2bcafaeaa5"
  );

  const userContextValue = useUser();
  const user = userContextValue ? userContextValue.user : null;
  const userId = user?.id;

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    console.log("use effect [] fetch data");
    async function fetchData() {
      const data = await getData();
      if (data) setAvatarsBySenderIds(data);
    }
    fetchData();
  }, []);

  //realtime subscription
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
        (payload: any) => {
          // console.log("insert payload", payload);
          setMessages((messages) => [...messages, payload.new]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "real_time_for_pass_code",
        },
        (payload: any) => {
          // console.log("delete payload", payload);

          setMessages((messages) =>
            messages.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
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

  // Scroll to bottom whenever the messages array changes
  useEffect(() => {
    console.log("use effect [messages], scroll to bottom", messages);
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

    const currentMessage = textAreaRef.current?.value as string;

    // console.log("lines in message:", currentMessage.split(/\r\n|\r|\n/).length);
    // setNumberOfLines(currentMessage.split(/\r\n|\r|\n/).length);

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

  const handleDeleteMessage = async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from("real_time_for_pass_code")
      .delete()
      .eq("id", id);
    if (!error) {
      // setMessages((prevMessages) =>
      //   prevMessages.filter((msg) => msg.id !== id)
      // );
    }
  };

  const handleInputChange = throttle((value) => {
    setCurrentMessage(value);
  }, 200);

  return (
    <div>
      {userId ? (
        <div className="border border-gray-300 rounded-lg w-full  p-4 ">
          <div className="overflow-y-auto max-h-[650px] mb-4 border rounded lg border-gray-200 pb-4 px-4">
            <ChatView
              messages={messages}
              item={messages[0]}
              userId={userId}
              avatars={avatars}
              setCopiedItemId={setCopiedItemId}
              setCopiedTitles={setCopiedTitles}
              setHoveredMessageId={setHoveredMessageId}
              handleDeleteMessage={handleDeleteMessage}
              copiedItemId={copiedItemId}
              copiedTitles={copiedTitles}
              hoveredMessageId={hoveredMessageId}
            />

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
                ref={textAreaRef}
                value={currentMessage}
                className="border rounded p-2 outline-gray-400 w-full h-40"
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type a message..."
              />

              <button
                type="submit"
                className="px-4 py-2 rounded border border-black bg-black text-white"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-lg h-[400px] flex justify-center items-center text-center">
          Loading...
        </div>
      )}
    </div>
  );
}

export default CodeChat;

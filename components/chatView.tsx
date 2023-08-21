import React from "react";
import { ChatMessage } from "./codeChat"; // Assume this relative path is correct.
import { Alert } from "@/components/alert"; // if needed in this component
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type ChatViewProps = {
  item: ChatMessage;
  userId?: string;
  avatars: Record<string, string>;
  setCopiedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setCopiedTitles: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setHoveredMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  handleDeleteMessage: (id: string) => void;
  copiedItemId: string | null;
  copiedTitles: Record<string, boolean>;
  hoveredMessageId: string | null;
  messages: ChatMessage[];
};

interface AlertProps {
  action: (id: string) => void;
  // ... other props
}

const deleteChat_AlertMessage = "Are you sure you want to delete this message?";

export const ControlBar: React.FC<{
  item: ChatMessage;
  setCopiedItemId: Function;
  copiedItemId: string | null;
  setCopiedTitles: Function;
  copiedTitles: Record<string, boolean>;
}> = React.memo(
  ({ item, setCopiedItemId, copiedItemId, setCopiedTitles, copiedTitles }) => {
    console.log("ControlBar!!");
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
                  setCopiedTitles((prevCopiedTitles: any) => ({
                    ...prevCopiedTitles,
                    [item.id]: true,
                  }));
                  setTimeout(() => {
                    setCopiedTitles((prevCopiedTitles: any) => ({
                      ...prevCopiedTitles,
                      [item.id]: false,
                    }));
                  }, 1000); // Reset after a second
                })
                .catch((error) => {
                  console.error("Failed to copy text to clipboard:", error);
                });
            }}
          >
            {copiedTitles[item.id] ? "Title copied!" : item.title}
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
  }
);
ControlBar.displayName = "ControlBar";

export const ChatContent: React.FC<{ item: ChatMessage }> = React.memo(
  ({ item }) => {
    console.log("ChatContent!!");
    return (
      <pre className=" whitespace-pre-wrap ">
        <SyntaxHighlighter
          lineProps={{
            style: {
              wordBreak: "break-word",
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
    );
  }
);
ChatContent.displayName = "ChatContent";

export const ChatView: React.FC<ChatViewProps> = React.memo(
  ({
    item, // You should not destructure item here as 'messages' is an array of items
    userId,
    avatars,
    setCopiedItemId,
    setCopiedTitles,
    setHoveredMessageId,
    handleDeleteMessage,
    copiedItemId,
    copiedTitles,
    hoveredMessageId,
    messages, // If you choose to pass 'messages' as a prop
  }) => {
    console.log("ChatView!!");

    const checkNumberOfLines = (value: string) => {
      const lines = value.split(/\r\n|\r|\n/).length;
      return lines;
    };

    return messages.map(
      (item: ChatMessage) =>
        userId && (
          <div
            id="chat-container"
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
                  id="chat-message"
                  className={`${
                    userId === item.sender_id
                      ? "bg-gray-600 text-white"
                      : "bg-gray-300 text-black"
                  } rounded-2xl px-3 py-2 break-words text-sm relative`}
                >
                  <ControlBar
                    item={item}
                    setCopiedItemId={setCopiedItemId}
                    copiedItemId={copiedItemId}
                    setCopiedTitles={setCopiedTitles}
                    copiedTitles={copiedTitles}
                  />

                  {userId === item.sender_id &&
                    hoveredMessageId === item.id && (
                      <Alert
                        action={handleDeleteMessage}
                        item={item.id}
                        message={deleteChat_AlertMessage}
                        title="Delete Message"
                      />
                    )}

                  <ChatContent item={item} />

                  {checkNumberOfLines(item.content) > 30 && (
                    <ControlBar
                      item={item}
                      setCopiedItemId={setCopiedItemId}
                      copiedItemId={copiedItemId}
                      setCopiedTitles={setCopiedTitles}
                      copiedTitles={copiedTitles}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
    );
  }
);
ChatView.displayName = "ChatView";

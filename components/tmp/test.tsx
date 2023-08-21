import React, { useState } from "react";

interface InputProps {
  input: string;
  setInput: (value: string) => void;
}

const InputComponent = React.memo(({ input, setInput }: InputProps) => {
  console.log("input");
  return (
    <div>
      <input
        value={input}
        className="border-2 border-gray-200"
        type="text"
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
});

const InputComponent2 = React.memo(({ input, setInput }: InputProps) => {
  console.log("input 2");
  return (
    <div>
      <input
        value={input}
        className="border-2 border-gray-200"
        type="text"
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
});

const InputComponent3 = ({ input, setInput }: InputProps) => {
  console.log("input 3");
  return (
    <div>
      <input
        value={input}
        className="border-2 border-gray-200"
        type="text"
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
};

function Test() {
  const [input, setInput] = useState<string>("");
  const [input2, setInput2] = useState<string>("");
  const [input3, setInput3] = useState<string>("");

  return (
    <div>
      <div className="">
        <div>input</div>
        <InputComponent input={input} setInput={setInput} />
        <InputComponent2 input={input2} setInput={setInput2} />
        <InputComponent3 input={input3} setInput={setInput3} />
      </div>
    </div>
  );
}

export default Test;

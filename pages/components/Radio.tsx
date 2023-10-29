import { useState, useEffect, SyntheticEvent } from "react";
type Props = {
  radio: number;
  setRadio: (selection: number) => void;
};
const RadioGroup = ({ radio, setRadio }: Props) => {
  const handleSection = (e: SyntheticEvent<HTMLInputElement, Event>) => {
    setRadio(parseInt(e.currentTarget.value));
  };
  useEffect(() => {}, [radio]);
  return (
    <div className="flex flex-col">
      <div className="flex flex-row my-2">
        <input
          checked={radio === 1}
          onChange={(e) => {
            handleSection(e);
          }}
          type="radio"
          value="1"
        />
        <label>Rock</label>
      </div>
      <div className="flex flex-row my-2">
        <input
          checked={radio === 2}
          onChange={(e) => {
            handleSection(e);
          }}
          type="radio"
          value="2"
        />
        <label>Paper</label>
      </div>
      <div className="flex flex-row my-2">
        <input
          checked={radio === 3}
          onChange={(e) => {
            handleSection(e);
          }}
          type="radio"
          value="3"
        />
        <label>Scissor</label>
      </div>
      <div className="flex flex-row my-2">
        <input
          checked={radio === 4}
          onChange={(e) => {
            handleSection(e);
          }}
          type="radio"
          value="4"
        />
        <label>Spock</label>
      </div>
      <div className="flex flex-row my-2">
        <input
          checked={radio === 5}
          onChange={(e) => {
            handleSection(e);
          }}
          type="radio"
          value="5"
        />
        <label>Lizard</label>
      </div>
    </div>
  );
};

export default RadioGroup;

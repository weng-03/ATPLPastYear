"use client";

import { useState } from "react";

interface RetakeButtonProps {
  href: string;
  className: string;
  children: React.ReactNode;
  id?: string;
}

export default function RetakeButton({ href, className, children, id }: RetakeButtonProps) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    window.location.href = href;
  };

  return (
    <button
      type="button"
      id={id}
      onClick={handleClick}
      disabled={clicked}
      className={className}
      style={clicked ? { opacity: 0.6, pointerEvents: "none" } : undefined}
    >
      {clicked ? "Loading..." : children}
    </button>
  );
}

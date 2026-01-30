"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface DecryptedTextProps {
    text: string;
    speed?: number;
    maxIterations?: number;
    sequential?: boolean;
    revealDirection?: "start" | "end" | "center";
    useOriginalCharsOnly?: boolean;
    characters?: string;
    className?: string;
    parentClassName?: string;
    encryptedClassName?: string;
    animateOn?: "view" | "hover" | null;
}

export default function DecryptedText({
    text,
    speed = 50,
    maxIterations = 10,
    sequential = false,
    revealDirection = "start",
    useOriginalCharsOnly = false,
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+[]{}|;:,.<>?",
    className = "",
    parentClassName = "",
    encryptedClassName = "",
    animateOn = "hover",
}: DecryptedTextProps) {
    const [displayText, setDisplayText] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let currentIteration = 0;

        const getRandomChar = () => characters[Math.floor(Math.random() * characters.length)];

        const runEffect = () => {
            interval = setInterval(() => {
                setDisplayText((prev) =>
                    text
                        .split("")
                        .map((char, index) => {
                            if (char === " ") return char;
                            if (currentIteration >= maxIterations) return char;
                            return getRandomChar();
                        })
                        .join(""),
                );
                currentIteration++;
                if (currentIteration >= maxIterations) {
                    clearInterval(interval);
                    setDisplayText(text);
                }
            }, speed);
        };

        if (animateOn === "view" && isScrolled) runEffect();
        else if (animateOn === "hover" && isHovering) runEffect();
        else if (animateOn === null) runEffect(); // Always run if null

        return () => clearInterval(interval);
    }, [text, speed, maxIterations, characters, animateOn, isHovering, isScrolled]);

    return (
        <span
            ref={containerRef}
            className={parentClassName}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <span className={className}>{displayText}</span>
        </span>
    );
}

"use client";

import {
  motion,
  type Transition,
  useAnimation,
  type Variants,
} from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/src/lib/utils";
import { useColorScheme } from "@mui/material";

export interface CloudSyncIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CloudSyncIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const SYNC_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: -360,
  },
};

const SYNC_TRANSITION: Transition = {
  duration: 1.5, // Tăng giảm tốc độ xoay tùy ý (giây)
  ease: "linear", // Dùng linear để xoay đều không bị giật
  repeat: Infinity, // Lặp lại vô hạn
  repeatType: "loop", // Kiểu lặp vòng tròn
};

const CloudSyncIcon = forwardRef<CloudSyncIconHandle, CloudSyncIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const sc = useColorScheme();
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    // Tự động chạy animation liên tục khi component mount
    useEffect(() => {
      if (!isControlledRef.current) {
        controls.start("animate");
      }
    }, [controls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    return (
      <div className={cn(className)} {...props}>
        <svg
          fill="none"
          height={size}
          stroke={`#${sc.mode === "light" ? "0000008a" : "ffffff"}`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20.996 15.251A4.5 4.5 0 0 0 17.495 8h-1.79a7 7 0 1 0-12.709 5.607" />
          <motion.g
            animate={controls}
            initial="normal"
            transition={SYNC_TRANSITION}
            variants={SYNC_VARIANTS}
          >
            <path d="m17 18-1.535 1.605a5 5 0 0 1-8-1.5" />
            <path d="M17 22v-4h-4" />
            <path d="M7 10v4h4" />
            <path d="m7 14 1.535-1.605a5 5 0 0 1 8 1.5" />
          </motion.g>
        </svg>
      </div>
    );
  },
);

CloudSyncIcon.displayName = "CloudSyncIcon";

export { CloudSyncIcon };

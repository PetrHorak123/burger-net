"use client";

import { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  title: string;
}

export default function Modal({ children, title }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-amber-500 px-6 py-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

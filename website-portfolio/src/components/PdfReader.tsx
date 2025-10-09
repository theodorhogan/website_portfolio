import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import "./PdfReader.css";

type PdfReaderProps = {
  pdfUrl: string;
  title?: string;
  defaultOpen?: boolean;
};

export function PdfReader({
  pdfUrl,
  title = "Document Viewer",
  defaultOpen = true,
}: PdfReaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [position, setPosition] = useState({ x: 96, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const pointerOffset = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    pointerId.current = event.pointerId;
    pointerOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !isOpen) return;
    setPosition({
      x: event.clientX - pointerOffset.current.x,
      y: event.clientY - pointerOffset.current.y,
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    setIsDragging(false);
    pointerId.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <section
      className="pdf-reader"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      aria-label="PDF reader window"
    >
      <header
        className="pdf-reader__titleBar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="pdf-reader__title">{title}</span>
        <button
          type="button"
          className="pdf-reader__close"
          onClick={() => setIsOpen(false)}
          aria-label="Close PDF reader"
        >
          ✕
        </button>
      </header>
      <div className="pdf-reader__body">
        <iframe
          src={pdfUrl}
          title={title}
          className="pdf-reader__frame"
          aria-label="PDF content"
        />
      </div>
    </section>
  );
}

import type { BoardProps } from "@/components/Board";

// Test helper: replaces Board; `boardMock.props` holds the last props so tests can fire onMove.
export const boardMock: { props: BoardProps | null; capture: (p: BoardProps) => void } = {
  props: null,
  capture(p) {
    this.props = p;
  },
};

export function MockBoard(props: BoardProps) {
  boardMock.capture(props);
  return <div data-testid="board" data-fen={props.fen} data-movable={String(props.movable)} />;
}
